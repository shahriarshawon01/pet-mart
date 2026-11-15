<?php

namespace App\Notifications;

use App\Models\Product;
use App\Notifications\Channels\AdminDatabaseChannel;
use Illuminate\Notifications\Notification;

class ListingSubmitted extends Notification
{
    public function __construct(private Product $product, private bool $resubmitted = false)
    {
    }

    public function via(object $notifiable): array
    {
        return [AdminDatabaseChannel::class];
    }

    public function databaseType(object $notifiable): string
    {
        return $this->resubmitted ? 'listing_resubmitted' : 'listing_submitted';
    }

    public function toDatabase(object $notifiable): array
    {
        $p = $this->product;

        return [
            'product_id'  => $p->id,
            'title'       => $p->title,
            'seller_name' => $p->user?->name,
            'category'    => $p->category?->name,
            'price'       => $p->price !== null ? (float) $p->price : null,
            'is_free'     => (bool) $p->is_free,
            'image'       => $p->primaryImage?->image_path,
        ];
    }
}
