<?php

namespace App\Http\Requests\Personas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePersonaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('personas', 'edicion') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'nombres' => $this->filled('nombres') ? trim((string) $this->input('nombres')) : null,
            'apellidos' => $this->filled('apellidos') ? trim((string) $this->input('apellidos')) : null,
            'ci' => $this->filled('ci') ? trim((string) $this->input('ci')) : null,
            'correo' => $this->filled('correo') ? mb_strtolower(trim((string) $this->input('correo'))) : null,
        ]);

        if ($this->has('activo')) {
            $this->merge(['activo' => $this->boolean('activo')]);
        }
    }

    public function rules(): array
    {
        $personaId = $this->route('persona')->id ?? $this->route('persona');

        return [
            'nombres' => ['required', 'string', 'max:255'],
            'apellidos' => ['required', 'string', 'max:255'],
            'ci' => ['required', 'string', 'max:30', Rule::unique('personas', 'ci')->ignore($personaId)],
            'telefono' => ['nullable', 'string', 'max:30'],
            'correo' => ['nullable', 'email', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:500'],
            'activo' => ['nullable', 'boolean'],
            'puesto_id' => ['nullable', 'integer', 'exists:puestos,id'],
            'fecha_inicio' => ['nullable', 'date'],
        ];
    }
}
