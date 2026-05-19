<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fundraisers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('campaign_id')->constrained('campaigns');
            $table->bigInteger('total_raised')->default(0);
            $table->integer('total_clicks')->default(0);
            $table->integer('total_donors')->default(0);
            $table->integer('invoices_created')->default(0);
            $table->integer('invoices_paid')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fundraisers');
    }
};
