<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stores the values of super-admin-defined custom registration fields captured
 * during client signup, as a { key: value } JSON map.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotel_settings', function (Blueprint $table) {
            $table->json('custom_fields')->nullable()->after('municipality_license_expiry');
        });
    }

    public function down(): void
    {
        Schema::table('hotel_settings', function (Blueprint $table) {
            $table->dropColumn('custom_fields');
        });
    }
};
