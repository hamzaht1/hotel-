<?php

namespace Database\Factories;

use App\Models\Template;
use Illuminate\Database\Eloquent\Factories\Factory;

class TemplateFactory extends Factory
{
    protected $model = Template::class;

    public function definition(): array
    {
        $key = $this->faker->unique()->word();
        return [
            'key' => $key,
            'name_ar' => 'قالب '.$key,
            'name_en' => ucfirst($key).' template',
            'is_active' => true,
            'is_coming_soon' => false,
            'sort_order' => 0,
        ];
    }
}
