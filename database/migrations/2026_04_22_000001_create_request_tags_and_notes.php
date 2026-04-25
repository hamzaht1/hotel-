<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('request_tags', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('color', 20)->default('#6366f1');
            $table->timestamps();
        });

        Schema::create('tenant_tag', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('request_tag_id')->constrained('request_tags')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['tenant_id', 'request_tag_id']);
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->text('admin_notes')->nullable()->after('payment_notes');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('admin_notes');
        });
        Schema::dropIfExists('tenant_tag');
        Schema::dropIfExists('request_tags');
    }
};
