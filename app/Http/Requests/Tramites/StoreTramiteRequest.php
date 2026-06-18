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
            'descripcion' => ['required', 'string', 'max:5000'],
            'numero_diamante' => ['nullable', 'string', 'max:255'],
            'area_id' => ['required', 'exists:areas,id'],
        ];
    }
}
