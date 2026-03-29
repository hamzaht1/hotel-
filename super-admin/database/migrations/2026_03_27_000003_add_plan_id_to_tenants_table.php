<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->foreignId('plan_id')->nullable()->after('plan')->constrained('plans')->nullOnDelete();
        });

        // Migrate existing string plan values to plan_id
        $mapping = [
            'basic' => 'starter',
            'starter' => 'starter',
            'professional' => 'growth',
            'growth' => 'growth',
            'enterprise' => 'premium',
            'premium' => 'premium',
        ];

        foreach ($mapping as $oldValue => $slug) {
            $plan = DB::table('plans')->where('slug', $slug)->first();
            if ($plan) {
                DB::table('tenants')
                    ->where('plan', $oldValue)
                    ->whereNull('plan_id')
                    ->update(['plan_id' => $plan->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeign(['plan_id']);
            $table->dropColumn('plan_id');
        });
    }
};
