<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    public const SOURCE_SUPPORT = 'support';
    public const SOURCE_CONTACT = 'contact';
    public const SOURCE_BROADCAST = 'broadcast';

    public const STATUS_NEW = 'new';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_CLOSED = 'closed';

    public const CATEGORY_SUPPORT = 'support';
    public const CATEGORY_COMPLAINT = 'complaint';
    public const CATEGORY_INQUIRY = 'inquiry';
    public const CATEGORY_TECHNICAL = 'technical';

    protected $fillable = [
        'tenant_id',
        'category',
        'status',
        'subject',
        'source',
        'broadcast_id',
        'created_by_user_id',
        'client_name',
        'client_email',
        'assigned_to_user_id',
        'last_message_at',
        'tenant_unread_count',
        'admin_unread_count',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
            'closed_at' => 'datetime',
            'tenant_unread_count' => 'integer',
            'admin_unread_count' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function broadcast(): BelongsTo
    {
        return $this->belongsTo(Broadcast::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ConversationMessage::class)->orderBy('created_at');
    }

    public function latestMessage(): HasMany
    {
        return $this->hasMany(ConversationMessage::class)->latestOfMany();
    }
}
