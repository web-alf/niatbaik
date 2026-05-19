<?php

namespace Tests\Feature\Livewire;

use App\Livewire\Calculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class CalculatorTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_render(): void
    {
        Livewire::test(Calculator::class)->assertStatus(200);
    }

    public function test_calculates_zakat_from_savings(): void
    {
        Livewire::test(Calculator::class)
            ->set('savings', 10000000)
            ->assertSet('zakat', 250000);
    }

    public function test_calculates_zakat_from_multiple_assets(): void
    {
        Livewire::test(Calculator::class)
            ->set('savings', 10000000)
            ->set('gold', 5000000)
            ->set('investments', 5000000)
            ->assertSet('zakat', 500000);
    }

    public function test_subtracts_debts(): void
    {
        Livewire::test(Calculator::class)
            ->set('savings', 10000000)
            ->set('debts', 4000000)
            ->assertSet('zakat', 150000);
    }

    public function test_zakat_never_negative(): void
    {
        Livewire::test(Calculator::class)
            ->set('savings', 1000000)
            ->set('debts', 5000000)
            ->assertSet('zakat', 0);
    }
}
