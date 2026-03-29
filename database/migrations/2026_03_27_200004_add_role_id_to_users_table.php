<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('role')->constrained('roles')->nullOnDelete();
        });

        // Migrate existing users: assign role_id based on current role string
        $roleMapping = [
            'super_admin' => DB::table('roles')->where('key', 'super_admin')->whereNull('tenant_id')->value('id'),
            'client_admin' => DB::table('roles')->where('key', 'client_admin')->whereNull('tenant_id')->value('id'),
        ];

        foreach ($roleMapping as $roleString => $roleId) {
            if ($roleId) {
                DB::table('users')
                    ->where('role', $roleString)
                    ->whereNull('role_id')
                    ->update(['role_id' => $roleId]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });
    }
};
