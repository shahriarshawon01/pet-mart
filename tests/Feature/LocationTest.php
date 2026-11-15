<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class LocationTest extends TestCase
{
    use DatabaseTransactions;

    private function signInAdmin(): void
    {
        $admin = User::create([
            'name' => 'Loc Admin', 'phone' => '+88016' . random_int(10000000, 99999999),
            'email' => Str::random(8) . '@example.com', 'password' => Hash::make('secret123'), 'type' => 1, 'status' => true,
        ]);
        $this->actingAs($admin, 'web');
        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    public function test_public_tree_hides_inactive_branches(): void
    {
        $div = Location::create(['type' => 'division', 'name' => 'Test Div', 'slug' => 'test-div-' . Str::random(5), 'status' => false]);
        $dist = Location::create(['type' => 'district', 'parent_id' => $div->id, 'name' => 'Test Dist', 'slug' => 'test-dist', 'status' => true]);

        $data = $this->getJson('/api/v1/locations')->assertOk()->json('data');

        $this->assertNotContains($div->id, array_column($data['divisions'], 'id'));
        $this->assertNotContains($dist->id, array_column($data['districts'], 'id'));
        $this->assertArrayNotHasKey('created_at', $data['divisions'][0] ?? []);
    }

    public function test_admin_location_crud_and_guards(): void
    {
        $this->signInAdmin();

        $divId = $this->postJson('/api/v1/admin/locations', ['name' => 'Zeta Division ' . Str::random(4)])->assertCreated()->json('result.id');
        $distId = $this->postJson('/api/v1/admin/locations', ['name' => 'Zeta District', 'parent_id' => $divId])->assertCreated()->json('result.id');
        $areaId = $this->postJson('/api/v1/admin/locations', ['name' => 'Zeta Area', 'parent_id' => $distId])->assertCreated()->json('result.id');

        $this->assertSame('district', Location::find($distId)->type);
        $this->assertSame('area', Location::find($areaId)->type);

        $this->postJson('/api/v1/admin/locations', ['name' => 'Too deep', 'parent_id' => $areaId])->assertUnprocessable();
        $this->postJson('/api/v1/admin/locations', ['name' => 'Zeta Area', 'parent_id' => $distId])->assertUnprocessable();
        $this->deleteJson("/api/v1/admin/locations/{$distId}")->assertUnprocessable();

        $this->postJson("/api/v1/admin/locations/{$areaId}/toggle-status")->assertOk();
        $this->assertFalse(Location::find($areaId)->status);

        $this->deleteJson("/api/v1/admin/locations/{$areaId}")->assertOk();
        $this->assertNull(Location::find($areaId));
    }

    public function test_duplicate_and_similar_location_names(): void
    {
        $this->signInAdmin();
        $divId = $this->postJson('/api/v1/admin/locations', ['name' => 'Qorvex Division'])->assertCreated()->json('result.id');
        $distId = $this->postJson('/api/v1/admin/locations', ['name' => 'Qorvexpur', 'bn_name' => 'কোরভেক্সপুর', 'parent_id' => $divId])->assertCreated()->json('result.id');

        $this->postJson('/api/v1/admin/locations', ['name' => ' qorvex-PUR ', 'parent_id' => $divId])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->postJson('/api/v1/admin/locations', ['name' => 'Totally New', 'bn_name' => 'কোরভেক্সপুর', 'parent_id' => $divId])
            ->assertUnprocessable()->assertJsonValidationErrors('bn_name');

        $other = Location::where('type', 'division')->whereKeyNot($divId)->value('id');
        $this->postJson('/api/v1/admin/locations', ['name' => 'Qorvexpur', 'parent_id' => $other])
            ->assertUnprocessable()->assertJsonValidationErrors('name');

        $res = $this->postJson('/api/v1/admin/locations', ['name' => 'Qorvexpoor', 'parent_id' => $divId])->assertStatus(409);
        $this->assertSame($distId, $res->json('similar.0.id'));
        $this->assertFalse(Location::where('name', 'Qorvexpoor')->exists());

        $this->postJson('/api/v1/admin/locations', ['name' => 'Qorvexpoor', 'parent_id' => $divId, 'confirm_similar' => 1])->assertCreated();

        $this->putJson("/api/v1/admin/locations/{$distId}", ['name' => 'Qorvexpur', 'bn_name' => 'কোরভেক্সপুর', 'sort_order' => 3])->assertOk();

        $areaId = $this->postJson('/api/v1/admin/locations', ['name' => 'Zentro Bagh', 'parent_id' => $distId])->assertCreated()->json('result.id');
        $this->assertNotNull($areaId);
        $this->postJson('/api/v1/admin/locations', ['name' => 'Sektor 2', 'parent_id' => $distId])->assertCreated();
        foreach (['Sektor two', 'Sektor-2nd', 'Sektor II', 'Sektor ২', 'sektor second'] as $variant) {
            $this->postJson('/api/v1/admin/locations', ['name' => $variant, 'parent_id' => $distId])
                ->assertUnprocessable()->assertJsonValidationErrors('name');
        }
        $this->postJson('/api/v1/admin/locations', ['name' => 'Sektor 3', 'parent_id' => $distId])->assertCreated();
        $otherDistrict = Location::where('type', 'district')->whereKeyNot($distId)->value('id');
        $this->postJson('/api/v1/admin/locations', ['name' => 'Zentro Bagh', 'parent_id' => $otherDistrict])->assertCreated();
    }
}
