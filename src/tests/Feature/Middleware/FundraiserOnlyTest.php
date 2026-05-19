<?php

namespace Tests\Feature\Middleware;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FundraiserOnlyTest extends TestCase
{
    use RefreshDatabase;

    public function test_fundraiser_can_access_fundraiser_route(): void
    {
        $fundraiser = User::factory()->fundraiser()->create();

        $response = $this->actingAs($fundraiser)->get('/fundraiser');

        $response->assertOk();
    }

    public function test_non_fundraiser_is_redirected(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/fundraiser');

        $response->assertRedirect('/');
    }
}
