<?php

namespace App\Http\Requests\Roles;

use Illuminate\Foundation\Http\FormRequest;

class StoreRolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:100'],
            'slug' => ['required', 'string', 'max:50', 'alpha_dash:ascii', 'lowercase', 'unique:roles,slug'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'permiso_ids' => ['nullable', 'array'],
            'permiso_ids.*' => ['integer', 'exists:permisos,id'],
        ];
    }
}
