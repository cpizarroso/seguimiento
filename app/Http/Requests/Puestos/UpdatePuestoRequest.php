<?php

namespace App\Http\Requests\Puestos;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePuestoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('areas_puestos', 'edicion') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $datos = [
            'codigo' => $this->filled('codigo') ? mb_strtoupper(trim((string) $this->input('codigo'))) : null,
            'nombre' => $this->filled('nombre') ? mb_strtoupper(trim((string) $this->input('nombre'))) : null,
            'area_id' => $this->route('area')?->id ?? $this->input('area_id'),
        ];

        if ($this->has('activo')) {
            $datos['activo'] = $this->boolean('activo');
        }

        $this->merge($datos);
    }

    public function rules(): array
    {
        $puestoId = $this->route('puesto')->id ?? $this->route('puesto');

        return [
            'nombre' => ['required', 'string', 'max:255'],
            'codigo' => ['nullable', 'string', 'max:30', Rule::unique('puestos', 'codigo')->ignore($puestoId)],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'activo' => ['nullable', 'boolean'],
            'area_id' => ['required', 'integer', 'exists:areas,id'],
        ];
    }
}
