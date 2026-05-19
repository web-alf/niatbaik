<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['is_paid', 'total']);
            $table->index(['is_paid', 'expired_at']);
            $table->index('invoice_number');
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->index('status');
            $table->index('category_id');
            $table->index('user_id');
        });

        Schema::table('withdrawals', function (Blueprint $table) {
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['is_paid', 'total']);
            $table->dropIndex(['is_paid', 'expired_at']);
            $table->dropIndex(['invoice_number']);
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['category_id']);
            $table->dropIndex(['user_id']);
        });

        Schema::table('withdrawals', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'status']);
        });
    }
};
