<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Models\User;
use App\Services\ImageStorage;
use App\Support\PhoneNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class MemberAdminController extends AdminController
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'keyword'     => ['nullable', 'string', 'max:100'],
            'status'      => ['nullable', 'in:0,1'],
            'is_verified' => ['nullable', 'in:0,1'],
        ]);

        $page = $this->members()
            ->when($request->filled('keyword'), function ($q) use ($request) {
                $term = $this->like($request->keyword);
                $q->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('phone', 'like', $term)->orWhere('email', 'like', $term));
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', (bool) $request->status))
            ->when($request->filled('is_verified'), fn ($q) => $q->where('is_verified', (bool) $request->is_verified))
            ->with('location:id,name')
            ->withCount([
                'products',
                'products as active_products_count' => fn ($q) => $q->where('status', 'active'),
            ])
            ->latest()
            ->paginate($this->perPage($request, 20));

        $result = $this->paginated($page, fn (User $u) => $this->present($u));
        $result['counts'] = [
            'total'    => $this->members()->count(),
            'active'   => $this->members()->where('status', true)->count(),
            'inactive' => $this->members()->where('status', false)->count(),
            'verified' => $this->members()->where('is_verified', true)->count(),
        ];

        return $this->ok($result);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $member = $this->members()->findOrFail($id);

        if ($request->filled('phone')) {
            $request->merge(['phone' => PhoneNumber::normalize($request->phone)]);
        }

        $data = $request->validate([
            'name'        => ['required', 'string', 'min:2', 'max:100'],
            'phone'       => ['required', 'regex:' . PhoneNumber::PATTERN, Rule::unique('users', 'phone')->ignore($member->id)],
            'email'       => ['nullable', 'email', 'max:150', Rule::unique('users', 'email')->ignore($member->id)],
            'is_verified' => ['required', 'boolean'],
            'status'      => ['required', 'boolean'],
            'image'       => ['nullable', 'string', 'max:255', 'regex:#^avatars/[\w/.-]+$#'],
        ], [
            'phone.regex'  => 'Enter a valid Bangladesh mobile number, e.g. 01712345678.',
            'phone.unique' => 'Another account already uses this mobile number.',
            'image.regex'  => 'Upload the photo again.',
        ]);

        if (! empty($data['image']) && (str_contains($data['image'], '..') || ! Storage::disk('public')->exists($data['image']))) {
            return response()->json(['message' => 'The photo was not found. Upload it again.', 'errors' => ['image' => ['The photo was not found. Upload it again.']]], 422);
        }
        if (! $request->has('image')) {
            unset($data['image']);
        }

        DB::transaction(function () use ($member, $data) {
            $member->update($data);
            if (! $member->status) {
                $member->tokens()->delete();
            }
        });

        return $this->ok($this->present($member), 'Member updated.');
    }

    public function toggleVerification(int $id): JsonResponse
    {
        $member = $this->members()->findOrFail($id);
        $member->update(['is_verified' => ! $member->is_verified]);

        return $this->ok($this->present($member), $member->is_verified ? 'Mobile number marked as verified.' : 'Number verification removed.');
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $member = $this->members()->findOrFail($id);

        DB::transaction(function () use ($member) {
            $member->update(['status' => ! $member->status]);
            if (! $member->status) {
                $member->tokens()->delete();
            }
        });

        return $this->ok($this->present($member), $member->status ? 'Member activated.' : 'Member deactivated and signed out.');
    }

    public function destroy(int $id): JsonResponse
    {
        $member = $this->members()->findOrFail($id);

        DB::transaction(function () use ($member) {
            $member->tokens()->delete();
            $member->delete();
        });

        return $this->ok(null, 'Member deleted.');
    }

    private function members()
    {
        return User::where('type', '!=', 1);
    }

    private function present(User $u): array
    {
        return [
            'id'                    => $u->id,
            'name'                  => $u->name,
            'phone'                 => $u->phone,
            'email'                 => $u->email,
            'image'                 => ImageStorage::url($u->image),
            'image_path'            => $u->image,
            'location'              => $u->relationLoaded('location') ? $u->location?->name : null,
            'is_verified'           => (bool) $u->is_verified,
            'status'                => (bool) $u->status,
            'products_count'        => (int) ($u->products_count ?? 0),
            'active_products_count' => (int) ($u->active_products_count ?? 0),
            'created_at'            => $u->created_at?->toIso8601String(),
        ];
    }
}
