<?php

namespace App\Http\Requests\Areas;

use Illuminate\Foundation\Http\FormRequest;

class StoreAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255', 'unique:areas,nombre'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'puestos' => ['nullable', 'array'],
            'puestos.*.nombre' => ['required', 'string', 'max:255'],
            'puestos.*.descripcion' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'puestos.*.nombre.required' => 'El nombre del puesto es obligatorio.',
            'puestos.*.nombre.max' => 'El nombre del puesto no debe exceder 255 caracteres.',
        ];
    }
}
