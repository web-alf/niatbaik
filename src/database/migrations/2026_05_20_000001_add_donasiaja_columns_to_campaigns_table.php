<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->string('location_name')->nullable()->after('image');
            $table->string('location_gmaps')->nullable()->after('location_name');
            $table->string('form_type')->default('donasi')->after('location_gmaps');
            $table->string('allocation_title')->nullable()->after('form_type');
            $table->json('opt_nominal')->nullable()->after('allocation_title');
            $table->string('button_color')->nullable()->after('opt_nominal');
            $table->boolean('socialproof')->default(false)->after('button_color');
            $table->boolean('fundraiser_setting')->default(false)->after('socialproof');
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn([
                'location_name', 'location_gmaps', 'form_type',
                'allocation_title', 'opt_nominal', 'button_color',
                'socialproof', 'fundraiser_setting',
            ]);
        });
    }
};
