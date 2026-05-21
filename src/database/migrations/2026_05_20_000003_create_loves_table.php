<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip');
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['campaign_id', 'ip']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loves');
    }
};
