<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Review extends Model
{
    use BelongsToTenant;

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

    protected static function booted(): void
    {
        static::creating(function (self $review) {
            if (empty($review->token)) {
                $review->token = Str::random(40);
            }
            if (empty($review->status)) {
                $review->status = self::STATUS_NEW;
            }
        });
    }

    public function reviewForm(): BelongsTo
    {
        return $this->belongsTo(ReviewForm::class);
    }

    public function isPositive(): bool
    {
        return $this->rating >= 4;
    }

    public function isNegative(): bool
    {
        return $this->rating <= 2;
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
