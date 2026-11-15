<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Models\Location;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LocationAdminController extends AdminController
{
    private const LISTING_COLUMN = ['division' => 'division_id', 'district' => 'district_id', 'area' => 'area_id'];

    public function index(): JsonResponse
    {
        $rows = Location::orderBy('sort_order')->orderBy('name')->get();

        $listings = [];
        foreach (self::LISTING_COLUMN as $column) {
            Product::whereNotNull($column)->select($column, DB::raw('count(*) as total'))->groupBy($column)
                ->pluck('total', $column)->each(function ($total, $id) use (&$listings) {
                    $listings[$id] = ($listings[$id] ?? 0) + $total;
                });
        }
        $children = $rows->whereNotNull('parent_id')->countBy('parent_id');

        return $this->ok([
            'data' => $rows->map(fn (Location $l) => [
                'id'             => $l->id,
                'parent_id'      => $l->parent_id,
                'type'           => $l->type,
                'name'           => $l->name,
                'bn_name'        => $l->bn_name,
                'sort_order'     => $l->sort_order,
                'status'         => $l->status,
                'children_count' => (int) ($children[$l->id] ?? 0),
                'listings_count' => (int) ($listings[$l->id] ?? 0),
            ])->values(),
            'counts' => $rows->countBy('type'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $parent = $request->filled('parent_id') ? Location::findOrFail($request->parent_id) : null;
        $type = $parent ? $parent->childType() : 'division';
        if (! $type) {
            return $this->error('Areas cannot have sub-locations.');
        }

        $data = $this->validated($request);
        if ($conflict = $this->duplicateCheck($request, $data, $type, $parent?->id)) {
            return $conflict;
        }
        $location = Location::create($data + ['parent_id' => $parent?->id, 'type' => $type]);

        return $this->ok(['id' => $location->id], ucfirst($type) . ' added.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $location = Location::findOrFail($id);
        $data = $this->validated($request);
        if ($conflict = $this->duplicateCheck($request, $data, $location->type, $location->parent_id, $location)) {
            return $conflict;
        }
        $location->update($data);

        return $this->ok(['id' => $location->id], ucfirst($location->type) . ' updated.');
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $location = Location::findOrFail($id);
        $location->update(['status' => ! $location->status]);

        return $this->ok(['id' => $location->id, 'status' => $location->status],
            $location->status ? "{$location->name} is shown on the website." : "{$location->name} is hidden from the website.");
    }

    public function destroy(int $id): JsonResponse
    {
        $location = Location::withCount('children')->findOrFail($id);

        if ($location->children_count) {
            return $this->error("{$location->name} has {$location->children_count} sub-location(s). Remove them first, or hide this location instead.");
        }
        $used = Product::withTrashed()->where(self::LISTING_COLUMN[$location->type], $location->id)->count()
            + User::where('location_id', $location->id)->count();
        if ($used) {
            return $this->error("{$location->name} is used by {$used} listing(s) or member(s). Hide it instead of deleting it.");
        }

        $location->delete();

        return $this->ok(null, "{$location->name} deleted.");
    }

    private function validated(Request $request): array
    {
        $request->merge(['slug' => Str::slug((string) $request->input('name'))]);

        $data = $request->validate([
            'name'       => ['required', 'string', 'min:2', 'max:100'],
            'slug'       => ['required', 'string'],
            'bn_name'    => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'status'     => ['nullable', 'boolean'],
        ], ['slug.required' => 'Use letters or numbers in the name.']);

        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['status'] = $data['status'] ?? true;

        return $data;
    }

    /**
     * Blocks exact duplicates (ignoring case, spaces and punctuation, or the same Bangla name) and warns about
     * near matches such as "Faridpoor" vs "Faridpur". The admin can confirm a near match with confirm_similar=1.
     * Divisions and districts must be unique nationwide; areas only within their district.
     */
    private function duplicateCheck(Request $request, array $data, string $type, ?int $parentId, ?Location $self = null): ?JsonResponse
    {
        $nameChanged = ! $self || self::normalise($self->name) !== self::normalise($data['name']);
        $bnChanged = ! $self || trim((string) $self->bn_name) !== trim((string) ($data['bn_name'] ?? ''));
        if (! $nameChanged && ! $bnChanged) {
            return null;
        }

        $others = Location::where('type', $type)
            ->when($type === 'area', fn ($q) => $parentId ? $q->where('parent_id', $parentId) : $q->whereNull('parent_id'))
            ->when($self, fn ($q) => $q->whereKeyNot($self->id))
            ->with('parent:id,name')
            ->get(['id', 'parent_id', 'name', 'bn_name', 'status']);

        $name = self::normalise($data['name']);
        $bn = trim((string) ($data['bn_name'] ?? ''));
        $where = fn (Location $l) => ($l->parent ? " in {$l->parent->name}" : '') . ($l->status ? '' : ' (hidden – show it instead)');

        if ($nameChanged && ($same = $others->first(fn ($l) => self::normalise($l->name) === $name))) {
            return $this->fieldError('name', "“{$same->name}” already exists{$where($same)}.");
        }
        if ($bnChanged && $bn !== '' && ($same = $others->first(fn ($l) => trim((string) $l->bn_name) === $bn))) {
            return $this->fieldError('bn_name', "“{$same->name}” already uses the Bangla name {$bn}{$where($same)}.");
        }

        if (! $nameChanged || $request->boolean('confirm_similar')) {
            return null;
        }

        $key = self::soundKey($data['name']);
        $similar = $others->filter(function (Location $l) use ($name, $key) {
            $other = self::normalise($l->name);
            if ($name === '' || $other === '' || preg_replace('/\D/', '', $name) !== preg_replace('/\D/', '', $other)) {
                return false;
            }
            $limit = min(strlen($name), strlen($other)) >= 7 ? 2 : (min(strlen($name), strlen($other)) >= 4 ? 1 : 0);

            return self::soundKey($l->name) === $key || ($name[0] === ($other[0] ?? '') && levenshtein($name, $other) <= $limit);
        })->take(5);

        if ($similar->isEmpty()) {
            return null;
        }

        return response()->json([
            'status'  => 4090,
            'message' => 'A similar ' . $type . ' already exists. Is this the same place?',
            'similar' => $similar->map(fn (Location $l) => [
                'id'      => $l->id,
                'name'    => $l->name,
                'bn_name' => $l->bn_name,
                'parent'  => $l->parent?->name,
                'status'  => $l->status,
            ])->values(),
        ], 409);
    }

    private function fieldError(string $field, string $message): JsonResponse
    {
        return response()->json(['status' => 3000, 'message' => $message, 'errors' => [$field => [$message]]], 422);
    }

    private const NUMBER_WORDS = [
        'one' => '1', 'first' => '1', 'two' => '2', 'second' => '2', 'three' => '3', 'third' => '3',
        'four' => '4', 'fourth' => '4', 'five' => '5', 'fifth' => '5', 'six' => '6', 'sixth' => '6',
        'seven' => '7', 'seventh' => '7', 'eight' => '8', 'eighth' => '8', 'nine' => '9', 'ninth' => '9',
        'ten' => '10', 'tenth' => '10', 'ii' => '2', 'iii' => '3', 'iv' => '4', 'vi' => '6', 'vii' => '7',
        'viii' => '8', 'ix' => '9',
    ];

    /** Comparable form of a name: lower case, no spaces or punctuation, numbers as digits (Nikunja two = Nikunja-2 = Nikunja ২). */
    private static function normalise(string $name): string
    {
        $name = strtr($name, ['০' => '0', '১' => '1', '২' => '2', '৩' => '3', '৪' => '4', '৫' => '5', '৬' => '6', '৭' => '7', '৮' => '8', '৯' => '9']);
        $tokens = preg_split('/[^a-z0-9]+/', Str::lower(Str::ascii($name)), -1, PREG_SPLIT_NO_EMPTY);

        return implode('', array_map(function (string $t) {
            if (preg_match('/^(\d+)(st|nd|rd|th)$/', $t, $m)) {
                return $m[1];
            }

            return self::NUMBER_WORDS[$t] ?? $t;
        }, $tokens));
    }

    /** Rough sound-alike key for romanised Bangla names: Faridpoor = Faridpur, Mymensing = Mymensingh, Jessore ≈ Jesore. */
    private static function soundKey(string $name): string
    {
        $s = self::normalise($name);
        $s = strtr($s, ['oo' => 'u', 'ou' => 'u', 'ee' => 'i', 'ea' => 'i', 'ph' => 'f', 'bh' => 'b', 'dh' => 'd',
            'th' => 't', 'kh' => 'k', 'gh' => 'g', 'ch' => 'c', 'sh' => 's', 'jh' => 'j', 'v' => 'b', 'w' => 'o',
            'z' => 'j', 'q' => 'k', 'y' => 'i', 'x' => 'ks']);
        $s = preg_replace('/(.)\1+/', '$1', $s);
        $s = preg_replace('/h/', '', $s);
        if ($s === '') {
            return '';
        }

        return $s[0] . preg_replace('/[aeiou]/', '', substr($s, 1));
    }
}
