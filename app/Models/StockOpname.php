<?php

namespace App\Models;

use Database\Factories\StockOpnameFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOpname extends Model
{
    /** @use HasFactory<StockOpnameFactory> */
    use HasFactory;

    protected $fillable = [
        'number', 'product_id', 'system_qty', 'actual_qty', 'diff', 'note', 'date',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'system_qty' => 'integer',
            'actual_qty' => 'integer',
            'diff' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
