<?php

namespace Tests\Feature\Middleware;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminOnlyTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_admin_route(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/master');

        $response->assertOk();
    }

    public function test_non_admin_is_redirected(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/master');

        $response->assertRedirect('/');
    }

    public function test_fundraiser_cannot_access_admin_route(): void
    {
        $fundraiser = User::factory()->fundraiser()->create();

        $response = $this->actingAs($fundraiser)->get('/master');

        $response->assertRedirect('/');
    }

    public function test_guest_cannot_access_admin_route(): void
    {
        $response = $this->get('/master');

        $response->assertRedirect('/login');
    }
}
