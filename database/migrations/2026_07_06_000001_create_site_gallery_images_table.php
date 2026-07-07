<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Super-admin managed gallery for the public Diyafah landing page:
 *  - group=hotels → "Trusted Hotels" logo strip
 *  - group=footer → footer partner logos
 * Each image carries a per-item width (px) so admins control its display size.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_gallery_images', function (Blueprint $table) {
            $table->id();
            $table->string('group')->index(); // 'hotels' | 'footer'
            $table->string('image_path');
            $table->string('title')->nullable();
            $table->unsignedSmallInteger('width')->default(128); // display width in px
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_gallery_images');
    }
};
