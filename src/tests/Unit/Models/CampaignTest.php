<?php

namespace Tests\Unit\Models;

use App\Models\Campaign;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampaignTest extends TestCase
{
    use RefreshDatabase;

    public function test_campaign_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();
        $campaign = Campaign::factory()->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
        ]);

        $this->assertTrue($campaign->user->is($user));
    }

    public function test_campaign_belongs_to_category(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();
        $campaign = Campaign::factory()->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
        ]);

        $this->assertTrue($campaign->category->is($category));
    }

    public function test_campaign_has_progress_percentage(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();
        $campaign = Campaign::factory()->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'target' => 1000000,
            'total_raised' => 500000,
        ]);

        $this->assertEquals(50.0, $campaign->progress_percentage);
    }

    public function test_campaign_unlimited_has_zero_progress(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();
        $campaign = Campaign::factory()->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'target' => 0,
            'unlimited' => true,
        ]);

        $this->assertEquals(0, $campaign->progress_percentage);
    }
}
