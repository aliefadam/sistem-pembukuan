<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\StockOpname>
 */
class StockOpnameFactory extends Factory
{
    public function definition(): array
    {
        $system = fake()->numberBetween(0, 100);
        $actual = fake()->numberBetween(0, 100);

        return [
            'number' => strtoupper(fake()->unique()->bothify('OPN-########')),
            'product_id' => Product::factory(),
            'system_qty' => $system,
            'actual_qty' => $actual,
            'diff' => $actual - $system,
            'note' => fake()->optional()->sentence(),
            'date' => fake()->date(),
        ];
    }
}
