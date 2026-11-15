<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Models\AdminModerationLog;
use App\Models\Product;
use App\Services\AdminNotifier;
use App\Services\ImageStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ModerationController extends AdminController
{
    private const STATUSES = ['pending', 'active', 'rejected', 'sold', 'expired'];

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status'       => ['nullable', 'in:all,' . implode(',', self::STATUSES)],
            'keyword'      => ['nullable', 'string', 'max:100'],
            'category_id'  => ['nullable', 'integer'],
            'listing_type' => ['nullable', 'in:sell,adopt,lost,found,stud_service'],
            'featured'     => ['nullable', 'in:0,1'],
            'sort'         => ['nullable', 'in:newest,oldest,price_high,price_low,views'],
        ]);

        $status = $request->input('status') ?: 'pending';

        $query = Product::query()
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($request->filled('keyword'), function ($q) use ($request) {
                $term = $this->like($request->keyword);
                $q->where(fn ($w) => $w->where('title', 'like', $term)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $term)->orWhere('phone', 'like', $term)));
            })
            ->when($request->filled('category_id'), function ($q) use ($request) {
                $ids = \App\Models\Category::where('id', $request->category_id)->orWhere('parent_id', $request->category_id)->pluck('id');
                $q->whereIn('category_id', $ids);
            })
            ->when($request->filled('listing_type'), fn ($q) => $q->where('listing_type', $request->listing_type))
            ->when($request->filled('featured'), fn ($q) => $q->where('is_featured', (bool) $request->featured))
            ->with(['category.parent', 'user', 'images', 'attributes', 'division', 'district', 'area', 'moderationLogs.admin:id,name']);

        match ($request->input('sort') ?: ($status === 'pending' ? 'oldest' : 'newest')) {
            'oldest'     => $query->oldest(),
            'price_high' => $query->orderByDesc('price'),
            'price_low'  => $query->orderBy('price'),
            'views'      => $query->orderByDesc('views'),
            default      => $query->latest(),
        };

        $page = $query->paginate($this->perPage($request));

        $result = $this->paginated($page, fn (Product $p) => $this->present($p));
        $counts = Product::select('status', DB::raw('count(*) as total'))->groupBy('status')->pluck('total', 'status');
        $counts['all'] = $counts->sum();
        $result['counts'] = $counts;
        $result['categories'] = \App\Models\Category::whereNull('parent_id')->with('children:id,parent_id,name')->orderBy('sort_order')->get(['id', 'name']);

        return $this->ok($result);
    }

    public function show(int $id): JsonResponse
    {
        $product = Product::with(['category.parent', 'user', 'images', 'attributes', 'division', 'district', 'area', 'moderationLogs.admin:id,name'])
            ->find($id);
        if (! $product) {
            return $this->error('This listing has been deleted.', 404);
        }

        return $this->ok($this->present($product));
    }

    /** Soft delete (kept for the audit trail; removed for good by listings:prune after 30 days). */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        DB::transaction(function () use ($product, $request) {
            AdminModerationLog::create([
                'product_id' => $product->id,
                'admin_id'   => $request->user()->id,
                'action'     => 'deleted',
                'reason'     => null,
            ]);
            $product->update(['is_featured' => false]);
            $product->delete();
        });
        AdminNotifier::resolveListing($product->id);

        return $this->ok(null, 'Listing deleted.');
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        if (! in_array($product->status, ['pending', 'rejected'], true)) {
            return $this->error('Only pending or rejected listings can be approved.');
        }

        $this->transition($product, $request, 'active', 'approved', 'Approved by moderator.');

        return $this->ok(['id' => $product->id, 'status' => 'active'], 'Listing approved and now live.');
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:500']]);

        $product = Product::findOrFail($id);
        if (! in_array($product->status, ['pending', 'active'], true)) {
            return $this->error('Only pending or live listings can be rejected.');
        }

        $this->transition($product, $request, 'rejected', 'rejected', $data['reason'], $data['reason']);

        return $this->ok(['id' => $product->id, 'status' => 'rejected'], 'Listing rejected. The seller can see the reason.');
    }

    public function toggleFeatured(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        if ($product->status !== 'active') {
            return $this->error('Only live listings can be featured.');
        }

        $product->update(['is_featured' => ! $product->is_featured]);
        AdminModerationLog::create([
            'product_id' => $product->id,
            'admin_id'   => $request->user()->id,
            'action'     => $product->is_featured ? 'featured' : 'unfeatured',
            'reason'     => null,
        ]);

        return $this->ok(['id' => $product->id, 'is_featured' => $product->is_featured],
            $product->is_featured ? 'Listing is now featured.' : 'Listing removed from featured.');
    }

    private function transition(Product $product, Request $request, string $status, string $action, ?string $reason, ?string $rejection = null): void
    {
        DB::transaction(function () use ($product, $request, $status, $action, $reason, $rejection) {
            $product->update([
                'status'           => $status,
                'rejection_reason' => $rejection,
                'is_featured'      => $status === 'active' ? $product->is_featured : false,
            ]);
            AdminModerationLog::create([
                'product_id' => $product->id,
                'admin_id'   => $request->user()->id,
                'action'     => $action,
                'reason'     => $reason,
            ]);
        });

        AdminNotifier::resolveListing($product->id);
    }

    private function present(Product $p): array
    {
        return [
            'id'               => $p->id,
            'title'            => $p->title,
            'slug'             => $p->slug,
            'description'      => $p->description,
            'price'            => $p->price !== null ? (float) $p->price : null,
            'is_free'          => (bool) $p->is_free,
            'is_negotiable'    => (bool) $p->is_negotiable,
            'is_featured'      => (bool) $p->is_featured,
            'listing_type'     => $p->listing_type,
            'condition'        => $p->condition,
            'status'           => $p->status,
            'rejection_reason' => $p->rejection_reason,
            'views'            => (int) $p->views,
            'category'         => $p->category ? [
                'id'     => $p->category->id,
                'name'   => $p->category->name,
                'parent' => $p->category->parent?->name,
            ] : null,
            'seller' => $p->user ? [
                'id'          => $p->user->id,
                'name'        => $p->user->name,
                'phone'       => $p->user->phone,
                'email'       => $p->user->email,
                'is_verified' => (bool) $p->user->is_verified,
                'status'      => (bool) $p->user->status,
                'joined_at'   => $p->user->created_at?->toIso8601String(),
            ] : null,
            'location'   => collect([$p->area?->name, $p->district?->name, $p->division?->name])->filter()->implode(', '),
            'address'    => $p->full_address,
            'images'     => $p->images->map(fn ($img) => ImageStorage::url($img->image_path))->values(),
            'attributes' => $p->attributes->map(fn ($a) => ['key' => $a->attribute_key, 'value' => $a->attribute_value])->values(),
            'history'    => $p->moderationLogs->take(5)->map(fn ($log) => [
                'action'     => $log->action,
                'reason'     => $log->reason,
                'admin'      => $log->admin?->name,
                'created_at' => $log->created_at?->toIso8601String(),
            ])->values(),
            'created_at' => $p->created_at?->toIso8601String(),
            'updated_at' => $p->updated_at?->toIso8601String(),
        ];
    }
}
