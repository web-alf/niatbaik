<?php

namespace Tests\Feature\Middleware;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ForcePasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_force_reset_is_redirected(): void
    {
        $user = User::factory()->create(['force_password_reset' => true]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertRedirect('/force-reset-password');
    }

    public function test_normal_user_can_access_dashboard(): void
    {
        $user = User::factory()->create(['force_password_reset' => false]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk();
    }

    public function test_force_reset_user_can_access_force_reset_page(): void
    {
        $user = User::factory()->create(['force_password_reset' => true]);

        $response = $this->actingAs($user)->get('/force-reset-password');

        $response->assertOk();
    }
}
