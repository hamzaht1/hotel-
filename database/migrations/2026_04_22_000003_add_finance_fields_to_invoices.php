<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('sales_rep_id')->nullable()->after('payment_method')->constrained('users')->nullOnDelete();
            $table->decimal('commission_rate', 5, 2)->default(0)->after('sales_rep_id');
            $table->decimal('commission_amount', 12, 2)->default(0)->after('commission_rate');
            $table->string('external_client_name')->nullable()->after('tenant_id');
            $table->string('external_client_email')->nullable()->after('external_client_name');
            $table->string('external_client_phone')->nullable()->after('external_client_email');
            $table->text('external_client_address')->nullable()->after('external_client_phone');
            $table->string('bank_name')->nullable()->after('external_client_address');
            $table->string('bank_country')->nullable()->after('bank_name');
            $table->string('bank_iban')->nullable()->after('bank_country');
            $table->decimal('discount_percent', 5, 2)->default(0)->after('discount');
            $table->decimal('tax_rate_2', 5, 2)->default(0)->after('tax_rate');
            $table->decimal('tax_amount_2', 12, 2)->default(0)->after('tax_amount');
            $table->boolean('has_receipt_toggle')->default(false)->after('requires_receipt');
            $table->text('client_notes')->nullable()->after('has_receipt_toggle');
            $table->text('payment_terms')->nullable()->after('client_notes');
        });

        // Also make tenant_id nullable to support external clients
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sales_rep_id');
            $table->dropColumn([
                'commission_rate', 'commission_amount',
                'external_client_name', 'external_client_email', 'external_client_phone', 'external_client_address',
                'bank_name', 'bank_country', 'bank_iban',
                'discount_percent', 'tax_rate_2', 'tax_amount_2',
                'has_receipt_toggle', 'client_notes', 'payment_terms',
            ]);
        });
    }
};
