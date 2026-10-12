<?php

namespace App\Models;

use Database\Factories\StockOutFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOut extends Model
{
    /** @use HasFactory<StockOutFactory> */
    use HasFactory;

    protected $fillable = ['number', 'product_id', 'qty', 'date', 'note'];

    protected function casts(): array
    {
        return ['date' => 'date:Y-m-d', 'qty' => 'integer'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
