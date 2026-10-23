<?php

namespace App\Http\Requests\Puestos;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePuestoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('areas_puestos', 'creacion') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'codigo' => $this->filled('codigo') ? mb_strtoupper(trim((string) $this->input('codigo'))) : null,
            'nombre' => $this->filled('nombre') ? mb_strtoupper(trim((string) $this->input('nombre'))) : null,
            'activo' => $this->has('activo') ? $this->boolean('activo') : true,
            'area_id' => $this->route('area')?->id ?? $this->input('area_id'),
        ]);
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255'],
            'codigo' => ['nullable', 'string', 'max:30', Rule::unique('puestos', 'codigo')],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'activo' => ['boolean'],
            'area_id' => ['required', 'integer', 'exists:areas,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre del puesto es obligatorio.',
            'codigo.unique' => 'El código del puesto ya está en uso.',
            'area_id.required' => 'El área es obligatoria.',
        ];
    }
}
