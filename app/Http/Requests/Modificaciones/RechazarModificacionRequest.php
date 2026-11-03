<?php

namespace App\Http\Requests\Modificaciones;

use Illuminate\Foundation\Http\FormRequest;

class RechazarModificacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'glosa_respuesta' => ['required', 'string', 'min:5', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'glosa_respuesta.required' => 'Indica el motivo del rechazo.',
            'glosa_respuesta.min' => 'La glosa del rechazo debe tener al menos 5 caracteres.',
        ];
    }
}
