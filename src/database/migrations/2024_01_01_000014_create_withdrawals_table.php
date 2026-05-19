<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('campaign_id')->nullable()->constrained('campaigns');
            $table->string('bank_type');
            $table->string('bank_number');
            $table->string('bank_name');
            $table->bigInteger('amount');
            $table->string('evidence');
            $table->date('requested_at')->nullable();
            $table->date('completed_at')->nullable();
            $table->string('status')->default('Dalam Antrian');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawals');
    }
};
