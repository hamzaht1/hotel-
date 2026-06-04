<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Custom features/amenities can now store an icon key (e.g.
        // "air_conditioning") instead of a single emoji, so widen the column.
        Schema::table('room_amenities', function (Blueprint $table) {
            $table->string('icon', 50)->nullable()->change();
        });
        Schema::table('service_features', function (Blueprint $table) {
            $table->string('icon', 50)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('room_amenities', function (Blueprint $table) {
            $table->string('icon', 10)->nullable()->change();
        });
        Schema::table('service_features', function (Blueprint $table) {
            $table->string('icon', 10)->nullable()->change();
        });
    }
};
