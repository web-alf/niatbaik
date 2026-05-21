<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->string('theme_color')->nullable()->after('payment_provider');
            $table->string('progressbar_color')->nullable()->after('theme_color');
            $table->string('button_color')->nullable()->after('progressbar_color');
            $table->boolean('powered_by')->default(true)->after('button_color');
            $table->boolean('socialproof_setting')->default(false)->after('powered_by');
            $table->string('whatsapp_admin')->nullable()->after('socialproof_setting');
            $table->string('telegram_bot_token')->nullable()->after('whatsapp_admin');
            $table->string('telegram_chat_id')->nullable()->after('telegram_bot_token');
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'theme_color', 'progressbar_color', 'button_color',
                'powered_by', 'socialproof_setting', 'whatsapp_admin',
                'telegram_bot_token', 'telegram_chat_id',
            ]);
        });
    }
};
