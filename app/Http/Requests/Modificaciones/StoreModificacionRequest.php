<?php

namespace App\Http\Requests\Modificaciones;

use App\Models\Modificacion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreModificacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tramite_id' => ['required', 'integer', 'exists:tramites,id'],
            'tipo' => ['required', Rule::in(Modificacion::TIPOS)],
            'motivo' => ['required', 'string', 'min:5', 'max:2000'],
            'propuesta' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'tipo.required' => 'Indica qué tipo de modificación necesitas.',
            'motivo.required' => 'Explica el motivo de la solicitud.',
            'motivo.min' => 'El motivo debe tener al menos 5 caracteres.',
        ];
    }
}
