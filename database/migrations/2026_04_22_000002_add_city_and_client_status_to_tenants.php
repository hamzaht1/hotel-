<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('city')->nullable()->after('phone');
            $table->string('country')->default('SA')->after('city');
            $table->string('client_status')->default('active')->after('is_active');
            $table->string('tier_override')->nullable()->after('client_status');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['city', 'country', 'client_status', 'tier_override']);
        });
    }
};
