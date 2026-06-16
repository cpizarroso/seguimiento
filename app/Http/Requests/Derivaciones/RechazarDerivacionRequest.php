<?php

namespace App\Http\Requests\Derivaciones;

use Illuminate\Foundation\Http\FormRequest;

class RechazarDerivacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'glosa_rechazo' => 'nullable|string|max:2000',
        ];
    }
}
