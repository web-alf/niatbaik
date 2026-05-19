<?php

namespace Database\Factories;

use App\Models\Campaign;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->numberBetween(10000, 10000000);
        $uniqueAmount = fake()->numberBetween(1, 999);

        return [
            'invoice_number' => 'INV-' . strtoupper(Str::random(10)),
            'user_id' => User::factory(),
            'campaign_id' => Campaign::factory(),
            'subtotal' => $subtotal,
            'unique_amount' => $uniqueAmount,
            'total' => $subtotal + $uniqueAmount,
            'donor_name' => fake()->name(),
            'donor_phone' => fake()->phoneNumber(),
            'donor_email' => fake()->safeEmail(),
            'expired_at' => now()->addDays(2),
            'signature' => Str::random(32),
            'url_alternative' => fake()->url(),
        ];
    }
}
