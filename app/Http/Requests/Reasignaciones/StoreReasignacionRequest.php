<?php

namespace App\Http\Requests\Reasignaciones;

use Illuminate\Foundation\Http\FormRequest;

class StoreReasignacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tramite_id' => ['required', 'integer', 'exists:tramites,id'],
            'motivo' => ['required', 'string', 'min:5', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'motivo.required' => 'Indica el motivo por el que necesitas el trámite.',
            'motivo.min' => 'El motivo debe tener al menos 5 caracteres.',
        ];
    }
}
