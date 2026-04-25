<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlanFactory extends Factory
{
    protected $model = Plan::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->word();
        return [
            'slug' => strtolower($name),
            'name_ar' => $name.' (عربي)',
            'name_en' => ucfirst($name),
            'price' => $this->faker->numberBetween(100, 5000),
            'billing_cycle' => 'yearly',
            'is_active' => true,
            'is_coming_soon' => false,
            'sort_order' => 0,
        ];
    }
}
