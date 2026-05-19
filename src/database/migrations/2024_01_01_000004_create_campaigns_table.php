<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('category_id')->nullable()->constrained('categories');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('short_description');
            $table->text('description');
            $table->bigInteger('target');
            $table->bigInteger('total_raised')->default(0);
            $table->integer('duration_days')->default(30);
            $table->boolean('unlimited');
            $table->string('image');
            $table->string('status')->default('Berjalan');
            $table->boolean('featured');
            $table->date('posted_at');
            $table->date('last_checked_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
