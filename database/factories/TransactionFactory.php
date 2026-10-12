<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Transaction>
 */
class TransactionFactory extends Factory
{
    public function definition(): array
    {
        $type = fake()->randomElement(['income', 'expense']);
        $category = Category::factory()->create(['type' => $type]);

        return [
            'number' => strtoupper(fake()->unique()->bothify('TXN-########')),
            'type' => $type,
            'date' => fake()->date(),
            'category_id' => $category->id,
            'category_name' => $category->name,
            'amount' => fake()->randomFloat(2, 1000, 10000000),
            'description' => fake()->sentence(),
        ];
    }
}
