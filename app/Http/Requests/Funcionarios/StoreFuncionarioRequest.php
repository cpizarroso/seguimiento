<?php

namespace App\Http\Requests\Funcionarios;

use Illuminate\Foundation\Http\FormRequest;

class StoreFuncionarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255'],
            'apellidos' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:500'],
            'nro_telefono' => ['nullable', 'string', 'max:30'],
            'cedula_identidad' => ['nullable', 'string', 'max:30', 'unique:funcionarios,cedula_identidad'],
            'tipo_funcionario' => ['nullable', 'string', 'in:contrato,item'],
            'nivel' => ['nullable', 'string', 'max:50'],
            'area_id' => ['nullable', 'exists:areas,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'cedula_identidad.unique' => 'La cédula de identidad ya está registrada.',
            'tipo_funcionario.in' => 'El tipo de funcionario debe ser "contrato" o "item".',
        ];
    }
}
