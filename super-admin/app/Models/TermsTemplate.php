<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class TermsTemplate extends Model
{
    use SoftDeletes;

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
