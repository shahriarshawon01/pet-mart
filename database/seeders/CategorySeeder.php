<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\CategoryAttribute;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $pets = Category::firstOrCreate(
            ['slug' => 'pets'],
            [
                'name' => 'Pets & Animals',
                'description' => 'Browse cats, dogs, birds, fish, and small animals.',
                'icon' => 'paw',
                'sort_order' => 1,
                'status' => true,
            ]
        );

        $dogs = Category::firstOrCreate(
            ['slug' => 'dogs'],
            [
                'name' => 'Dogs & Puppies',
                'parent_id' => $pets->id,
                'description' => 'Purebred and mixed breed dogs & puppies.',
                'icon' => 'dog',
                'sort_order' => 1,
                'status' => true,
            ]
        );

        $cats = Category::firstOrCreate(
            ['slug' => 'cats'],
            [
                'name' => 'Cats & Kittens',
                'parent_id' => $pets->id,
                'description' => 'Persian, British Shorthair, Bengal, and domestic cats.',
                'icon' => 'cat',
                'sort_order' => 2,
                'status' => true,
            ]
        );

        $birds = Category::firstOrCreate(
            ['slug' => 'birds'],
            [
                'name' => 'Birds',
                'parent_id' => $pets->id,
                'description' => 'Parrots, Macaws, Cockatiels, Pigeons, and Songbirds.',
                'icon' => 'crow',
                'sort_order' => 3,
                'status' => true,
            ]
        );

        $fish = Category::firstOrCreate(
            ['slug' => 'fish-aquatics'],
            [
                'name' => 'Fish & Aquatics',
                'parent_id' => $pets->id,
                'description' => 'Aquarium fish, Goldfish, Betta, and aquatic plants.',
                'icon' => 'fish',
                'sort_order' => 4,
                'status' => true,
            ]
        );

        $supplies = Category::firstOrCreate(
            ['slug' => 'pet-supplies'],
            [
                'name' => 'Pet Accessories & Food',
                'description' => 'Food, cages, aquariums, toys, grooming tools, and health care.',
                'icon' => 'box-open',
                'sort_order' => 2,
                'status' => true,
            ]
        );

        CategoryAttribute::firstOrCreate(
            ['category_id' => $dogs->id, 'attribute_key' => 'breed'],
            [
                'name' => 'Breed',
                'placeholder' => 'e.g. Golden Retriever, Persian, Local',
                'type' => 'text',
                'is_required' => true,
                'is_filterable' => true,
                'sort_order' => 1,
            ]
        );

        CategoryAttribute::firstOrCreate(
            ['category_id' => $dogs->id, 'attribute_key' => 'age'],
            [
                'name' => 'Age (Months/Years)',
                'placeholder' => 'e.g. 3 months or 2 years',
                'type' => 'text',
                'is_required' => true,
                'is_filterable' => true,
                'sort_order' => 2,
            ]
        );

        CategoryAttribute::firstOrCreate(
            ['category_id' => $dogs->id, 'attribute_key' => 'vaccination_status'],
            [
                'name' => 'Vaccination Status',
                'type' => 'select',
                'options' => ['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'],
                'is_required' => true,
                'is_filterable' => true,
                'sort_order' => 3,
            ]
        );

        CategoryAttribute::firstOrCreate(
            ['category_id' => $dogs->id, 'attribute_key' => 'gender'],
            [
                'name' => 'Gender',
                'type' => 'select',
                'options' => ['Male', 'Female'],
                'is_required' => true,
                'is_filterable' => true,
                'sort_order' => 4,
            ]
        );

        CategoryAttribute::firstOrCreate(
            ['category_id' => $cats->id, 'attribute_key' => 'breed'],
            [
                'name' => 'Breed',
                'placeholder' => 'e.g. Golden Retriever, Persian, Local',
                'type' => 'text',
                'is_required' => true,
                'is_filterable' => true,
                'sort_order' => 1,
            ]
        );

        CategoryAttribute::firstOrCreate(
            ['category_id' => $cats->id, 'attribute_key' => 'age'],
            [
                'name' => 'Age (Months/Years)',
                'placeholder' => 'e.g. 3 months or 2 years',
                'type' => 'text',
                'is_required' => true,
                'is_filterable' => true,
                'sort_order' => 2,
            ]
        );

        CategoryAttribute::firstOrCreate(
            ['category_id' => $cats->id, 'attribute_key' => 'vaccination_status'],
            [
                'name' => 'Vaccination Status',
                'type' => 'select',
                'options' => ['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'],
                'is_required' => true,
                'is_filterable' => true,
                'sort_order' => 3,
            ]
        );
    }
}
