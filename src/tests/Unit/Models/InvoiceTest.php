<?php

namespace Tests\Unit\Models;

use App\Models\Campaign;
use App\Models\Category;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_invoice_belongs_to_campaign(): void
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

        $this->assertTrue($invoice->campaign->is($campaign));
    }

    public function test_invoice_is_expired(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();
        $campaign = Campaign::factory()->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
        ]);

        $expiredInvoice = Invoice::factory()->create([
            'user_id' => $user->id,
            'campaign_id' => $campaign->id,
            'is_paid' => false,
            'expired_at' => now()->subDay(),
        ]);

        $activeInvoice = Invoice::factory()->create([
            'user_id' => $user->id,
            'campaign_id' => $campaign->id,
            'is_paid' => false,
            'expired_at' => now()->addDay(),
        ]);

        $this->assertTrue($expiredInvoice->isExpired());
        $this->assertFalse($activeInvoice->isExpired());
    }
}
