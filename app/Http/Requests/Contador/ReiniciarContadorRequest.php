<?php

namespace App\Http\Requests\Contador;

use Illuminate\Foundation\Http\FormRequest;

class ReiniciarContadorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'area_id' => ['required', 'exists:areas,id'],
            'glosa' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
