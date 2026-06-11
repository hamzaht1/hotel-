<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Food service serving method. When a service belongs to a "restaurant" (food)
 * category the admin picks how it is served: a single meal ("meal") or a buffet
 * ("buffet"). Buffets carry a serving window (start/end HH:MM), shown to guests.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('food_serving_method', 20)->nullable()->after('custom_subtype_en'); // meal | buffet
            $table->string('buffet_start_time', 5)->nullable()->after('food_serving_method');   // HH:MM
            $table->string('buffet_end_time', 5)->nullable()->after('buffet_start_time');        // HH:MM
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['food_serving_method', 'buffet_start_time', 'buffet_end_time']);
        });
    }
};
