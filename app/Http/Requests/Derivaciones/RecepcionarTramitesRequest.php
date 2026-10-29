<?php

namespace App\Http\Requests\Derivaciones;

use Illuminate\Foundation\Http\FormRequest;

class RecepcionarTramitesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tramite_ids' => ['required', 'array', 'min:1'],
            'tramite_ids.*' => ['integer', 'distinct', 'exists:tramites,id'],
            'glosa_recepcion' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
