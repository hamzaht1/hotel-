<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'photo',
        'password',
        'tenant_id',
        'role',
        'role_id',
        'otp_code',
        'otp_expires_at',
        'otp_verified',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function roleModel(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isClientAdmin(): bool
    {
        return $this->role === 'client_admin';
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['super_admin', 'client_admin']);
    }

    public function hasPermission(string $key): bool
    {
        // Admins have all permissions (backward compat)
        if ($this->isAdmin()) {
            return true;
        }

        $role = $this->roleModel;
        if (!$role) {
            return false;
        }

        return $role->hasPermission($key);
    }

    public function getPermissions(): array
    {
        if ($this->isAdmin()) {
            return Permission::pluck('key')->toArray();
        }

        $role = $this->roleModel;
        if (!$role) {
            return [];
        }

        return $role->permissions()->pluck('key')->toArray();
    }
}
