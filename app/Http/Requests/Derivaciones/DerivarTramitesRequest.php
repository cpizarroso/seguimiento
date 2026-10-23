<?php

namespace App\Http\Requests\Derivaciones;

use Illuminate\Foundation\Http\FormRequest;

class DerivarTramitesRequest extends FormRequest
{
    use ValidaDestinatarioDerivacion;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tramite_ids' => ['required', 'array', 'min:1'],
            'tramite_ids.*' => ['integer', 'distinct', 'exists:tramites,id'],
            'area_id' => ['required', 'integer', 'exists:areas,id'],
            'derivado_a' => ['required', 'integer', 'exists:users,id', $this->destinatarioEnArea()],
            'glosa_derivacion' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
