<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Resources\ProductDetailResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Services\AdminNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    private const MAX_PER_PAGE = 50;

    private const PUBLIC_STATUSES = ['active', 'sold'];

    private const LIST_RELATIONS = ['category', 'user', 'primaryImage', 'division', 'district', 'area'];

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search'       => ['nullable', 'string', 'max:100'],
            'category_id'  => ['nullable', 'integer'],
            'category_slug'=> ['nullable', 'string', 'max:120'],
            'division_id'  => ['nullable', 'integer'],
            'district_id'  => ['nullable', 'integer'],
            'area_id'      => ['nullable', 'integer'],
            'min_price'    => ['nullable', 'numeric', 'min:0'],
            'max_price'    => ['nullable', 'numeric', 'min:0'],
            'listing_type' => ['nullable', 'in:sell,adopt,lost,found,stud_service'],
            'featured'     => ['nullable', 'boolean'],
            'sort'         => ['nullable', 'in:latest,price_low,price_high,popular'],
            'per_page'     => ['nullable', 'integer', 'min:1'],
            'attributes'   => ['nullable', 'array', 'max:10'],
        ]);

        $query = Product::active()->with(self::LIST_RELATIONS);

        if ($request->filled('search')) {
            $term = '%' . addcslashes($request->search, '%_\\') . '%';
            $query->where(fn ($q) => $q->where('title', 'like', $term)->orWhere('description', 'like', $term));
        }

        $categoryId = $request->filled('category_slug')
            ? Category::where('slug', $request->category_slug)->value('id')
            : $request->input('category_id');
        if ($request->filled('category_slug') || $request->filled('category_id')) {
            $ids = Category::where('id', $categoryId)->orWhere('parent_id', $categoryId)->pluck('id');
            $query->whereIn('category_id', $ids->isEmpty() ? [0] : $ids);
        }

        foreach (['division_id', 'district_id', 'area_id', 'listing_type'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }
        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        foreach ((array) $request->input('attributes', []) as $key => $val) {
            if (is_scalar($val) && $val !== '') {
                $query->whereHas('attributes', fn ($q) => $q->where('attribute_key', (string) $key)->where('attribute_value', (string) $val));
            }
        }

        match ($request->input('sort', 'latest')) {
            'price_low'  => $query->orderBy('price'),
            'price_high' => $query->orderByDesc('price'),
            'popular'    => $query->orderByDesc('views'),
            default      => $query->latest(),
        };

        $perPage = min((int) $request->input('per_page', 12), self::MAX_PER_PAGE);
        $products = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'status' => true,
            'data'   => ProductResource::collection($products->getCollection()),
            'meta'   => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'per_page'     => $products->perPage(),
                'total'        => $products->total(),
            ],
        ]);
    }

    public function show(Request $request, string $identifier): JsonResponse
    {
        $viewer = auth('sanctum')->user();

        $product = Product::query()
            ->where(function ($q) use ($identifier) {
                $q->where('slug', $identifier);
                if (ctype_digit($identifier)) {
                    $q->orWhere('id', (int) $identifier);
                }
            })
            ->where(function ($q) use ($viewer) {
                $q->whereIn('status', self::PUBLIC_STATUSES);
                if ($viewer) {
                    $q->orWhere('user_id', $viewer->id);
                }
            })
            ->with(['category', 'user', 'images', 'attributes', 'division', 'district', 'area'])
            ->firstOrFail();

        if ($product->user_id !== $viewer?->id && $product->status === 'active') {
            $visitor = $viewer?->id ?? sha1((string) $request->ip() . '|' . $request->userAgent());
            if (Cache::add("product_view:{$product->id}:{$visitor}", 1, now()->addHour())) {
                $product->increment('views');
            }
        }

        return response()->json([
            'status' => true,
            'data'   => new ProductDetailResource($product),
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = DB::transaction(function () use ($request) {
            $product = Product::create($this->listingFields($request) + [
                'user_id' => $request->user()->id,
                'slug'    => $this->uniqueSlug($request->title),
                'status'  => 'pending',
            ]);
            $this->syncImagesAndAttributes($product, $request);

            return $product;
        });

        $this->notifyAdmins($product, false);

        return response()->json([
            'status'  => true,
            'message' => 'Listing submitted. Our moderators will review it before it goes live.',
            'data'    => new ProductDetailResource($product->load(['category', 'user', 'images', 'attributes', 'division', 'district', 'area'])),
        ], 201);
    }

    public function update(StoreProductRequest $request, int $id): JsonResponse
    {
        $product = Product::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();

        if (in_array($product->status, ['sold', 'expired'], true)) {
            return response()->json(['status' => false, 'message' => 'Sold or expired listings cannot be edited.'], 422);
        }

        DB::transaction(function () use ($product, $request) {
            $product->update($this->listingFields($request) + ['status' => 'pending', 'rejection_reason' => null]);
            $this->syncImagesAndAttributes($product, $request);
        });

        $this->notifyAdmins($product, true);

        return response()->json([
            'status'  => true,
            'message' => 'Listing updated. It will be reviewed again before it goes live.',
            'data'    => new ProductDetailResource($product->fresh(['category', 'user', 'images', 'attributes', 'division', 'district', 'area'])),
        ]);
    }

    public function myListings(Request $request): JsonResponse
    {
        $products = Product::where('user_id', $request->user()->id)
            ->with(['category', 'primaryImage'])
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'data'   => ProductResource::collection($products),
        ]);
    }

    public function markAsSold(Request $request, int $id): JsonResponse
    {
        $product = Product::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();

        if ($product->status !== 'active') {
            return response()->json(['status' => false, 'message' => 'Only live listings can be marked as sold.'], 422);
        }

        $product->update(['status' => 'sold']);

        return response()->json([
            'status'  => true,
            'message' => 'Listing marked as sold.',
            'data'    => new ProductResource($product->load(['category', 'primaryImage'])),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        Product::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail()->delete();

        return response()->json(['status' => true, 'message' => 'Listing deleted.']);
    }

    private function listingFields(StoreProductRequest $request): array
    {
        $isFree = $request->boolean('is_free');

        return [
            'category_id'   => $request->category_id,
            'title'         => $request->title,
            'description'   => $request->description,
            'price'         => $isFree ? 0 : $request->price,
            'is_free'       => $isFree,
            'is_negotiable' => ! $isFree && $request->boolean('is_negotiable'),
            'listing_type'  => $request->listing_type,
            'condition'     => $request->condition,
            'division_id'   => $request->division_id,
            'district_id'   => $request->district_id,
            'area_id'       => $request->area_id,
            'full_address'  => $request->full_address,
        ];
    }

    private function syncImagesAndAttributes(Product $product, StoreProductRequest $request): void
    {
        $product->images()->delete();
        foreach (array_values($request->input('images', [])) as $index => $path) {
            $product->images()->create([
                'image_path' => $path,
                'is_primary' => $index === 0,
                'sort_order' => $index,
            ]);
        }

        $product->attributes()->delete();
        foreach ($request->attributeValues() as $key => $value) {
            $product->attributes()->create(['attribute_key' => $key, 'attribute_value' => $value]);
        }
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug(Str::limit($title, 80, '')) ?: 'listing';

        do {
            $slug = $base . '-' . Str::lower(Str::random(6));
        } while (Product::withTrashed()->where('slug', $slug)->exists());

        return $slug;
    }

    private function notifyAdmins(Product $product, bool $resubmitted): void
    {
        try {
            AdminNotifier::listingSubmitted($product, $resubmitted);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
