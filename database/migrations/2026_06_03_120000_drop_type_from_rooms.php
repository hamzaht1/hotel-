<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            // The [tenant_id, type] index must be dropped before the column.
            $table->dropIndex(['tenant_id', 'type']);
            $table->dropColumn(['type', 'custom_type_ar', 'custom_type_en']);
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('type')->default('standard')->after('name_en');
            $table->string('custom_type_ar', 100)->nullable()->after('type');
            $table->string('custom_type_en', 100)->nullable()->after('custom_type_ar');
            $table->index(['tenant_id', 'type']);
        });
    }
};
