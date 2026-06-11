<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->unsignedInteger('subdomain_changes_count')->default(0)->after('subdomain');
            $table->timestamp('subdomain_last_changed_at')->nullable()->after('subdomain_changes_count');
            $table->string('ssl_status')->default('none')->after('dns_last_checked_at'); // none | pending | active
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['subdomain_changes_count', 'subdomain_last_changed_at', 'ssl_status']);
        });
    }
};
