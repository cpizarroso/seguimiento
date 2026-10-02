<?php

namespace App\Http\Requests\Tramites;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTramiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('tramites', 'edicion');
    }

    public function rules(): array
    {
        return [
            'descripcion' => ['required', 'string', 'max:5000'],
            'numero_diamante' => ['nullable', 'string', 'max:255'],
            'area_id' => ['required', 'integer', 'exists:areas,id'],
            'urgente' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'area_id.required' => 'Debe seleccionar un área.',
            'descripcion.required' => 'La descripción es obligatoria.',
        ];
    }
}
