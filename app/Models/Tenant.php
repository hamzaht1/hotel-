<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

class Tenant extends Model
{
    use HasFactory;

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
        'bank_transfer_receipt',
        'payment_charge_id',
        'payment_transaction_id',
        'payment_notes',
        'org_name_ar',
        'org_name_en',
        'review_popup_shown_at',
        'custom_domain',
        'dns_verification_token',
        'dns_verified',
        'dns_verified_at',
        'dns_last_checked_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'settings' => 'array',
            'subscription_starts_at' => 'date',
            'subscription_ends_at' => 'date',
            'review_popup_shown_at' => 'datetime',
            'dns_verified' => 'boolean',
            'dns_verified_at' => 'datetime',
            'dns_last_checked_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::created(function (Tenant $tenant) {
            $now = now();

            // 1. Default site sections (all 7, active, in default order).
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

            // 2. Default tenant-scoped roles. Permission keys are seeded globally by the
            //    seed_default_permissions migration; we resolve their IDs and attach.
            //    Idempotent: re-use existing roles if a test or earlier hook already created them.
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
                return; // Permissions seeder hasn't run yet (e.g. tests using an old schema); skip silently.
            }

            // Manager: every permission.
            $managerRows = $allPermissions->map(fn ($id) => [
                'role_id' => $manager,
                'permission_id' => $id,
            ])->all();

            // Receptionist: read-only access to content + ability to handle messages.
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

    public function planModel(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function galleryImages(): HasMany
    {
        return $this->hasMany(GalleryImage::class);
    }

    public function siteTexts(): HasMany
    {
        return $this->hasMany(SiteText::class);
    }

    public function siteSections(): HasMany
    {
        return $this->hasMany(SiteSection::class);
    }

    public function contactSettings(): HasOne
    {
        return $this->hasOne(ContactSetting::class);
    }

    public function hotelSettings(): HasOne
    {
        return $this->hasOne(HotelSetting::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function reviewForms(): HasMany
    {
        return $this->hasMany(ReviewForm::class);
    }

    public function isSubscriptionActive(): bool
    {
        if (!$this->is_active) return false;
        if (!$this->subscription_ends_at) return true;
        return $this->subscription_ends_at->isFuture();
    }
}
