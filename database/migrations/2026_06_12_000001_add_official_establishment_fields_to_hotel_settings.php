<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Official establishment / documentation fields shown on the account
 * "بيانات المنشأة والتوثيق" screen. Activity type reuses commercial_activity,
 * the tourism licence reuses license_number/license_expiry, and CR/VAT reuse
 * cr_number/vat_number — so only the genuinely new fields are added here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotel_settings', function (Blueprint $table) {
            $table->unsignedSmallInteger('branches_count')->nullable()->after('commercial_activity');
            $table->string('manager_type')->nullable()->after('branches_count');          // owner | manager
            $table->string('responsible_position')->nullable()->after('manager_type');     // e.g. مدير عام
            $table->string('municipality_license_number')->nullable()->after('license_expiry');
            $table->date('municipality_license_expiry')->nullable()->after('municipality_license_number');
        });
    }

    public function down(): void
    {
        Schema::table('hotel_settings', function (Blueprint $table) {
            $table->dropColumn([
                'branches_count', 'manager_type', 'responsible_position',
                'municipality_license_number', 'municipality_license_expiry',
            ]);
        });
    }
};
