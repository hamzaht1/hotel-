<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quote extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'external_client_name',
        'external_client_email',
        'external_client_phone',
        'external_client_address',
        'quote_number',
        'type',
        'status',
        'amount',
        'tax_rate',
        'tax_amount',
        'tax_rate_2',
        'tax_amount_2',
        'discount',
        'discount_percent',
        'total',
        'issue_date',
        'valid_until',
        'accepted_at',
        'refused_at',
        'payment_method',
        'sales_rep_id',
        'commission_rate',
        'commission_amount',
        'bank_name',
        'bank_country',
        'bank_iban',
        'notes_ar',
        'notes_en',
        'pdf_path',
        'pdf_template',
        'company_header',
        'tax_number',
        'billing_address',
        'footer_notes',
        'client_notes',
        'payment_terms',
        'locked_at',
    ];

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
            'commission_rate' => 'decimal:2',
            'commission_amount' => 'decimal:2',
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

    public function salesRep(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_rep_id');
    }

    public static function generateNumber(): string
    {
        $year = date('Y');
        $last = static::where('quote_number', 'like', "QUO-{$year}-%")
            ->orderByDesc('quote_number')
            ->value('quote_number');

        $seq = $last ? (int) substr($last, -4) + 1 : 1;
        return sprintf('QUO-%s-%04d', $year, $seq);
    }

    public function calculateTotals(): void
    {
        $amount = $this->items()->sum('total');
        $afterDiscount = $amount - $this->discount;
        $taxAmount = round($afterDiscount * ((float) $this->tax_rate / 100), 2);
        $taxAmount2 = round($afterDiscount * ((float) $this->tax_rate_2 / 100), 2);
        $total = round($afterDiscount + $taxAmount + $taxAmount2, 2);

        $commissionAmount = round($total * ((float) $this->commission_rate / 100), 2);

        $this->update([
            'amount' => $amount,
            'tax_amount' => $taxAmount,
            'tax_amount_2' => $taxAmount2,
            'total' => $total,
            'commission_amount' => $commissionAmount,
        ]);
    }

    public function isLocked(): bool
    {
        return in_array($this->status, ['accepted', 'refused'], true) || $this->locked_at !== null;
    }

    public function isExpired(): bool
    {
        return $this->status === 'sent'
            && $this->valid_until
            && $this->valid_until->isPast();
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['draft', 'sent']);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'sent')->where('valid_until', '<', now());
    }

    public const PDF_TEMPLATES = [
        'default' => 'Default',
        'modern' => 'Modern',
        'classic' => 'Classic',
    ];

    public const STATUSES = [
        'draft' => 'Draft',
        'sent' => 'Sent',
        'accepted' => 'Accepted',
        'refused' => 'Refused',
        'expired' => 'Expired',
    ];
}
