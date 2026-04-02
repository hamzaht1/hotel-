<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@diyafah.com'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt(env('ADMIN_PASSWORD', 'Diyafah@2026!')),
                'role' => 'super_admin',
                'tenant_id' => null,
                'email_verified_at' => now(),
            ]
        );
    }
}
