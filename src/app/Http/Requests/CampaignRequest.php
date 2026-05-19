<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:200',
            'short_description' => 'required|string|max:500',
            'description' => 'required|string',
            'target' => 'required|integer|min:0',
            'duration_days' => 'required|integer|min:1|max:365',
            'unlimited' => 'boolean',
            'category_id' => 'required|exists:categories,id',
            'image' => 'nullable|image|max:2048',
        ];
    }
}
