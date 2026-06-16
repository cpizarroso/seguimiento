<?php

namespace App\Http\Requests\Tramites;

use Illuminate\Foundation\Http\FormRequest;

class StoreTramiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fecha' => ['required', 'date'],
            'descripcion' => ['required', 'string', 'max:5000'],
            'numero_diamante' => ['nullable', 'string', 'max:255'],
            'glosa' => ['nullable', 'string', 'max:2000'],
            'puesto_id' => ['required', 'exists:puestos,id'],
        ];
    }
}
