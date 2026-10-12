<?php

namespace App\Models;

use Database\Factories\StockInFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockIn extends Model
{
    /** @use HasFactory<StockInFactory> */
    use HasFactory;

    protected $fillable = ['number', 'product_id', 'qty', 'cost_price', 'date', 'note'];

    protected function casts(): array
    {
        return ['date' => 'date:Y-m-d', 'cost_price' => 'decimal:2', 'qty' => 'integer'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
