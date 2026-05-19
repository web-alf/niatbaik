<?php

namespace Tests\Feature\Http\Controllers\Dashboard;

use App\Models\Campaign;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampaignControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_campaign_list(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/dashboard/campaigns');

        $response->assertStatus(200);
    }

    public function test_user_can_create_campaign(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($user)->post('/dashboard/campaigns', [
            'title' => 'Test Campaign',
            'short_description' => 'Short desc',
            'description' => 'Full description here',
            'target' => 1000000,
            'duration_days' => 30,
            'category_id' => $category->id,
        ]);

        $response->assertRedirect(route('dashboard.campaigns.index'));
        $this->assertDatabaseHas('campaigns', [
            'title' => 'Test Campaign',
            'user_id' => $user->id,
        ]);
    }

    public function test_guest_cannot_access_dashboard(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/login');
    }

    public function test_user_can_edit_own_campaign(): void
    {
        $user = User::factory()->create();
        $campaign = Campaign::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get("/dashboard/campaigns/{$campaign->slug}/edit");

        $response->assertStatus(200);
    }

    public function test_user_cannot_edit_others_campaign(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $campaign = Campaign::factory()->create(['user_id' => $other->id]);

        $response = $this->actingAs($user)->get("/dashboard/campaigns/{$campaign->slug}/edit");

        $response->assertStatus(403);
    }

    public function test_user_can_update_own_campaign(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();
        $campaign = Campaign::factory()->create(['user_id' => $user->id, 'category_id' => $category->id]);

        $response = $this->actingAs($user)->put("/dashboard/campaigns/{$campaign->slug}", [
            'title' => 'Updated Title',
            'short_description' => 'Updated short desc',
            'description' => 'Updated description',
            'target' => 2000000,
            'duration_days' => 60,
            'category_id' => $category->id,
        ]);

        $response->assertRedirect(route('dashboard.campaigns.index'));
        $this->assertDatabaseHas('campaigns', [
            'id' => $campaign->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_user_can_delete_own_campaign(): void
    {
        $user = User::factory()->create();
        $campaign = Campaign::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->delete("/dashboard/campaigns/{$campaign->slug}");

        $response->assertRedirect(route('dashboard.campaigns.index'));
        $this->assertSoftDeleted('campaigns', ['id' => $campaign->id]);
    }
}
