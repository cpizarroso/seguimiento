<?php

namespace App\Http\Requests\Users;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'nro_telefono' => ['nullable', 'string', 'max:20'],
            'profesion' => ['nullable', 'string', 'max:255'],
            'cargo' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:5'],
            'role' => ['required', 'string', 'in:admin,user'],
        ];
    }
}
