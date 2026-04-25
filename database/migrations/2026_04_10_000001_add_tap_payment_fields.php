<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('tap_charge_id')->nullable()->after('bank_transfer_receipt');
            $table->string('tap_transaction_id')->nullable()->after('tap_charge_id');
        });

        Schema::table('renewal_requests', function (Blueprint $table) {
            $table->string('payment_method')->default('bank_transfer')->after('status');
            $table->string('tap_charge_id')->nullable()->after('receipt_path');
            $table->string('tap_transaction_id')->nullable()->after('tap_charge_id');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['tap_charge_id', 'tap_transaction_id']);
        });

        Schema::table('renewal_requests', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'tap_charge_id', 'tap_transaction_id']);
        });
    }
};
