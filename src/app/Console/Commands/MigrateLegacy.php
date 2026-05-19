<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MigrateLegacy extends Command
{
    protected $signature = 'migrate:legacy {--connection=legacy}';
    protected $description = 'Migrate data from legacy CI3 database to Laravel schema';

    private string $conn;

    public function handle(): int
    {
        $this->conn = $this->option('connection');

        $this->info('Starting legacy data migration...');

        // Disable FK checks during migration since we insert with explicit IDs
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $steps = [
            'migrateCategories',
            'migrateProvinces',
            'migrateSettings',
            'migrateUsers',
            'migrateCampaigns',
            'migrateCampaignUpdates',
            'migrateCampaignFunds',
            'migratePaymentMethods',
            'migrateInvoices',
            'migrateDonations',
            'migrateFundraisers',
            'migrateFundraiserClicks',
            'migrateCommissions',
            'migrateWithdrawals',
            'migratePosts',
            'migratePages',
            'migrateSlides',
            'migrateFinancialReports',
        ];

        foreach ($steps as $step) {
            try {
                $this->$step();
            } catch (\Illuminate\Database\QueryException $e) {
                if (str_contains($e->getMessage(), "doesn't exist")) {
                    $this->warn("Skipping {$step}: source table not found.");
                } else {
                    throw $e;
                }
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $this->info('Legacy data migration complete!');

        return self::SUCCESS;
    }

    private function legacy(): \Illuminate\Database\ConnectionInterface
    {
        return DB::connection($this->conn);
    }

    private function migrateCategories(): void
    {
        $rows = $this->legacy()->table('category')->get();
        $this->info("Migrating {$rows->count()} categories...");

        foreach ($rows as $row) {
            DB::table('categories')->insert([
                'id' => $row->id,
                'name' => $row->name,
                'slug' => Str::slug($row->name),
                'image' => $row->image,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function migrateProvinces(): void
    {
        $rows = $this->legacy()->table('z_provinsi')->get();
        $this->info("Migrating {$rows->count()} provinces...");

        foreach ($rows as $row) {
            DB::table('provinces')->insert([
                'id' => $row->id,
                'name' => $row->provinsi,
                'active' => strtolower($row->aktif) === 'yes',
            ]);
        }
    }

    private function migrateSettings(): void
    {
        $row = $this->legacy()->table('settings')->first();
        if (! $row) {
            $this->warn('No settings found in legacy database.');
            return;
        }

        $this->info('Migrating settings...');

        DB::table('settings')->insert([
            'id' => $row->id,
            'site_name' => $row->name,
            'logo' => $row->logo,
            'favicon' => $row->favicon,
            'primary_color' => $row->bg1,
            'secondary_color' => $row->bg2,
            'total_money' => $row->money,
            'email' => $row->email,
            'phone' => $row->phone,
            'address' => $row->address ?? '',
            'description' => $row->description ?? '',
            'footer_code' => $row->footer_code ?? '',
            'auto_slide' => $row->auto_slide,
            'admin_fee' => $row->harga_emas ?? 0,
            'fundraiser_commission_percent' => $row->percent_bonus ?? 10,
            'ipaymu_va' => $row->va_ipaymu ?? '',
            'ipaymu_secret' => $row->secret_ipaymu ?? '',
            'ipaymu_url' => $row->url_ipaymu ?? '',
            'ipaymu_merchant_code' => $row->merchant_code ?? '',
            'smtp_host' => '',
            'smtp_email' => '',
            'smtp_password' => '',
            'smtp_ssl' => '',
            'smtp_port' => 587,
            'smtp_name' => '',
            'whatsapp_provider' => $row->whatsapp_use ?? '',
            'whatsapp_token' => $row->token_whatsapp ?? '',
            'whatsapp_token_starsender' => $row->token_whatsapp_starsender ?? '',
            'payment_provider' => $row->payment_use ?? '',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function migrateUsers(): void
    {
        $rows = $this->legacy()->table('user')->get();
        $this->info("Migrating {$rows->count()} users...");

        foreach ($rows as $row) {
            $role = 'user';
            if ($row->account_type === 'Master') {
                $role = 'admin';
            } elseif ($row->fundraising === 'Yes') {
                $role = 'fundraiser';
            }

            $referredBy = (isset($row->id_ref) && $row->id_ref > 0) ? $row->id_ref : null;

            DB::table('users')->insert([
                'id' => $row->id,
                'name' => $row->name,
                'email' => $row->email,
                'phone' => $row->phone ?: null,
                'password' => Hash::make('reset_' . Str::random(16)),
                'role' => $role,
                'force_password_reset' => true,
                'image' => $row->image ?? 'user.png',
                'address' => $row->alamat,
                'org_status' => $row->org_status ?? '',
                'org_name' => $row->org_name ?? '',
                'org_phone' => $row->org_phone ?? '',
                'org_address' => $row->org_address,
                'org_image' => $row->org_image ?? '',
                'bank_type' => $row->bank_type ?? '',
                'bank_number' => $row->bank_number ?? '',
                'bank_name' => $row->bank_name ?? '',
                'fund_name' => $row->fund_name,
                'fund_email' => $row->fund_email,
                'fund_whatsapp' => $row->fund_whatsapp,
                'fund_province' => $row->fund_provinsi,
                'fund_bank_name' => $row->fund_bank_nama,
                'fund_bank_number' => $row->fund_bank_rekening,
                'fund_bank_type' => $row->fund_bank_jenis,
                'fund_org' => $row->fund_org,
                'bonus_balance' => $row->bonus_saldo ?? 0,
                'bonus_withdrawn' => $row->bonus_cair ?? 0,
                'total_clicks' => $row->total_click ?? 0,
                'referred_by' => $referredBy,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function migrateCampaigns(): void
    {
        $rows = $this->legacy()->table('project')->get();
        $this->info("Migrating {$rows->count()} campaigns...");

        foreach ($rows as $row) {
            $status = match ($row->active) {
                'Berjalan', 'active', 'Active' => 'Berjalan',
                'Selesai', 'finished', 'Finished' => 'Selesai',
                default => $row->active,
            };

            DB::table('campaigns')->insert([
                'id' => $row->id,
                'user_id' => $row->id_user,
                'category_id' => $row->id_category,
                'title' => $row->title,
                'slug' => Str::slug($row->title) . '-' . $row->id,
                'short_description' => $row->short_description ?? '',
                'description' => $row->description ?? '',
                'target' => $row->target,
                'total_raised' => $row->total ?? 0,
                'duration_days' => $row->limit_date ?? 30,
                'unlimited' => strtolower($row->unlimited ?? 'No') === 'yes',
                'image' => $row->image,
                'status' => $status,
                'featured' => strtolower($row->push ?? 'No') === 'yes',
                'posted_at' => $row->post_date,
                'last_checked_at' => $row->last_check,
                'created_at' => $row->post_date,
                'updated_at' => $row->last_update_date ?? $row->post_date,
            ]);
        }
    }

    private function migrateCampaignUpdates(): void
    {
        $rows = $this->legacy()->table('project_info')->get();
        $this->info("Migrating {$rows->count()} campaign updates...");

        foreach ($rows as $row) {
            DB::table('campaign_updates')->insert([
                'id' => $row->id,
                'campaign_id' => $row->id_project,
                'user_id' => $row->id_user,
                'title' => $row->title,
                'image' => $row->image,
                'body' => $row->text,
                'created_at' => $row->date,
                'updated_at' => $row->date,
            ]);
        }
    }

    private function migrateCampaignFunds(): void
    {
        $rows = $this->legacy()->table('project_money')->get();
        $this->info("Migrating {$rows->count()} campaign funds...");

        foreach ($rows as $row) {
            DB::table('campaign_funds')->insert([
                'id' => $row->id,
                'campaign_id' => $row->id_project,
                'amount_in' => $row->in ?? 0,
                'amount_out' => $row->out ?? 0,
                'description' => $row->text,
                'month' => $row->month,
                'year' => $row->year,
                'balance' => $row->balance ?? 0,
                'created_at' => $row->datetime,
                'updated_at' => $row->datetime,
            ]);
        }
    }

    private function migratePaymentMethods(): void
    {
        $rows = $this->legacy()->table('bank')->get();
        $this->info("Migrating {$rows->count()} payment methods...");

        foreach ($rows as $row) {
            DB::table('payment_methods')->insert([
                'id' => $row->id,
                'bank_name' => $row->bank_name,
                'bank_number' => $row->bank_number,
                'bank_type' => $row->bank_type,
                'image' => $row->image,
                'type' => $row->type,
                'code' => $row->kode,
                'admin_fee' => (int) $row->potongan_admin,
                'category' => $row->category,
                'active' => strtolower($row->active) === 'yes',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function migrateInvoices(): void
    {
        $rows = $this->legacy()->table('invoice')->get();
        $this->info("Migrating {$rows->count()} invoices...");

        foreach ($rows as $row) {
            $referredBy = (isset($row->id_ref) && $row->id_ref > 0) ? $row->id_ref : null;

            DB::table('invoices')->insert([
                'id' => $row->id,
                'invoice_number' => $row->invoice,
                'user_id' => $row->id_user,
                'campaign_id' => $row->id_project,
                'payment_method_id' => $row->id_bank > 0 ? $row->id_bank : null,
                'referred_by' => $referredBy,
                'subtotal' => $row->sub_total,
                'unique_amount' => $row->unique_total,
                'total' => $row->total,
                'is_paid' => strtolower($row->paid) === 'yes',
                'status' => $row->status,
                'is_anonymous' => strtolower($row->anonim) === 'yes',
                'donor_name' => $row->name,
                'donor_phone' => $row->phone,
                'donor_email' => $row->email,
                'message' => $row->pesan ?: null,
                'expired_at' => $row->expired_date,
                'reminder_sent_at' => $row->reminder,
                'paid_at' => $row->reminder_paid,
                'type_payment' => $row->type_payment,
                'signature' => $row->signature,
                'gateway_info' => $row->gateway_info,
                'pay_code' => $row->pay_code,
                'qr_url' => $row->qr_url,
                'url_alternative' => $row->url_alternative ?? '',
                'evidence_status' => $row->status_bukti,
                'evidence_image' => $row->bukti,
                'referral_processed' => strtolower($row->check_ref ?? 'No') === 'yes',
                'created_at' => $row->datetime,
                'updated_at' => $row->datetime,
            ]);
        }
    }

    private function migrateDonations(): void
    {
        // data_donatur is a view; use invoice_donatur if available, else skip
        $hasTable = false;
        try {
            $hasTable = $this->legacy()->getSchemaBuilder()->hasTable('data_donatur');
        } catch (\Exception $e) {
            // view or table may not exist
        }

        if (! $hasTable) {
            $this->warn('No donations table/view found, skipping.');
            return;
        }

        $rows = $this->legacy()->table('data_donatur')->get();
        $this->info("Migrating {$rows->count()} donations...");

        foreach ($rows as $row) {
            DB::table('donations')->insert([
                'invoice_id' => $row->id,
                'campaign_id' => $row->id_project,
                'user_id' => $row->id_user > 0 ? $row->id_user : null,
                'donor_name' => $row->name,
                'amount' => $row->total,
                'created_at' => $row->datetime,
                'updated_at' => $row->datetime,
            ]);
        }
    }

    private function migrateFundraisers(): void
    {
        $rows = $this->legacy()->table('project_fundraiser')->get();
        $this->info("Migrating {$rows->count()} fundraisers...");

        foreach ($rows as $row) {
            DB::table('fundraisers')->insert([
                'id' => $row->id,
                'user_id' => $row->id_user,
                'campaign_id' => $row->id_project,
                'total_raised' => $row->total ?? 0,
                'total_clicks' => $row->total_click ?? 0,
                'total_donors' => $row->total_orang ?? 0,
                'invoices_created' => $row->invoice ?? 0,
                'invoices_paid' => $row->invoice_terbayar ?? 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function migrateFundraiserClicks(): void
    {
        $rows = $this->legacy()->table('project_fundraiser_click')->get();
        $this->info("Migrating {$rows->count()} fundraiser clicks...");

        foreach ($rows as $row) {
            DB::table('fundraiser_clicks')->insert([
                'id' => $row->id,
                'ip' => $row->ip,
                'clicked_at' => $row->date,
                'user_id' => $row->id_ref,
                'created_at' => $row->date,
                'updated_at' => $row->date,
            ]);
        }
    }

    private function migrateCommissions(): void
    {
        $rows = $this->legacy()->table('history_komisi')->get();
        $this->info("Migrating {$rows->count()} commissions...");

        foreach ($rows as $row) {
            DB::table('commissions')->insert([
                'id' => $row->id,
                'user_id' => $row->id_user,
                'description' => $row->keterangan,
                'amount' => $row->total,
                'earned_at' => $row->date,
                'created_at' => $row->date,
                'updated_at' => $row->date,
            ]);
        }
    }

    private function migrateWithdrawals(): void
    {
        // Migrate from withdraw table (has id_project)
        $rows = $this->legacy()->table('withdraw')->get();
        $this->info("Migrating {$rows->count()} withdrawals from withdraw table...");

        foreach ($rows as $row) {
            DB::table('withdrawals')->insert([
                'id' => $row->id,
                'user_id' => $row->id_user,
                'campaign_id' => $row->id_project > 0 ? $row->id_project : null,
                'bank_type' => $row->bank_type,
                'bank_number' => $row->bank_number,
                'bank_name' => $row->bank_name,
                'amount' => $row->total,
                'evidence' => $row->evidence ?? '',
                'requested_at' => $row->date_request,
                'completed_at' => $row->date_finish,
                'status' => $row->status,
                'created_at' => $row->date_request ?? now(),
                'updated_at' => $row->date_finish ?? $row->date_request ?? now(),
            ]);
        }

        // Also migrate history_withdraw (no id_project, campaign_id = null)
        $historyRows = $this->legacy()->table('history_withdraw')->get();
        $this->info("Migrating {$historyRows->count()} withdrawals from history_withdraw table...");

        foreach ($historyRows as $row) {
            DB::table('withdrawals')->insert([
                'user_id' => $row->id_user,
                'campaign_id' => null,
                'bank_type' => $row->bank_type,
                'bank_number' => $row->bank_number,
                'bank_name' => $row->bank_name,
                'amount' => $row->total,
                'evidence' => $row->evidence ?? '',
                'requested_at' => $row->date_request,
                'completed_at' => $row->date_finish,
                'status' => $row->status,
                'created_at' => $row->date_request ?? now(),
                'updated_at' => $row->date_finish ?? $row->date_request ?? now(),
            ]);
        }
    }

    private function migratePosts(): void
    {
        $rows = $this->legacy()->table('page')->where('type', 'blog')->get();
        $this->info("Migrating {$rows->count()} posts...");

        foreach ($rows as $row) {
            DB::table('posts')->insert([
                'id' => $row->id,
                'title' => $row->title,
                'slug' => Str::slug($row->title) . '-' . $row->id,
                'body' => $row->text,
                'image' => $row->image,
                'show_in_header' => strtolower($row->header ?? 'No') === 'yes',
                'created_at' => $row->datetime,
                'updated_at' => $row->datetime,
            ]);
        }
    }

    private function migratePages(): void
    {
        $rows = $this->legacy()->table('page')->where('type', 'page')->get();
        $this->info("Migrating {$rows->count()} pages...");

        foreach ($rows as $row) {
            DB::table('pages')->insert([
                'id' => $row->id,
                'title' => $row->title,
                'slug' => Str::slug($row->title) . '-' . $row->id,
                'body' => $row->text,
                'image' => $row->image,
                'show_in_header' => strtolower($row->header ?? 'No') === 'yes',
                'created_at' => $row->datetime,
                'updated_at' => $row->datetime,
            ]);
        }
    }

    private function migrateSlides(): void
    {
        $rows = $this->legacy()->table('slide')->get();
        $this->info("Migrating {$rows->count()} slides...");

        foreach ($rows as $row) {
            DB::table('slides')->insert([
                'id' => $row->id,
                'link' => $row->link,
                'image' => $row->image,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function migrateFinancialReports(): void
    {
        $rows = $this->legacy()->table('money_management')->get();
        $this->info("Migrating {$rows->count()} financial reports...");

        foreach ($rows as $row) {
            DB::table('financial_reports')->insert([
                'id' => $row->id,
                'description' => $row->text,
                'amount_in' => $row->in,
                'amount_out' => $row->out,
                'month' => $row->month,
                'year' => $row->year,
                'balance' => $row->balance ?? 0,
                'created_at' => $row->datetime,
                'updated_at' => $row->datetime,
            ]);
        }
    }
}
