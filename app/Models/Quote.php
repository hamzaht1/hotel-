<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Client-side (read + accept/refuse) view of a quote created by the
 * super-admin. The two apps share the `quotes` table; the client never
 * creates or edits quotes, it only consults the ones sent to its tenant
 * and accepts or refuses them.
 */
class Quote extends Model
{
    protected $fillable = [
        'status',
        'accepted_at',
        'refused_at',
    ];

    protected $appends = ['effective_status', 'is_actionable'];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'tax_rate_2' => 'decimal:2',
            'tax_amount_2' => 'decimal:2',
            'discount' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'total' => 'decimal:2',
            'issue_date' => 'date',
            'valid_until' => 'date',
            'accepted_at' => 'datetime',
            'refused_at' => 'datetime',
            'locked_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class);
    }

    /**
     * A quote is expired when it was sent but its validity window has
     * elapsed without the client acting on it.
     */
    public function isExpired(): bool
    {
        return $this->status === 'sent'
            && $this->valid_until
            && $this->valid_until->isPast();
    }

    /**
     * The client can only accept/refuse a quote that is still open (sent,
     * not yet expired, not locked).
     */
    public function isActionable(): bool
    {
        return $this->status === 'sent'
            && !$this->isExpired()
            && $this->locked_at === null;
    }

    /**
     * `expired` is derived, never stored, so the badge stays correct even
     * if a scheduled job hasn't flipped the status column yet.
     */
    public function getEffectiveStatusAttribute(): string
    {
        return $this->isExpired() ? 'expired' : $this->status;
    }

    public function getIsActionableAttribute(): bool
    {
        return $this->isActionable();
    }
}
