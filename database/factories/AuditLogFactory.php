<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\AuditLog>
 */
class AuditLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'actor_name' => fake()->name(),
            'action' => 'Tambah',
            'module' => 'Pembukuan',
            'detail' => fake()->sentence(),
        ];
    }
}
