<?php

namespace App\Http\Requests\Derivaciones;

use Illuminate\Foundation\Http\FormRequest;

class DerivarTramiteRequest extends FormRequest
{
    use ValidaDestinatarioDerivacion;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'area_id' => ['required', 'integer', 'exists:areas,id'],
            'derivado_a' => ['required', 'integer', 'exists:users,id', $this->destinatarioEnArea()],
            'glosa_derivacion' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
