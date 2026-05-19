<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('campaign_id')->constrained('campaigns');
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods');
            $table->foreignId('referred_by')->nullable()->constrained('users');
            $table->bigInteger('subtotal');
            $table->integer('unique_amount')->default(0);
            $table->bigInteger('total');
            $table->boolean('is_paid')->default(false);
            $table->string('status')->default('Menunggu Pembayaran');
            $table->boolean('is_anonymous')->default(false);
            $table->string('donor_name');
            $table->string('donor_phone');
            $table->string('donor_email');
            $table->text('message')->nullable();
            $table->date('expired_at');
            $table->timestamp('reminder_sent_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('type_payment')->nullable();
            $table->string('signature');
            $table->text('gateway_info')->nullable();
            $table->string('pay_code')->nullable();
            $table->text('qr_url')->nullable();
            $table->string('url_alternative');
            $table->string('evidence_status')->nullable();
            $table->string('evidence_image')->nullable();
            $table->boolean('referral_processed')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
