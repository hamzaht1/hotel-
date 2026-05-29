<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('text_color', 7)->nullable()->after('featured_image');
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->string('text_color', 7)->nullable()->after('featured_image');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('text_color');
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('text_color');
        });
    }
};
