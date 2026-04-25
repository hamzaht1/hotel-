<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportMessage extends Model
{
    use BelongsToTenant;

    public const SOURCE_SUPPORT = 'support';
    public const SOURCE_CONTACT = 'contact';

    protected $fillable = [
        'tenant_id',
        'client_name',
        'client_email',
        'type',
        'subject',
        'message',
        'status',
        'is_urgent',
        'source',
        'is_read',
        'assigned_to',
        'reply',
        'replied_at',
    ];

    protected function casts(): array
    {
        return [
            'is_urgent' => 'boolean',
            'is_read' => 'boolean',
            'replied_at' => 'datetime',
        ];
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(SupportMessageAttachment::class);
    }

    public function isContactMessage(): bool
    {
        return $this->source === self::SOURCE_CONTACT;
    }
}
