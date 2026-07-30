<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The client gallery previously reused the platform gallery's group names
 * (`hotels` / `footer`). On a tenant site `hotels` fed BOTH the partner-logos
 * strip and the gallery carousel, so a partner logo showed up as a gallery
 * photo and vice versa — and after
 * 2026_07_22_000001_remap_gallery_categories_to_groups every legacy photo
 * (general/rooms/lobby/restaurant/pool/exterior) had been folded into `hotels`,
 * leaving no category for actual photos.
 *
 * Categories are now one-per-section: `photos`, `partners`, `footer`.
 * Everything sitting in `hotels` came from those legacy photo categories, so it
 * goes back to `photos`; `footer` keeps its meaning and is left alone. Tenants
 * re-upload their partner logos under `partners`.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('gallery_images')
            ->whereNotIn('category', ['photos', 'partners', 'footer'])
            ->update(['category' => 'photos']);
    }

    public function down(): void
    {
        DB::table('gallery_images')
            ->whereIn('category', ['photos', 'partners'])
            ->update(['category' => 'hotels']);
    }
};
