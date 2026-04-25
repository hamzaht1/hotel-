<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        ];
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
