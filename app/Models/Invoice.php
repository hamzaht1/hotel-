<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $fillable = [
        'tenant_id',
        'invoice_number',
        'type',
        'status',
        'amount',
        'tax_rate',
        'tax_amount',
        'discount',
        'total',
        'issue_date',
        'due_date',
        'paid_at',
        'payment_method',
        'notes_ar',
        'notes_en',
        'pdf_path',
        'company_header',
        'tax_number',
        'billing_address',
        'footer_notes',
        'requires_receipt',
        'receipt_upload_path',
        'locked_at',
        'pdf_template',
    ];

    public const PDF_TEMPLATES = [
        'default' => 'Default',
        'modern' => 'Modern',
        'classic' => 'Classic',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
            'issue_date' => 'date',
            'due_date' => 'date',
            'paid_at' => 'datetime',
            'locked_at' => 'datetime',
            'requires_receipt' => 'boolean',
        ];
    }

    public function isLocked(): bool
    {
        return $this->status === 'paid' || $this->locked_at !== null;
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public static function generateNumber(): string
    {
        $year = date('Y');
        $last = static::where('invoice_number', 'like', "INV-{$year}-%")
            ->orderByDesc('invoice_number')
            ->value('invoice_number');

        if ($last) {
            $seq = (int) substr($last, -4) + 1;
        } else {
            $seq = 1;
        }

        return sprintf('INV-%s-%04d', $year, $seq);
    }

    public function calculateTotals(): void
    {
        $amount = $this->items()->sum('total');
        $afterDiscount = $amount - $this->discount;
        $taxAmount = round($afterDiscount * ($this->tax_rate / 100), 2);
        $total = round($afterDiscount + $taxAmount, 2);

        $this->update([
            'amount' => $amount,
            'tax_amount' => $taxAmount,
            'total' => $total,
        ]);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['draft', 'sent']);
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'sent')->where('due_date', '<', now());
    }
}
