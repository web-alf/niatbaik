<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => 'required|integer|min:50000',
            'bank_type' => 'required|string|max:100',
            'bank_number' => 'required|string|max:50',
            'bank_name' => 'required|string|max:100',
            'campaign_id' => 'nullable|exists:campaigns,id',
        ];
    }
}
