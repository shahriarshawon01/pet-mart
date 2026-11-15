<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Models\Category;
use App\Models\CategoryAttribute;
use App\Services\ImageStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryAdminController extends AdminController
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['keyword' => ['nullable', 'string', 'max:100']]);

        $roots = Category::whereNull('parent_id')
            ->with(['children' => fn ($q) => $q->withCount('products')->with('attributes')->orderBy('sort_order'), 'attributes'])
            ->withCount('products')
            ->orderBy('sort_order')
            ->get();

        $rows = $roots->flatMap(fn (Category $root) => collect([$this->present($root, 0)])
            ->merge($root->children->map(fn (Category $c) => $this->present($c, 1, $root))));

        if ($request->filled('keyword')) {
            $needle = Str::lower($request->keyword);
            $rows = $rows->filter(fn ($r) => Str::contains(Str::lower($r['name'] . ' ' . $r['slug']), $needle));
        }

        return $this->ok([
            'data'    => $rows->values(),
            'parents' => $roots->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['slug'] ?? $data['name']);
        $data['status'] = $data['status'] ?? true;

        $category = Category::create($data);

        return $this->ok(['id' => $category->id], 'Category created.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $data = $this->validated($request, $category);

        if (! empty($data['parent_id'])) {
            if ((int) $data['parent_id'] === $category->id) {
                return $this->error('A category cannot be its own parent.');
            }
            if ($category->children()->exists()) {
                return $this->error('This category has sub-categories, so it must stay a top-level category.');
            }
        }
        if (! empty($data['slug']) && $data['slug'] !== $category->slug) {
            $data['slug'] = $this->uniqueSlug($data['slug'], $category->id);
        } else {
            unset($data['slug']);
        }

        $category->update($data);

        return $this->ok(['id' => $category->id], 'Category updated.');
    }

    public function destroy(int $id): JsonResponse
    {
        $category = Category::withCount(['products', 'children'])->findOrFail($id);

        if ($category->children_count > 0) {
            return $this->error('Delete or move the sub-categories first.');
        }
        if ($category->products_count > 0) {
            return $this->error("This category has {$category->products_count} listing(s). Set it to inactive instead of deleting it.");
        }

        $category->attributes()->delete();
        $category->delete();

        return $this->ok(null, 'Category deleted.');
    }

    public function storeAttribute(Request $request, int $categoryId): JsonResponse
    {
        $category = Category::findOrFail($categoryId);
        $data = $this->validatedAttribute($request, $category->id);

        $category->attributes()->create($data + ['is_filterable' => true]);

        return $this->ok(null, 'Field added.', 201);
    }

    public function updateAttribute(Request $request, int $attributeId): JsonResponse
    {
        $attribute = CategoryAttribute::findOrFail($attributeId);
        $attribute->update($this->validatedAttribute($request, $attribute->category_id, $attribute->id));

        return $this->ok(null, 'Field updated.');
    }

    public function destroyAttribute(int $attributeId): JsonResponse
    {
        CategoryAttribute::findOrFail($attributeId)->delete();

        return $this->ok(null, 'Field removed. Existing listings keep their saved values.');
    }

    private function validated(Request $request, ?Category $category = null): array
    {
        return $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'slug'        => ['nullable', 'string', 'max:120', 'regex:/^[a-z0-9-]+$/'],
            'parent_id'   => ['nullable', 'integer', Rule::exists('categories', 'id')->whereNull('parent_id')->whereNull('deleted_at')],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon'        => ['nullable', 'string', 'max:50', 'regex:/^[a-z0-9 -]+$/'],
            'image'       => ['nullable', 'string', 'max:500', 'regex:#^(categories/[\w/.-]+|https://\S+)$#'],
            'sort_order'  => ['nullable', 'integer', 'min:0', 'max:9999'],
            'status'      => ['nullable', 'boolean'],
        ], ['slug.regex' => 'Use lowercase letters, numbers and dashes only.']);
    }

    private function validatedAttribute(Request $request, int $categoryId, ?int $ignoreId = null): array
    {
        $request->merge(['attribute_key' => Str::slug((string) $request->input('attribute_key', $request->input('name')), '_')]);

        $data = $request->validate([
            'name'          => ['required', 'string', 'max:100'],
            'placeholder'   => ['nullable', 'string', 'max:150'],
            'attribute_key' => ['required', 'string', 'max:80',
                Rule::unique('category_attributes', 'attribute_key')->where('category_id', $categoryId)->ignore($ignoreId)],
            'type'          => ['required', 'in:text,number,select,boolean'],
            'options'       => ['required_if:type,select', 'nullable', 'array', 'min:1', 'max:50'],
            'options.*'     => ['string', 'max:100', 'distinct'],
            'is_required'   => ['nullable', 'boolean'],
            'sort_order'    => ['nullable', 'integer', 'min:0', 'max:9999'],
        ], ['attribute_key.unique' => 'This category already has a field with this key.']);

        $data['options'] = $data['type'] === 'select' ? array_values(array_filter(array_map('trim', $data['options'] ?? []))) : null;
        $data['is_required'] = (bool) ($data['is_required'] ?? false);
        $data['sort_order'] = $data['sort_order'] ?? 0;

        return $data;
    }

    private function uniqueSlug(string $source, ?int $ignoreId = null): string
    {
        $base = Str::slug($source) ?: 'category';
        $slug = $base;
        $i = 2;
        while (Category::withTrashed()->where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }

    private function present(Category $c, int $depth, ?Category $parent = null): array
    {
        return [
            'id'             => $c->id,
            'name'           => $c->name,
            'slug'           => $c->slug,
            'description'    => $c->description,
            'icon'           => $c->icon,
            'image'          => $c->image,
            'image_url'      => ImageStorage::url($c->image),
            'parent_id'      => $c->parent_id,
            'parent_name'    => $parent?->name,
            'depth'          => $depth,
            'sort_order'     => (int) $c->sort_order,
            'status'         => (bool) $c->status,
            'products_count' => (int) ($c->products_count ?? 0),
            'attributes'     => $c->attributes->sortBy('sort_order')->map(fn (CategoryAttribute $a) => [
                'id'            => $a->id,
                'name'          => $a->name,
                'placeholder'   => $a->placeholder,
                'attribute_key' => $a->attribute_key,
                'type'          => $a->type,
                'options'       => $a->options,
                'is_required'   => (bool) $a->is_required,
                'sort_order'    => (int) $a->sort_order,
            ])->values(),
        ];
    }
}
