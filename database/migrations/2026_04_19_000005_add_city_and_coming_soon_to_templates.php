<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->string('city_ar')->nullable()->after('name_en');
            $table->string('city_en')->nullable()->after('city_ar');
            $table->string('demo_url')->nullable()->after('preview_image');
            $table->boolean('is_coming_soon')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn(['city_ar', 'city_en', 'demo_url', 'is_coming_soon']);
        });
    }
};
