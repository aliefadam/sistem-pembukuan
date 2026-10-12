<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\StockOut>
 */
class StockOutFactory extends Factory
{
    public function definition(): array
    {
        return [
            'number' => strtoupper(fake()->unique()->bothify('OUT-########')),
            'product_id' => Product::factory(),
            'qty' => fake()->numberBetween(1, 100),
            'date' => fake()->date(),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
