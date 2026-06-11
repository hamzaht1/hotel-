<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('renewal_requests', function (Blueprint $table) {
            $table->foreignId('discount_code_id')->nullable()->after('plan_id')->constrained('discount_codes')->nullOnDelete();
            $table->decimal('base_amount', 12, 2)->nullable()->after('discount_code_id');
            $table->decimal('discount_amount', 12, 2)->default(0)->after('base_amount');
        });
    }

    public function down(): void
    {
        Schema::table('renewal_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('discount_code_id');
            $table->dropColumn(['base_amount', 'discount_amount']);
        });
    }
};
