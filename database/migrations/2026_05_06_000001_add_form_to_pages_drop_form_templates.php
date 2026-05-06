<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->json('form_fields')->nullable()->after('header_config');
            $table->string('form_submit_label_ar')->nullable()->after('form_fields');
            $table->string('form_submit_label_en')->nullable()->after('form_submit_label_ar');
        });

        Schema::create('page_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->json('data');
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamps();

            $table->index(['page_id', 'created_at']);
        });

        Schema::dropIfExists('form_templates');
    }

    public function down(): void
    {
        Schema::dropIfExists('page_submissions');

        Schema::table('pages', function (Blueprint $table) {
            $table->dropColumn(['form_fields', 'form_submit_label_ar', 'form_submit_label_en']);
        });

        Schema::create('form_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('type');
            $table->json('fields');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
};
