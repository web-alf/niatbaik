<?php

namespace App\Providers;

use App\Services\IpaymuGateway;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

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
        Str::macro('sanitizeHtml', function (string $html): string {
            $allowed = '<p><br><b><strong><i><em><u><ul><ol><li><h1><h2><h3><h4><h5><h6><a><img><blockquote><table><thead><tbody><tr><th><td><span><div><hr>';
            $clean = strip_tags($html, $allowed);
            $clean = preg_replace('/\s*on\w+\s*=\s*(["\']).*?\1/i', '', $clean);
            $clean = preg_replace('/\s*on\w+\s*=\s*\S+/i', '', $clean);
            return preg_replace('/(javascript|data)\s*:/i', '', $clean);
        });
    }
}
