<?php

namespace App\Http\Requests\Funcionarios;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFuncionarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('funcionarios', 'creacion');
    }

    public function rules(): array
    {
        return [
            'cedula_identidad' => ['required', 'string', 'max:30', 'unique:funcionarios,cedula_identidad'],
            'nombre' => ['required', 'string', 'max:255'],
            'apellidos' => ['required', 'string', 'max:255'],
            'nro_telefono' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'tipo_funcionario' => ['nullable', 'string', 'in:contrato,item'],
            'area_id' => ['required', 'integer', 'exists:areas,id'],
            'puesto_id' => [
                'required',
                'integer',
                Rule::exists('puestos', 'id')->where('area_id', $this->input('area_id')),
            ],
            'direccion' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'cedula_identidad.unique' => 'La cédula de identidad ya está registrada.',
            'tipo_funcionario.in' => 'El tipo de funcionario debe ser "contrato" o "item".',
            'area_id.required' => 'Debe seleccionar un área.',
            'puesto_id.required' => 'Debe seleccionar un puesto.',
            'puesto_id.exists' => 'El puesto seleccionado no pertenece al área indicada.',
        ];
    }
}
