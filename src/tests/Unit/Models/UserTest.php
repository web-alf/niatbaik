<?php

namespace Tests\Unit\Models;

use App\Models\Campaign;
use App\Models\Category;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_has_campaigns(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();
        $campaign = Campaign::factory()->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
        ]);

        $this->assertTrue($user->campaigns->contains($campaign));
    }

    public function test_user_has_invoices(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();
        $campaign = Campaign::factory()->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
        ]);
        $invoice = Invoice::factory()->create([
            'user_id' => $user->id,
            'campaign_id' => $campaign->id,
        ]);

        $this->assertTrue($user->invoices->contains($invoice));
    }

    public function test_user_is_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'user']);

        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($user->isAdmin());
    }

    public function test_user_is_fundraiser(): void
    {
        $fundraiser = User::factory()->create(['role' => 'fundraiser']);
        $user = User::factory()->create(['role' => 'user']);

        $this->assertTrue($fundraiser->isFundraiser());
        $this->assertFalse($user->isFundraiser());
    }
}
