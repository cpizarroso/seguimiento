<?php

namespace App\Http\Requests\Areas;

use App\Services\AreaService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('areas_puestos', 'creacion') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'codigo' => $this->filled('codigo') ? mb_strtoupper(trim((string) $this->input('codigo'))) : null,
            'activo' => $this->has('activo') ? $this->boolean('activo') : true,
            'area_padre_id' => $this->input('area_padre_id', $this->input('parent_id')),
        ]);
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255'],
            'codigo' => ['required', 'string', 'max:20', Rule::unique('areas', 'codigo')],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'activo' => ['boolean'],
            'area_padre_id' => ['nullable', 'integer', 'exists:areas,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'puestos_estandar' => ['nullable', 'array'],
            'puestos_estandar.*' => ['string', Rule::in(array_keys(AreaService::PUESTOS_ESTANDAR))],
        ];
    }

    public function messages(): array
    {
        return [
            'codigo.required' => 'El código del área es obligatorio.',
            'codigo.unique' => 'El código del área ya está en uso.',
            'area_padre_id.exists' => 'El área padre seleccionada no existe.',
        ];
    }
}
