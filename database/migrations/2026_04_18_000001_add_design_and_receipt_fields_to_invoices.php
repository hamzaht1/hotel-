<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('company_header')->nullable()->after('pdf_path');
            $table->string('tax_number')->nullable()->after('company_header');
            $table->text('billing_address')->nullable()->after('tax_number');
            $table->text('footer_notes')->nullable()->after('billing_address');
            $table->boolean('requires_receipt')->default(false)->after('footer_notes');
            $table->string('receipt_upload_path')->nullable()->after('requires_receipt');
            $table->timestamp('locked_at')->nullable()->after('receipt_upload_path');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'company_header',
                'tax_number',
                'billing_address',
                'footer_notes',
                'requires_receipt',
                'receipt_upload_path',
                'locked_at',
            ]);
        });
    }
};
