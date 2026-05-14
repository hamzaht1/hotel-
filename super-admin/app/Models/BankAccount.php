<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class BankAccount extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function makeDefault(): void
    {
        DB::transaction(function () {
            static::where('id', '!=', $this->id)->update(['is_default' => false]);
            $this->update(['is_default' => true]);
        });
    }
}
