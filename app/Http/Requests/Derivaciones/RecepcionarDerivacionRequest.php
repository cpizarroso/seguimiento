<?php

namespace App\Http\Requests\Derivaciones;

use Illuminate\Foundation\Http\FormRequest;

class RecepcionarDerivacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'glosa_recepcion' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
