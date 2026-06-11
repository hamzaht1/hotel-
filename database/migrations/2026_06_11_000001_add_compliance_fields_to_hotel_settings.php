<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotel_settings', function (Blueprint $table) {
            $table->string('commercial_activity')->nullable()->after('check_out_time');
            $table->string('cr_number')->nullable()->after('commercial_activity');
            $table->date('cr_expiry')->nullable()->after('cr_number');
            $table->string('vat_number')->nullable()->after('cr_expiry');
            $table->string('license_number')->nullable()->after('vat_number');
            $table->date('license_expiry')->nullable()->after('license_number');
        });
    }

    public function down(): void
    {
        Schema::table('hotel_settings', function (Blueprint $table) {
            $table->dropColumn([
                'commercial_activity', 'cr_number', 'cr_expiry',
                'vat_number', 'license_number', 'license_expiry',
            ]);
        });
    }
};
