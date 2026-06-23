<?php

namespace App\Http\Requests\Areas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $areaId = $this->route('area')->id ?? $this->route('area');

        return [
            'nombre' => [
                'required', 'string', 'max:255',
                Rule::unique('areas', 'nombre')->ignore($areaId),
            ],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'sigla' => [
                'required', 'string', 'max:10',
                Rule::unique('areas', 'sigla')->ignore($areaId),
            ],
            'estado' => ['nullable', 'boolean'],
            'parent_id' => ['nullable', 'integer', 'exists:areas,id'],
            'puestos' => ['nullable', 'array'],
            'puestos.*.nombre' => ['required', 'string', 'max:255'],
            'puestos.*.descripcion' => ['nullable', 'string', 'max:1000'],
            'puestos.*.sigla' => ['required', 'string', 'max:10', 'distinct:strict'],
            'puestos.*.estado' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'puestos.*.nombre.required' => 'El nombre del puesto es obligatorio.',
            'puestos.*.nombre.max' => 'El nombre del puesto no debe exceder 255 caracteres.',
            'puestos.*.sigla.required' => 'La sigla del puesto es obligatoria.',
            'puestos.*.sigla.max' => 'La sigla del puesto no debe exceder 10 caracteres.',
            'puestos.*.sigla.distinct' => 'Las siglas de los puestos no pueden repetirse.',
        ];
    }
}
