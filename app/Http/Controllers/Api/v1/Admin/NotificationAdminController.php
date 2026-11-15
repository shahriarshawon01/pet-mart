<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Models\Product;
use App\Services\ImageStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationAdminController extends AdminController
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['filter' => ['nullable', 'in:all,unread']]);
        $user = $request->user();

        $page = $user->notifications()
            ->when($request->input('filter') === 'unread', fn ($q) => $q->whereNull('read_at'))
            ->paginate($this->perPage($request, 10));

        $products = Product::withTrashed()
            ->whereIn('id', collect($page->items())->pluck('product_id')->filter()->unique())
            ->get(['id', 'status', 'deleted_at'])
            ->keyBy('id');

        $result = $this->paginated($page, fn (DatabaseNotification $n) => $this->present($n, $products->get($n->product_id)));
        $result['unread_count'] = $user->unreadNotifications()->count();

        return $this->ok($result);
    }

    public function summary(Request $request): JsonResponse
    {
        $latest = $request->user()->unreadNotifications()->first();

        return $this->ok([
            'unread_count' => $request->user()->unreadNotifications()->count(),
            'latest'       => $latest ? $this->present($latest, null) : null,
        ]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $request->user()->notifications()->whereKey($id)->firstOrFail()->markAsRead();

        return $this->ok(['unread_count' => $request->user()->unreadNotifications()->count()]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return $this->ok(['unread_count' => 0], 'All notifications marked as read.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $request->user()->notifications()->whereKey($id)->firstOrFail()->delete();

        return $this->ok(['unread_count' => $request->user()->unreadNotifications()->count()]);
    }

    private function present(DatabaseNotification $n, ?Product $product): array
    {
        $d = $n->data;

        return [
            'id'         => $n->id,
            'type'       => $n->type,
            'product'    => [
                'id'          => $d['product_id'] ?? null,
                'title'       => $d['title'] ?? 'Listing',
                'seller_name' => $d['seller_name'] ?? null,
                'category'    => $d['category'] ?? null,
                'price'       => $d['price'] ?? null,
                'is_free'     => (bool) ($d['is_free'] ?? false),
                'image'       => ImageStorage::url($d['image'] ?? null),
                'status'      => $product ? ($product->trashed() ? 'deleted' : $product->status) : null,
            ],
            'is_read'    => $n->read_at !== null,
            'created_at' => $n->created_at?->toIso8601String(),
        ];
    }
}
