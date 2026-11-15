<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Location;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use App\Services\AdminNotifier;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminNotificationsTest extends TestCase
{
    use DatabaseTransactions;

    private function makeUser(array $attrs = []): User
    {
        return User::create($attrs + [
            'name'     => 'Person ' . Str::random(4),
            'phone'    => '+88019' . str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT),
            'password' => Hash::make('secret123'),
            'type'     => 2,
            'status'   => true,
        ]);
    }

    private function makeAdmin(bool $active = true): User
    {
        return $this->makeUser(['type' => 1, 'role_id' => Role::value('id'), 'status' => $active]);
    }

    private function makeCategory(): Category
    {
        return Category::create(['name' => 'Birds ' . Str::random(4), 'slug' => 'birds-' . Str::lower(Str::random(6)), 'status' => true]);
    }

    private function makeProduct(string $status = 'pending'): Product
    {
        return Product::create([
            'user_id'      => $this->makeUser()->id,
            'category_id'  => $this->makeCategory()->id,
            'title'        => 'Budgie pair ' . Str::random(4),
            'slug'         => 'budgie-' . Str::lower(Str::random(8)),
            'description'  => 'A healthy budgie pair with cage included.',
            'listing_type' => 'sell',
            'price'        => 2500,
            'status'       => $status,
        ]);
    }

    private function actAsAdmin(User $admin): void
    {
        $this->actingAs($admin, 'web');
        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    public function test_submitting_a_listing_notifies_active_admins_only(): void
    {
        Storage::fake('public');
        $admin = $this->makeAdmin();
        $inactive = $this->makeAdmin(false);
        $seller = $this->makeUser();
        $division = Location::where('type', 'division')->first();
        $district = Location::where('type', 'district')->where('parent_id', $division->id)->first();
        Storage::disk('public')->put('products/2026/11/n.jpg', 'x');

        Sanctum::actingAs($seller);
        $id = $this->postJson('/api/v1/products', [
            'title'        => 'Lovebird pair for sale',
            'description'  => 'Healthy lovebird pair, hand fed and tame.',
            'category_id'  => $this->makeCategory()->id,
            'listing_type' => 'sell',
            'division_id'  => $division->id,
            'district_id'  => $district?->id,
            'images'       => ['products/2026/11/n.jpg'],
        ])->assertCreated()->json('data.id');

        $this->assertSame(1, $admin->unreadNotifications()->where('product_id', $id)->count());
        $this->assertSame(0, $inactive->notifications()->count());
        $this->assertSame(0, $seller->notifications()->count());
        $this->assertSame('listing_submitted', $admin->notifications()->first()->type);
    }

    public function test_resubmission_replaces_the_unread_alert(): void
    {
        $admin = $this->makeAdmin();
        $product = $this->makeProduct();

        AdminNotifier::listingSubmitted($product);
        AdminNotifier::listingSubmitted($product, true);

        $rows = $admin->notifications()->where('product_id', $product->id)->get();
        $this->assertCount(1, $rows);
        $this->assertSame('listing_resubmitted', $rows->first()->type);
    }

    public function test_admin_lists_reads_and_removes_notifications(): void
    {
        $admin = $this->makeAdmin();
        $first = $this->makeProduct();
        $second = $this->makeProduct();
        AdminNotifier::listingSubmitted($first);
        $this->travel(1)->seconds();
        AdminNotifier::listingSubmitted($second);
        $this->actAsAdmin($admin);

        $res = $this->getJson('/api/v1/admin/notifications')->assertOk();
        $this->assertSame(2, $res->json('result.unread_count'));
        $this->assertSame($second->id, $res->json('result.data.0.product.id'));
        $this->assertSame('pending', $res->json('result.data.0.product.status'));

        $this->getJson('/api/v1/admin/notifications/summary')->assertOk()->assertJsonPath('result.unread_count', 2);

        $nid = $res->json('result.data.0.id');
        $this->postJson("/api/v1/admin/notifications/{$nid}/read")->assertOk()->assertJsonPath('result.unread_count', 1);
        $this->assertCount(1, $this->getJson('/api/v1/admin/notifications?filter=unread')->json('result.data'));

        $this->postJson('/api/v1/admin/notifications/read-all')->assertOk();
        $this->assertSame(0, $admin->unreadNotifications()->count());

        $this->deleteJson("/api/v1/admin/notifications/{$nid}")->assertOk();
        $this->assertSame(1, $admin->notifications()->count());
    }

    public function test_admin_cannot_touch_another_admins_notifications(): void
    {
        $owner = $this->makeAdmin();
        AdminNotifier::listingSubmitted($this->makeProduct());
        $nid = $owner->notifications()->value('id');

        $this->actAsAdmin($this->makeAdmin());
        $this->postJson("/api/v1/admin/notifications/{$nid}/read")->assertNotFound();
        $this->deleteJson("/api/v1/admin/notifications/{$nid}")->assertNotFound();
        $this->assertNull($owner->notifications()->value('read_at'));
    }

    public function test_moderating_a_listing_resolves_its_alerts_for_everyone(): void
    {
        $a = $this->makeAdmin();
        $b = $this->makeAdmin();
        $product = $this->makeProduct();
        AdminNotifier::listingSubmitted($product);

        $this->actAsAdmin($a);
        $this->getJson("/api/v1/admin/moderation/{$product->id}")->assertOk()->assertJsonPath('result.id', $product->id);
        $this->postJson("/api/v1/admin/moderation/{$product->id}/approve")->assertOk();

        $this->assertSame(0, $a->unreadNotifications()->count());
        $this->assertSame(0, $b->unreadNotifications()->count());
    }

    public function test_notification_endpoints_require_admin(): void
    {
        $this->getJson('/api/v1/admin/notifications')->assertUnauthorized();
        $this->getJson('/api/v1/admin/notifications/summary')->assertUnauthorized();
    }
}
