<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const DEFAULTS = [
        'breed' => 'e.g. Golden Retriever, Persian, Local',
        'age'   => 'e.g. 3 months or 2 years',
    ];

    public function up(): void
    {
        Schema::table('category_attributes', function (Blueprint $table) {
            $table->string('placeholder', 150)->nullable()->after('name');
        });

        foreach (self::DEFAULTS as $key => $text) {
            DB::table('category_attributes')->where('attribute_key', $key)->whereNull('placeholder')->update(['placeholder' => $text]);
        }
    }

    public function down(): void
    {
        Schema::table('category_attributes', function (Blueprint $table) {
            $table->dropColumn('placeholder');
        });
    }
};
