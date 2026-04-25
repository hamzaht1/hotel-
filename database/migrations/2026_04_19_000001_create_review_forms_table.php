<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('title_ar');
            $table->string('title_en');
            $table->text('intro_ar')->nullable();
            $table->text('intro_en')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('tenant_id');
        });

        Schema::create('review_form_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_form_id')->constrained('review_forms')->cascadeOnDelete();
            $table->string('key');
            $table->string('label_ar');
            $table->string('label_en');
            $table->string('type');
            $table->json('options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('review_form_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_form_fields');
        Schema::dropIfExists('review_forms');
    }
};
