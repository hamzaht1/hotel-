<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The client gallery now uses only two category groups: `hotels` and `footer`
 * (matching the platform gallery). Any image still carrying a legacy category
 * (general/rooms/lobby/restaurant/pool/exterior) is remapped to `hotels` so it
 * stays visible under a valid filter instead of being orphaned.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('gallery_images')
            ->whereNotIn('category', ['hotels', 'footer'])
            ->update(['category' => 'hotels']);
    }

    public function down(): void
    {
        // One-way data normalisation — the original per-image categories cannot
        // be recovered, so there is nothing meaningful to reverse.
    }
};
