<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\StockIn>
 */
class StockInFactory extends Factory
{
    public function definition(): array
    {
        return [
            'number' => strtoupper(fake()->unique()->bothify('SIN-########')),
            'product_id' => Product::factory(),
            'qty' => fake()->numberBetween(1, 100),
            'cost_price' => fake()->randomFloat(2, 1000, 100000),
            'date' => fake()->date(),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
