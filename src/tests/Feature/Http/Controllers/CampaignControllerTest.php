<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Campaign;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampaignControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_loads(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_campaign_detail_page_loads(): void
    {
        $campaign = Campaign::factory()->create();

        $response = $this->get('/donasi/' . $campaign->slug);

        $response->assertStatus(200);
    }

    public function test_search_page_loads(): void
    {
        $response = $this->get('/search');

        $response->assertStatus(200);
    }

    public function test_search_with_category(): void
    {
        $category = Category::factory()->create();

        $response = $this->get('/search/' . $category->slug);

        $response->assertStatus(200);
    }
}
