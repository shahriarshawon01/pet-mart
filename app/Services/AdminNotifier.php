<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use App\Notifications\ListingSubmitted;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Notification;

class AdminNotifier
{
    /** Tells every active admin a listing is waiting for review. One unread alert per listing: older unread ones are replaced. */
    public static function listingSubmitted(Product $product, bool $resubmitted = false): void
    {
        $admins = User::where('type', 1)->where('status', true)->get();
        if ($admins->isEmpty()) {
            return;
        }

        DatabaseNotification::where('product_id', $product->id)->whereNull('read_at')->delete();

        $product->loadMissing(['user:id,name', 'category:id,name', 'primaryImage']);
        Notification::send($admins, new ListingSubmitted($product, $resubmitted));
    }

    /** Once a listing has been moderated or removed, its alerts are no longer actionable for anyone. */
    public static function resolveListing(int $productId): void
    {
        DatabaseNotification::where('product_id', $productId)->whereNull('read_at')->update(['read_at' => now()]);
    }
}
