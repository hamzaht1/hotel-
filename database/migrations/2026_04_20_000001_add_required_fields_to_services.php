<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->json('required_fields')->nullable()->after('video_url');
            $table->boolean('accepts_bookings')->default(false)->after('required_fields');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['required_fields', 'accepts_bookings']);
        });
    }
};
