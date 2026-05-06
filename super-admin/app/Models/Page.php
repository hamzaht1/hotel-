<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Page extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'url_label_ar',
        'url_label_en',
        'title_ar',
        'title_en',
        'content_ar',
        'content_en',
        'meta_title_ar',
        'meta_title_en',
        'meta_description_ar',
        'meta_description_en',
        'meta_keywords',
        'og_image',
        'attachments',
        'is_published',
        'sort_order',
        'layout',
        'show_header',
        'show_footer',
        'header_config',
        'form_fields',
        'form_submit_label_ar',
        'form_submit_label_en',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'show_header' => 'boolean',
            'show_footer' => 'boolean',
            'attachments' => 'array',
            'header_config' => 'array',
            'form_fields' => 'array',
        ];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(PageSubmission::class);
    }
}
