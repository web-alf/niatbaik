<?php

namespace Database\Factories;

use App\Models\Campaign;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Campaign>
 */
class CampaignFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->sentence(4);

        return [
            'user_id' => User::factory(),
            'category_id' => Category::factory(),
            'title' => $title,
            'slug' => Str::slug($title),
            'short_description' => fake()->paragraph(),
            'description' => fake()->paragraphs(3, true),
            'target' => fake()->numberBetween(1000000, 100000000),
            'total_raised' => 0,
            'duration_days' => 30,
            'unlimited' => false,
            'image' => 'campaign.png',
            'status' => 'Berjalan',
            'featured' => false,
            'posted_at' => now(),
        ];
    }
}
