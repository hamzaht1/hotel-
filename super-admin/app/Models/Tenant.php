<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class Tenant extends Model
{
    use HasFactory;

    protected $appends = ['bank_transfer_receipt_url'];

    protected $fillable = [
        'name',
        'slug',
        'domain',
        'subdomain',
        'template',
        'logo',
        'email',
        'phone',
        'subscription_starts_at',
        'subscription_ends_at',
        'plan',
        'plan_id',
        'is_active',
        'settings',
        'payment_status',
        'payment_method',
        'approved_by',
        'approved_at',
        'deployed_at',
        'deployed_by',
        'bank_transfer_receipt',
        'payment_notes',
        'admin_notes',
        'org_name_ar',
        'org_name_en',
        'city',
        'country',
        'client_status',
        'tier_override',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'settings' => 'array',
            'subscription_starts_at' => 'date',
            'subscription_ends_at' => 'date',
            'approved_at' => 'datetime',
            'deployed_at' => 'datetime',
        ];
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function deployer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deployed_by');
    }

    /**
     * Compute the live deployment URL based on whether a custom domain
     * or a subdomain has been registered. Falls back to the slug-based
     * /hotel/{slug} URL on the main app.
     */
    public function deploymentUrl(): string
    {
        if ($this->custom_domain) {
            return 'https://' . ltrim($this->custom_domain, '/');
        }

        $base = config('app.tenant_base_domain');
        if ($this->subdomain && $base) {
            return "https://{$this->subdomain}.{$base}";
        }

        $main = config('app.main_app_url');
        return "{$main}/hotel/{$this->slug}";
    }

    protected static function booted(): void
    {
        static::created(function (Tenant $tenant) {
            $now = now();

            // 1. Default site sections.
            $sectionRows = [];
            foreach (SiteSection::AVAILABLE as $i => $name) {
                $sectionRows[] = [
                    'tenant_id' => $tenant->id,
                    'section_name' => $name,
                    'is_active' => true,
                    'sort_order' => $i + 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            DB::table('site_sections')->insertOrIgnore($sectionRows);

            // 2. Default tenant-scoped roles. Permissions are seeded globally by
            //    seed_default_permissions migration; this hook attaches them.
            $manager = DB::table('roles')->where('tenant_id', $tenant->id)->where('key', 'manager')->value('id')
                ?? DB::table('roles')->insertGetId([
                    'tenant_id' => $tenant->id,
                    'key' => 'manager',
                    'name_ar' => 'مدير',
                    'name_en' => 'Manager',
                    'is_system' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

            $receptionist = DB::table('roles')->where('tenant_id', $tenant->id)->where('key', 'receptionist')->value('id')
                ?? DB::table('roles')->insertGetId([
                    'tenant_id' => $tenant->id,
                    'key' => 'receptionist',
                    'name_ar' => 'موظف استقبال',
                    'name_en' => 'Receptionist',
                    'is_system' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

            $allPermissions = DB::table('permissions')->pluck('id', 'key');
            if ($allPermissions->isEmpty()) {
                return;
            }

            $managerRows = $allPermissions->map(fn ($id) => [
                'role_id' => $manager,
                'permission_id' => $id,
            ])->all();

            $receptionistKeys = [
                'rooms.view', 'gallery.view', 'site_texts.view', 'site_sections.view',
                'contact.view', 'hotel_settings.view',
                'services.view', 'service_categories.view',
                'reports.messages',
            ];
            $receptionistRows = collect($receptionistKeys)
                ->filter(fn ($key) => isset($allPermissions[$key]))
                ->map(fn ($key) => [
                    'role_id' => $receptionist,
                    'permission_id' => $allPermissions[$key],
                ])->all();

            DB::table('role_permission')->insertOrIgnore(array_merge($managerRows, $receptionistRows));
        });
    }

    public const TIER_BRONZE = 'bronze';
    public const TIER_SILVER = 'silver';
    public const TIER_GOLD = 'gold';
    public const TIER_PLATINUM = 'platinum';

    /**
     * Compute the client tier based on paid invoice count.
     * Admins can override via `tier_override`.
     */
    public function getTier(): string
    {
        if ($this->tier_override) {
            return $this->tier_override;
        }

        $paid = $this->paid_invoices_count ?? $this->invoices()->where('status', 'paid')->count();

        return match (true) {
            $paid >= 10 => self::TIER_PLATINUM,
            $paid >= 5 => self::TIER_GOLD,
            $paid >= 2 => self::TIER_SILVER,
            default => self::TIER_BRONZE,
        };
    }

    public function getDaysRemainingAttribute(): ?int
    {
        if (!$this->subscription_ends_at) return null;
        return max(0, (int) now()->diffInDays($this->subscription_ends_at, false));
    }

    public function planModel(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function siteSections(): HasMany
    {
        return $this->hasMany(SiteSection::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function renewalRequests(): HasMany
    {
        return $this->hasMany(RenewalRequest::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(RequestTag::class, 'tenant_tag');
    }

    public function isSubscriptionActive(): bool
    {
        if (!$this->is_active) return false;
        if (!$this->subscription_ends_at) return true;
        return $this->subscription_ends_at->isFuture();
    }

    protected function bankTransferReceiptUrl(): Attribute
    {
        return Attribute::get(function () {
            return $this->bank_transfer_receipt
                ? Storage::disk('public')->url($this->bank_transfer_receipt)
                : null;
        });
    }
}
