<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The service "short description" now stores colour-only rich text (HTML with
 * <span style="color">), mirroring rooms. Widen the columns to TEXT so the
 * small amount of markup never trips the previous string(500) cap. Visible-text
 * length is capped at 120 chars by validation, not by the column.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->text('short_description_ar')->nullable()->change();
            $table->text('short_description_en')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('short_description_ar', 500)->nullable()->change();
            $table->string('short_description_en', 500)->nullable()->change();
        });
    }
};
