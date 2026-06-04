<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotel_settings', function (Blueprint $table) {
            $table->string('first_name', 100)->nullable()->after('hotel_name_en');
            $table->string('last_name', 100)->nullable()->after('first_name');
            $table->string('city', 100)->nullable()->after('last_name');
            $table->string('phone', 30)->nullable()->after('city');
        });
    }

    public function down(): void
    {
        Schema::table('hotel_settings', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'city', 'phone']);
        });
    }
};
