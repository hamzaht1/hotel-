<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceSetting extends Model
{
    protected $guarded = [];

    protected $casts = [
        'pdf_show_logo' => 'boolean',
        'pdf_show_company_info' => 'boolean',
        'pdf_show_bank_info' => 'boolean',
        'pdf_show_vat' => 'boolean',
        'pdf_show_customer_info' => 'boolean',
        'pdf_show_cr' => 'boolean',
        'pdf_show_terms' => 'boolean',
        'pdf_show_notes' => 'boolean',
        'pdf_show_discount_column' => 'boolean',
        'pdf_show_footer' => 'boolean',
    ];

    public static function current(): self
    {
        return static::firstOrCreate(['id' => 1]);
    }
}
