<?php

namespace Tests\Feature\Http\Controllers\Admin;

use App\Models\Campaign;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CampaignControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_campaigns(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/master/campaigns');

        $response->assertStatus(200);
    }

    public function test_admin_can_update_campaign_status(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $campaign = Campaign::factory()->create(['category_id' => $category->id]);

        $response = $this->actingAs($admin)->put("/master/campaigns/{$campaign->slug}", [
            'status' => 'Selesai',
            'featured' => true,
            'category_id' => $category->id,
        ]);

        $response->assertRedirect(route('admin.campaigns.index'));
        $this->assertDatabaseHas('campaigns', [
            'id' => $campaign->id,
            'status' => 'Selesai',
            'featured' => true,
        ]);
    }

    public function test_non_admin_cannot_access(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user)->get('/master/campaigns');

        $response->assertRedirect('/');
    }
}
