<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('payment_method_name')->nullable()->after('type_payment');
            $table->text('payment_qrcode')->nullable()->after('qr_url');
            $table->text('deeplink_url')->nullable()->after('payment_qrcode');
            $table->json('payment_instructions')->nullable()->after('deeplink_url');
            $table->string('ip')->nullable()->after('referral_processed');
            $table->string('utm_source')->nullable()->after('ip');
            $table->string('utm_medium')->nullable()->after('utm_source');
            $table->string('utm_campaign')->nullable()->after('utm_medium');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'payment_method_name', 'payment_qrcode', 'deeplink_url',
                'payment_instructions', 'ip', 'utm_source', 'utm_medium', 'utm_campaign',
            ]);
        });
    }
};
