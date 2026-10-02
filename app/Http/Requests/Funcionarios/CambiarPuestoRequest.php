<?php

namespace App\Http\Requests\Funcionarios;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CambiarPuestoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('funcionarios', 'edicion');
    }

    public function rules(): array
    {
        return [
            'puesto_id' => [
                'required',
                'integer',
                'exists:puestos,id',
                Rule::notIn([$this->route('funcionario')?->puesto_id]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'puesto_id.not_in' => 'El funcionario ya tiene asignado ese puesto.',
            'puesto_id.exists' => 'El puesto seleccionado no existe.',
        ];
    }
}
