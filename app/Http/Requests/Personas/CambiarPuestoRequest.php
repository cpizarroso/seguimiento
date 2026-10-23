<?php

namespace App\Http\Requests\Personas;

use Illuminate\Foundation\Http\FormRequest;

class CambiarPuestoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('personas', 'edicion') ?? false;
    }

    public function rules(): array
    {
        return [
            'puesto_id' => ['required', 'integer', 'exists:puestos,id'],
            'fecha_inicio' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'puesto_id.required' => 'El puesto es obligatorio.',
            'puesto_id.exists' => 'El puesto seleccionado no existe.',
        ];
    }
}
