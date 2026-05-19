<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->unique()->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', ['user', 'fundraiser', 'admin'])->default('user');
            $table->boolean('force_password_reset')->default(false);
            $table->string('image')->default('user.png');
            $table->text('address')->nullable();
            $table->string('org_status')->default('');
            $table->string('org_name')->default('');
            $table->string('org_phone')->default('');
            $table->text('org_address')->nullable();
            $table->string('org_image')->default('');
            $table->string('bank_type')->default('');
            $table->string('bank_number')->default('');
            $table->string('bank_name')->default('');
            $table->string('fund_name')->nullable();
            $table->string('fund_email')->nullable();
            $table->string('fund_whatsapp')->nullable();
            $table->string('fund_province')->nullable();
            $table->string('fund_bank_name')->nullable();
            $table->string('fund_bank_number')->nullable();
            $table->string('fund_bank_type')->nullable();
            $table->string('fund_org')->nullable();
            $table->integer('bonus_balance')->default(0);
            $table->integer('bonus_withdrawn')->default(0);
            $table->integer('total_clicks')->default(0);
            $table->foreignId('referred_by')->nullable()->constrained('users');
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
