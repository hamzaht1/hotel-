<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('custom_domain')->nullable()->unique()->after('domain');
            $table->string('dns_verification_token', 64)->nullable()->after('custom_domain');
            $table->boolean('dns_verified')->default(false)->after('dns_verification_token');
            $table->timestamp('dns_verified_at')->nullable()->after('dns_verified');
            $table->timestamp('dns_last_checked_at')->nullable()->after('dns_verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'custom_domain',
                'dns_verification_token',
                'dns_verified',
                'dns_verified_at',
                'dns_last_checked_at',
            ]);
        });
    }
};
