<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->string('image')->nullable()->default(null)->change();
        });

        Schema::table('campaign_updates', function (Blueprint $table) {
            $table->string('image')->nullable()->default(null)->change();
        });

        Schema::table('payment_methods', function (Blueprint $table) {
            $table->string('image')->nullable()->default(null)->change();
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->string('image')->nullable()->default(null)->change();
        });

        Schema::table('pages', function (Blueprint $table) {
            $table->string('image')->nullable()->default(null)->change();
        });

        Schema::table('slides', function (Blueprint $table) {
            $table->string('image')->nullable()->default(null)->change();
        });

        Schema::table('withdrawals', function (Blueprint $table) {
            $table->string('evidence')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        // No rollback — nullable is safer
    }
};
