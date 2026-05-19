<?php

namespace App\Services;

use App\Models\CampaignFund;
use App\Models\Commission;
use App\Models\FinancialReport;
use App\Models\Fundraiser;
use App\Models\Invoice;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    public function processPayment(Invoice $invoice): bool
    {
        return DB::transaction(function () use ($invoice) {
            $settings = Setting::first();
            $adminFee = $settings->admin_fee ?? 0;
            $campaignReceives = $invoice->subtotal - $adminFee;
            $masterReceives = $invoice->total - $adminFee;

            $invoice->update([
                'is_paid' => true,
                'status' => 'Terbayar',
                'reminder_sent_at' => null,
                'paid_at' => now(),
            ]);

            // Handle referral commission
            if ($invoice->referred_by && ! $invoice->referral_processed) {
                $referrer = $invoice->referrer;
                if ($referrer) {
                    $commissionPercent = $settings->fundraiser_commission_percent ?? 0;
                    $commissionAmount = (int) (($campaignReceives * $commissionPercent) / 100);

                    Fundraiser::where('user_id', $invoice->referred_by)
                        ->increment('total_raised', $invoice->subtotal);

                    $referrer->increment('bonus_balance', $commissionAmount);

                    Commission::create([
                        'user_id' => $invoice->referred_by,
                        'description' => "Bonus Komisi Dari Donasi {$invoice->donor_name}",
                        'amount' => $commissionAmount,
                        'earned_at' => now(),
                    ]);

                    $campaignReceives -= $commissionAmount;
                }
                $invoice->update(['referral_processed' => true]);
            }

            // Update campaign balance
            $campaign = $invoice->campaign;
            $newBalance = $campaign->total_raised + $campaignReceives;
            $campaign->update(['total_raised' => $newBalance]);

            // Record campaign fund entry
            CampaignFund::create([
                'campaign_id' => $campaign->id,
                'amount_in' => $campaignReceives,
                'description' => "Donasi Dari : {$invoice->donor_name}",
                'month' => now()->month,
                'year' => now()->year,
                'balance' => $newBalance,
            ]);

            // Record global financial report
            $globalBalance = ($settings->total_money ?? 0) + $masterReceives;
            FinancialReport::create([
                'description' => "Donasi Dari : {$invoice->donor_name} Ke Program {$campaign->title}",
                'amount_in' => $masterReceives,
                'month' => now()->month,
                'year' => now()->year,
                'balance' => $globalBalance,
            ]);
            $settings->update(['total_money' => $globalBalance]);

            return true;
        });
    }
}
