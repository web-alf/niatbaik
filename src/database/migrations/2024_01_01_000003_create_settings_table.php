<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('site_name');
            $table->string('logo');
            $table->string('favicon');
            $table->string('primary_color');
            $table->string('secondary_color');
            $table->bigInteger('total_money');
            $table->string('email');
            $table->string('phone');
            $table->text('address');
            $table->text('description');
            $table->text('footer_code');
            $table->integer('auto_slide');
            $table->integer('admin_fee');
            $table->integer('fundraiser_commission_percent');
            $table->string('ipaymu_va');
            $table->string('ipaymu_secret');
            $table->string('ipaymu_url');
            $table->string('ipaymu_merchant_code');
            $table->string('smtp_host');
            $table->string('smtp_email');
            $table->string('smtp_password');
            $table->string('smtp_ssl');
            $table->integer('smtp_port');
            $table->string('smtp_name');
            $table->string('whatsapp_provider');
            $table->string('whatsapp_token');
            $table->string('whatsapp_token_starsender');
            $table->string('payment_provider');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
