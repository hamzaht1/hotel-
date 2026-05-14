<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_settings', function (Blueprint $table) {
            $table->id();

            $table->string('company_name_ar')->nullable();
            $table->string('company_name_en')->nullable();
            $table->string('cr')->nullable();
            $table->string('vat')->nullable();
            $table->string('address_ar')->nullable();
            $table->string('address_en')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('footer_line')->nullable();

            $table->boolean('pdf_show_logo')->default(true);
            $table->boolean('pdf_show_company_info')->default(true);
            $table->boolean('pdf_show_bank_info')->default(true);
            $table->boolean('pdf_show_vat')->default(true);
            $table->boolean('pdf_show_customer_info')->default(true);
            $table->boolean('pdf_show_cr')->default(true);
            $table->boolean('pdf_show_terms')->default(true);
            $table->boolean('pdf_show_notes')->default(true);
            $table->boolean('pdf_show_discount_column')->default(true);
            $table->boolean('pdf_show_footer')->default(true);

            $table->timestamps();
        });

        // Singleton row — InvoiceSetting::current() always returns id=1.
        \DB::table('invoice_settings')->insert([
            'id' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_settings');
    }
};
