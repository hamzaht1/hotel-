<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('billing_method', 20)->default('once')->after('price');
            $table->unsignedSmallInteger('duration_hours')->nullable()->after('billing_method');
            $table->unsignedSmallInteger('duration_minutes')->nullable()->after('duration_hours');
            $table->string('time_window_from', 5)->nullable()->after('duration_minutes');
            $table->string('time_window_to', 5)->nullable()->after('time_window_from');
            $table->unsignedSmallInteger('party_size')->nullable()->after('time_window_to');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn([
                'billing_method',
                'duration_hours',
                'duration_minutes',
                'time_window_from',
                'time_window_to',
                'party_size',
            ]);
        });
    }
};
