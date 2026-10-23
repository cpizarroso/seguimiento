<?php

namespace App\Http\Requests\Areas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('areas_puestos', 'edicion') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $datos = [
            'codigo' => $this->filled('codigo') ? mb_strtoupper(trim((string) $this->input('codigo'))) : null,
        ];

        if ($this->has('activo')) {
            $datos['activo'] = $this->boolean('activo');
        }

        if ($this->has('area_padre_id') || $this->has('parent_id')) {
            $datos['area_padre_id'] = $this->input('area_padre_id', $this->input('parent_id'));
        }

        $this->merge($datos);
    }

    public function rules(): array
    {
        $areaId = $this->route('area')->id ?? $this->route('area');

        return [
            'nombre' => ['required', 'string', 'max:255'],
            'codigo' => ['required', 'string', 'max:20', Rule::unique('areas', 'codigo')->ignore($areaId)],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'activo' => ['nullable', 'boolean'],
            'area_padre_id' => ['nullable', 'integer', 'exists:areas,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'codigo.unique' => 'El código del área ya está en uso.',
            'area_padre_id.exists' => 'El área padre seleccionada no existe.',
        ];
    }
}
