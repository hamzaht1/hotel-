<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'external_client_name',
        'external_client_email',
        'external_client_phone',
        'external_client_address',
        'invoice_number',
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
        'due_date',
        'paid_at',
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
        'requires_receipt',
        'has_receipt_toggle',
        'receipt_upload_path',
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
            'due_date' => 'date',
            'paid_at' => 'datetime',
            'locked_at' => 'datetime',
            'requires_receipt' => 'boolean',
            'has_receipt_toggle' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function salesRep(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_rep_id');
    }

    public static function generateNumber(): string
    {
        $year = date('Y');
        $last = static::where('invoice_number', 'like', "INV-{$year}-%")
            ->orderByDesc('invoice_number')
            ->value('invoice_number');

        $seq = $last ? (int) substr($last, -4) + 1 : 1;
        return sprintf('INV-%s-%04d', $year, $seq);
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
        return $this->status === 'paid' || $this->locked_at !== null;
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['draft', 'sent']);
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'sent')->where('due_date', '<', now());
    }

    public const PDF_TEMPLATES = [
        'default' => 'Default',
        'modern' => 'Modern',
        'classic' => 'Classic',
    ];
}
