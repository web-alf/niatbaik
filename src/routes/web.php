<?php

use App\Http\Controllers\CalculatorController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuranController;
use App\Http\Controllers\Webhook;
use Illuminate\Support\Facades\Route;

// Public
Route::get('/', HomeController::class)->name('home');
Route::get('/search/{category?}', [CampaignController::class, 'search'])->name('search');
Route::get('/donasi/{campaign:slug}', [CampaignController::class, 'show'])->name('campaign.show');
Route::get('/donasi-info/{update}', [CampaignController::class, 'info'])->name('campaign.info');
Route::get('/organitation/{user}', [OrganizationController::class, 'show'])->name('organization.show');
Route::get('/blogs', [PostController::class, 'index'])->name('posts.index');
Route::get('/blog/{post:slug}', [PostController::class, 'show'])->name('posts.show');
Route::get('/page/{page:slug}', [PageController::class, 'show'])->name('pages.show');
Route::get('/quran', [QuranController::class, 'index'])->name('quran.index');
Route::get('/quran/{surah}', [QuranController::class, 'read'])->name('quran.read');
Route::get('/kalkulator', [CalculatorController::class, 'index'])->name('calculator');

// Donation flow
Route::get('/form-donation/{campaign:slug}', [DonationController::class, 'form'])->name('donation.form');
Route::post('/form-donation/{campaign:slug}', [DonationController::class, 'store'])->name('donation.store');
Route::get('/form-payment/{invoiceNumber}', [DonationController::class, 'payment'])->name('donation.payment');

// Webhooks (no CSRF)
Route::post('/webhook/ipaymu', [Webhook\IpaymuController::class, 'handle'])->name('webhook.ipaymu');
Route::post('/webhook/cekmutasi', [Webhook\CekmutasiController::class, 'handle'])->name('webhook.cekmutasi');

// Force password reset
Route::get('/force-reset-password', fn () => view('auth.force-reset'))->name('force.reset');

// Dashboard
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', fn () => view('dashboard.home'))->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin
Route::middleware(['auth', 'admin'])->prefix('master')->name('admin.')->group(function () {
    Route::get('/', fn () => view('admin.dashboard'))->name('dashboard');
});

// Fundraiser
Route::middleware(['auth', 'fundraiser'])->prefix('dashboard_fundraiser')->name('fundraiser.')->group(function () {
    Route::get('/', fn () => view('fundraiser.dashboard'))->name('dashboard');
});

require __DIR__ . '/auth.php';
