<?php

namespace Tests\Unit\Services;

use App\Models\Campaign;
use App\Models\CampaignFund;
use App\Models\Commission;
use App\Models\FinancialReport;
use App\Models\Fundraiser;
use App\Models\Invoice;
use App\Models\Setting;
use App\Models\User;
use App\Services\IpaymuGateway;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_builds_ipaymu_signature(): void
    {
        $gateway = new IpaymuGateway(
            va: 'test-va-123',
            secret: 'test-secret-456',
            url: 'https://sandbox.ipaymu.com/api/v2/payment',
        );

        $body = ['product' => ['Donasi'], 'qty' => ['1'], 'price' => ['50000']];
        $signature = $gateway->buildSignature($body);

        $this->assertNotEmpty($signature);
        $this->assertEquals(64, strlen($signature));
    }

    public function test_processes_cekmutasi_credit(): void
    {
        $settings = Setting::create([
            'site_name' => 'NiatBaik',
            'logo' => 'logo.png',
            'favicon' => 'favicon.ico',
            'primary_color' => '#000000',
            'secondary_color' => '#ffffff',
            'total_money' => 0,
            'email' => 'test@test.com',
            'phone' => '08123456789',
            'address' => 'Test Address',
            'description' => 'Test',
            'footer_code' => '',
            'auto_slide' => 3,
            'admin_fee' => 4250,
            'fundraiser_commission_percent' => 10,
            'ipaymu_va' => 'test-va',
            'ipaymu_secret' => 'test-secret',
            'ipaymu_url' => 'https://sandbox.ipaymu.com/api/v2/payment',
            'ipaymu_merchant_code' => 'test-merchant',
            'smtp_host' => 'smtp.test.com',
            'smtp_email' => 'test@test.com',
            'smtp_password' => 'password',
            'smtp_ssl' => 'tls',
            'smtp_port' => 587,
            'smtp_name' => 'Test',
            'whatsapp_provider' => 'fonnte',
            'whatsapp_token' => 'token',
            'whatsapp_token_starsender' => 'token',
            'payment_provider' => 'ipaymu',
        ]);

        $invoice = Invoice::factory()->create([
            'subtotal' => 95750,
            'unique_amount' => 4250,
            'total' => 100000,
            'is_paid' => false,
            'status' => 'Belum Dibayar',
            'donor_name' => 'John Doe',
        ]);

        $campaign = $invoice->campaign;

        $service = new PaymentService();
        $result = $service->processPayment($invoice);

        $this->assertTrue($result);

        // Invoice updated
        $invoice->refresh();
        $this->assertTrue($invoice->is_paid);
        $this->assertEquals('Terbayar', $invoice->status);
        $this->assertNotNull($invoice->paid_at);

        // Campaign balance increased
        $campaign->refresh();
        $campaignReceives = 95750 - 4250; // subtotal - admin_fee
        $this->assertEquals($campaignReceives, $campaign->total_raised);

        // CampaignFund record created
        $this->assertDatabaseHas('campaign_funds', [
            'campaign_id' => $campaign->id,
            'amount_in' => $campaignReceives,
        ]);

        // FinancialReport record created
        $masterReceives = 100000 - 4250; // total - admin_fee
        $this->assertDatabaseHas('financial_reports', [
            'amount_in' => $masterReceives,
            'balance' => $masterReceives,
        ]);

        // Settings total_money updated
        $settings->refresh();
        $this->assertEquals($masterReceives, $settings->total_money);
    }

    public function test_processes_payment_with_referral_commission(): void
    {
        $settings = Setting::create([
            'site_name' => 'NiatBaik',
            'logo' => 'logo.png',
            'favicon' => 'favicon.ico',
            'primary_color' => '#000000',
            'secondary_color' => '#ffffff',
            'total_money' => 0,
            'email' => 'test@test.com',
            'phone' => '08123456789',
            'address' => 'Test Address',
            'description' => 'Test',
            'footer_code' => '',
            'auto_slide' => 3,
            'admin_fee' => 4250,
            'fundraiser_commission_percent' => 10,
            'ipaymu_va' => 'test-va',
            'ipaymu_secret' => 'test-secret',
            'ipaymu_url' => 'https://sandbox.ipaymu.com/api/v2/payment',
            'ipaymu_merchant_code' => 'test-merchant',
            'smtp_host' => 'smtp.test.com',
            'smtp_email' => 'test@test.com',
            'smtp_password' => 'password',
            'smtp_ssl' => 'tls',
            'smtp_port' => 587,
            'smtp_name' => 'Test',
            'whatsapp_provider' => 'fonnte',
            'whatsapp_token' => 'token',
            'whatsapp_token_starsender' => 'token',
            'payment_provider' => 'ipaymu',
        ]);

        $referrer = User::factory()->create(['bonus_balance' => 0]);
        $campaign = Campaign::factory()->create(['total_raised' => 0]);

        $fundraiser = Fundraiser::create([
            'user_id' => $referrer->id,
            'campaign_id' => $campaign->id,
            'total_raised' => 0,
            'total_clicks' => 0,
            'total_donors' => 0,
            'invoices_created' => 0,
            'invoices_paid' => 0,
        ]);

        $invoice = Invoice::factory()->create([
            'campaign_id' => $campaign->id,
            'referred_by' => $referrer->id,
            'subtotal' => 95750,
            'unique_amount' => 4250,
            'total' => 100000,
            'is_paid' => false,
            'status' => 'Belum Dibayar',
            'donor_name' => 'Jane Doe',
            'referral_processed' => false,
        ]);

        $service = new PaymentService();
        $result = $service->processPayment($invoice);

        $this->assertTrue($result);

        $invoice->refresh();
        $this->assertTrue($invoice->is_paid);
        $this->assertTrue($invoice->referral_processed);

        // Commission calculated: (95750 - 4250) * 10% = 9150
        $campaignReceivesBeforeCommission = 95750 - 4250; // 91500
        $commissionAmount = ($campaignReceivesBeforeCommission * 10) / 100; // 9150

        // Referrer bonus updated
        $referrer->refresh();
        $this->assertEquals($commissionAmount, $referrer->bonus_balance);

        // Commission record created
        $this->assertDatabaseHas('commissions', [
            'user_id' => $referrer->id,
            'amount' => $commissionAmount,
        ]);

        // Fundraiser total_raised updated
        $fundraiser->refresh();
        $this->assertEquals(95750, $fundraiser->total_raised);

        // Campaign gets reduced amount (after commission)
        $campaign->refresh();
        $expectedCampaignRaised = $campaignReceivesBeforeCommission - $commissionAmount;
        $this->assertEquals($expectedCampaignRaised, $campaign->total_raised);
    }
}
