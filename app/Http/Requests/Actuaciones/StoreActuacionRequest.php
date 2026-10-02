<?php

namespace App\Http\Requests\Actuaciones;

use Illuminate\Foundation\Http\FormRequest;

class StoreActuacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'area_id' => ['required', 'exists:areas,id'],
            'funcionario_id' => ['required', 'exists:funcionarios,id'],
            'glosa' => ['required', 'string', 'max:5000'],
        ];
    }
}
