<?php

namespace App\Http\Requests\Funcionarios;

use Illuminate\Foundation\Http\FormRequest;

class StoreFuncionarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('funcionarios', 'creacion');
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255'],
            'apellidos' => ['required', 'string', 'max:255'],
            'cedula_identidad' => ['required', 'string', 'max:30', 'unique:funcionarios,cedula_identidad'],
            'nro_telefono' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'tipo_funcionario' => ['nullable', 'string', 'in:contrato,item'],
            'area_id' => ['nullable', 'exists:areas,id'],
            'nivel' => ['nullable', 'string', 'max:50'],
            'fecha_ingreso' => ['nullable', 'date'],
            'estado' => ['nullable', 'string', 'in:activo,inactivo,baja'],
            'direccion' => ['nullable', 'string', 'max:500'],
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
