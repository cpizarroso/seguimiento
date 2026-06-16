<?php

namespace App\Http\Requests\Puestos;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePuestoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255', 'unique:puestos,nombre,' . $this->route('puesto')],
            'descripcion' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
