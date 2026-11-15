<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'image' => $this->image ? (str_starts_with($this->image, 'http') ? $this->image : asset('storage/' . $this->image)) : null,
            'sort_order' => $this->sort_order,
            'status' => (bool) $this->status,
            'children' => CategoryResource::collection($this->whenLoaded('children')),
            'attributes' => $this->whenLoaded('attributes', function () {
                return $this->attributes->map(fn($attr) => [
                    'id' => $attr->id,
                    'name' => $attr->name,
                    'placeholder' => $attr->placeholder,
                    'attribute_key' => $attr->attribute_key,
                    'type' => $attr->type,
                    'options' => $attr->options,
                    'is_required' => (bool) $attr->is_required,
                    'is_filterable' => (bool) $attr->is_filterable,
                ]);
            }),
        ];
    }
}
