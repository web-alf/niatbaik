<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Campaign;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DonationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_donation_form_loads(): void
    {
        $campaign = Campaign::factory()->create();

        $response = $this->get('/form-donation/' . $campaign->slug);

        $response->assertStatus(200);
    }

    public function test_donation_can_be_submitted(): void
    {
        $user = User::factory()->create();
        $campaign = Campaign::factory()->create();

        $response = $this->actingAs($user)->post('/form-donation/' . $campaign->slug, [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '08123456789',
            'amount' => 50000,
            'message' => 'Semoga bermanfaat',
            'is_anonymous' => false,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('invoices', [
            'campaign_id' => $campaign->id,
            'donor_name' => 'John Doe',
            'donor_email' => 'john@example.com',
            'donor_phone' => '08123456789',
            'subtotal' => 50000,
            'total' => 50000,
        ]);
    }
}
