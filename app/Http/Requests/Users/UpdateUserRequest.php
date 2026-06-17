<?php

namespace App\Http\Requests\Users;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'username' => ['nullable', 'string', 'max:100', Rule::unique('users', 'username')->ignore($this->route('user'))],
            'phone' => ['nullable', 'string', 'max:20'],
            'profesion' => ['nullable', 'string', 'max:255'],
            'cargo' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:5'],
            'role' => ['required', 'string', 'in:admin,user'],
        ];
    }
}
