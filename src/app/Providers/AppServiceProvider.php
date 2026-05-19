<?php

namespace App\Providers;

use App\Services\IpaymuGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(IpaymuGateway::class, function () {
            $settings = \App\Models\Setting::first();

            return new IpaymuGateway(
                $settings->ipaymu_va ?? '',
                $settings->ipaymu_secret ?? '',
                $settings->ipaymu_url ?? 'https://sandbox.ipaymu.com/api/v2/payment',
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
