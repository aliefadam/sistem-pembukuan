<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'sku' => strtoupper(fake()->unique()->bothify('SKU-#####')),
            'name' => fake()->words(3, true),
            'category_name' => '',
            'unit' => 'Pcs',
            'cost_price' => fake()->randomFloat(2, 1000, 100000),
            'sell_price' => fake()->randomFloat(2, 1000, 200000),
            'min_stock' => fake()->numberBetween(0, 20),
            'stock' => fake()->numberBetween(0, 100),
            'status' => 'active',
        ];
    }
}
