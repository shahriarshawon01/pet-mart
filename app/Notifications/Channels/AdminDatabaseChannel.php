<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Channels\DatabaseChannel;
use Illuminate\Notifications\Notification;

/** Database channel that also fills the indexed product_id column, so alerts can be resolved per listing. */
class AdminDatabaseChannel extends DatabaseChannel
{
    protected function buildPayload($notifiable, Notification $notification)
    {
        $payload = parent::buildPayload($notifiable, $notification);
        $payload['product_id'] = $payload['data']['product_id'] ?? null;

        return $payload;
    }
}
