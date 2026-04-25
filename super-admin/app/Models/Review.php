<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    public const STATUS_NEW = 'new';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_REPLIED = 'replied';
    public const STATUS_NEEDS_FOLLOWUP = 'needs_followup';

    protected $fillable = [
        'tenant_id',
        'review_form_id',
        'token',
        'guest_name',
        'guest_email',
        'guest_phone',
        'rating',
        'comment',
        'answers',
        'status',
        'reply',
        'replied_at',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'rating' => 'integer',
            'is_published' => 'boolean',
            'replied_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopePositive($query)
    {
        return $query->where('rating', '>=', 4);
    }

    public function scopeNegative($query)
    {
        return $query->where('rating', '<=', 2);
    }
}
