<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Broadcast extends Model
{
    public const TARGET_ALL = 'all';
    public const TARGET_PLAN = 'plan';
    public const TARGET_CITY = 'city';

    protected $fillable = [
        'sender_user_id',
        'sender_name',
        'target_type',
        'target_filter',
        'subject',
        'body',
        'scheduled_at',
        'sent_at',
        'recipient_count',
    ];

    protected function casts(): array
    {
        return [
            'target_filter' => 'array',
            'scheduled_at' => 'datetime',
            'sent_at' => 'datetime',
            'recipient_count' => 'integer',
        ];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }
}
