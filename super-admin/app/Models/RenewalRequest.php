<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class RenewalRequest extends Model
{
    use HasFactory;

    protected $appends = ['receipt_url'];

    protected $fillable = [
        'tenant_id',
        'plan_id',
        'status',
        'payment_method',
        'receipt_path',
        'payment_charge_id',
        'payment_transaction_id',
        'notes',
        'requested_at',
        'processed_at',
        'processed_by',
    ];

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function processedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    protected function receiptUrl(): Attribute
    {
        return Attribute::get(function () {
            return $this->receipt_path
                ? Storage::disk('public')->url($this->receipt_path)
                : null;
        });
    }
}
