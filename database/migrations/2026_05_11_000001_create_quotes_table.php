<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();

            $table->string('external_client_name')->nullable();
            $table->string('external_client_email')->nullable();
            $table->string('external_client_phone')->nullable();
            $table->text('external_client_address')->nullable();

            $table->string('quote_number')->unique();
            $table->string('type')->default('subscription');
            // draft | sent | accepted | refused | expired
            $table->string('status')->default('draft');

            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(15.00);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('tax_rate_2', 5, 2)->default(0);
            $table->decimal('tax_amount_2', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);

            $table->date('issue_date');
            // Quote-equivalent of an invoice due_date.
            $table->date('valid_until');
            $table->datetime('accepted_at')->nullable();
            $table->datetime('refused_at')->nullable();

            $table->string('payment_method')->nullable();
            $table->foreignId('sales_rep_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('commission_rate', 5, 2)->default(0);
            $table->decimal('commission_amount', 12, 2)->default(0);

            $table->string('bank_name')->nullable();
            $table->string('bank_country')->nullable();
            $table->string('bank_iban')->nullable();

            $table->text('notes_ar')->nullable();
            $table->text('notes_en')->nullable();
            $table->text('client_notes')->nullable();
            $table->text('payment_terms')->nullable();

            $table->string('pdf_path')->nullable();
            $table->string('pdf_template')->default('default');

            $table->string('company_header')->nullable();
            $table->string('tax_number')->nullable();
            $table->text('billing_address')->nullable();
            $table->text('footer_notes')->nullable();

            $table->timestamp('locked_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index('valid_until');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotes');
    }
};
