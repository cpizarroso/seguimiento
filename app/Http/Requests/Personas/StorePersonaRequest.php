<?php

namespace App\Http\Requests\Personas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePersonaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('personas', 'creacion') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'nombres' => $this->filled('nombres') ? trim((string) $this->input('nombres')) : null,
            'apellidos' => $this->filled('apellidos') ? trim((string) $this->input('apellidos')) : null,
            'ci' => $this->filled('ci') ? trim((string) $this->input('ci')) : null,
            'correo' => $this->filled('correo') ? mb_strtolower(trim((string) $this->input('correo'))) : null,
            'activo' => $this->has('activo') ? $this->boolean('activo') : true,
        ]);
    }

    public function rules(): array
    {
        return [
            'nombres' => ['required', 'string', 'max:255'],
            'apellidos' => ['required', 'string', 'max:255'],
            'ci' => ['required', 'string', 'max:30', Rule::unique('personas', 'ci')],
            'telefono' => ['nullable', 'string', 'max:30'],
            'correo' => ['nullable', 'email', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:500'],
            'activo' => ['boolean'],
            'puesto_id' => ['nullable', 'integer', 'exists:puestos,id'],
            'fecha_inicio' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'ci.unique' => 'La cédula de identidad ya está registrada.',
            'ci.required' => 'La cédula de identidad es obligatoria.',
            'correo.email' => 'El correo electrónico no es válido.',
            'puesto_id.exists' => 'El puesto seleccionado no existe.',
        ];
    }
}
