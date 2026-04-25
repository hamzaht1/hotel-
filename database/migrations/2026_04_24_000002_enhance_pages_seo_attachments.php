<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->string('url_label_ar')->nullable()->after('slug');
            $table->string('url_label_en')->nullable()->after('url_label_ar');
            $table->string('meta_title_ar')->nullable()->after('meta_description_ar');
            $table->string('meta_title_en')->nullable()->after('meta_title_ar');
            $table->string('meta_keywords')->nullable()->after('meta_title_en');
            $table->string('og_image')->nullable()->after('meta_keywords');
            $table->json('attachments')->nullable()->after('og_image');
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropColumn(['url_label_ar', 'url_label_en', 'meta_title_ar', 'meta_title_en', 'meta_keywords', 'og_image', 'attachments']);
        });
    }
};
