<?php

namespace Tests\Feature\Livewire;

use App\Livewire\DonationForm;
use App\Models\Campaign;
use App\Models\Invoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class DonationFormTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_render(): void
    {
        $campaign = Campaign::factory()->create();

        Livewire::test(DonationForm::class, ['campaign' => $campaign])
            ->assertStatus(200);
    }

    public function test_validates_required_fields(): void
    {
        $campaign = Campaign::factory()->create();

        Livewire::test(DonationForm::class, ['campaign' => $campaign])
            ->call('submit')
            ->assertHasErrors(['name', 'email', 'phone', 'amount']);
    }

    public function test_validates_minimum_amount(): void
    {
        $campaign = Campaign::factory()->create();

        Livewire::test(DonationForm::class, ['campaign' => $campaign])
            ->set('name', 'Test User')
            ->set('email', 'test@example.com')
            ->set('phone', '081234567890')
            ->set('amount', 5000)
            ->call('submit')
            ->assertHasErrors(['amount']);
    }

    public function test_creates_invoice_on_submit(): void
    {
        $campaign = Campaign::factory()->create();

        Livewire::test(DonationForm::class, ['campaign' => $campaign])
            ->set('name', 'Donor Test')
            ->set('email', 'donor@example.com')
            ->set('phone', '081234567890')
            ->set('amount', 50000)
            ->set('message', 'Semoga bermanfaat')
            ->call('submit');

        $this->assertDatabaseHas('invoices', [
            'campaign_id' => $campaign->id,
            'donor_name' => 'Donor Test',
            'donor_email' => 'donor@example.com',
            'subtotal' => 50000,
        ]);
    }

    public function test_redirects_to_payment_after_submit(): void
    {
        $campaign = Campaign::factory()->create();

        $component = Livewire::test(DonationForm::class, ['campaign' => $campaign])
            ->set('name', 'Donor Test')
            ->set('email', 'donor@example.com')
            ->set('phone', '081234567890')
            ->set('amount', 50000)
            ->call('submit');

        $invoice = Invoice::first();
        $component->assertRedirect(route('donation.payment', $invoice->invoice_number));
    }
}
