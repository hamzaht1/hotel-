<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Rename gateway-specific columns to generic names so swapping providers
 * (Tap → Moyasar, or others later) doesn't require schema changes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->renameColumn('tap_charge_id', 'payment_charge_id');
            $table->renameColumn('tap_transaction_id', 'payment_transaction_id');
        });

        Schema::table('renewal_requests', function (Blueprint $table) {
            $table->renameColumn('tap_charge_id', 'payment_charge_id');
            $table->renameColumn('tap_transaction_id', 'payment_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->renameColumn('payment_charge_id', 'tap_charge_id');
            $table->renameColumn('payment_transaction_id', 'tap_transaction_id');
        });

        Schema::table('renewal_requests', function (Blueprint $table) {
            $table->renameColumn('payment_charge_id', 'tap_charge_id');
            $table->renameColumn('payment_transaction_id', 'tap_transaction_id');
        });
    }
};
