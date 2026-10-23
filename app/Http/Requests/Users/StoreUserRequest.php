<?php

namespace App\Http\Requests\Users;

use App\Http\Requests\Concerns\ValidaAreasHabilitadas;
use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    use ValidaAreasHabilitadas;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('usuarios', 'creacion') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'profesion' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:5'],
            'persona_id' => ['required', 'exists:personas,id', 'unique:users,persona_id'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['exists:roles,id'],
            ...$this->reglasAreasHabilitadas(),
        ];
    }
}
