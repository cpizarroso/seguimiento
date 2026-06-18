<?php

namespace App\Http\Requests\Funcionarios;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFuncionarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $funcionarioId = $this->route('funcionario')->id ?? $this->route('funcionario');

        return [
            'nombre' => ['required', 'string', 'max:255'],
            'apellidos' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:500'],
            'nro_telefono' => ['nullable', 'string', 'max:30'],
            'cedula_identidad' => [
                'nullable', 'string', 'max:30',
                Rule::unique('funcionarios', 'cedula_identidad')->ignore($funcionarioId),
            ],
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
