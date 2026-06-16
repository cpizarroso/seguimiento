<?php

namespace App\Http\Requests\Derivaciones;

use Illuminate\Foundation\Http\FormRequest;

class DerivarTramiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'derivado_a' => ['required', 'exists:funcionarios,id', 'different:tramite.derivado_a'],
            'glosa_derivacion' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
