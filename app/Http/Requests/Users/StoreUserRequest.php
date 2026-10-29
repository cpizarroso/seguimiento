<?php

namespace App\Http\Requests\Users;

use App\Http\Requests\Concerns\ValidaAreasHabilitadas;
use App\Http\Requests\Concerns\ValidaPermisosDirectos;
use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    use ValidaAreasHabilitadas;
    use ValidaPermisosDirectos;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('usuarios', 'creacion') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'username' => $this->filled('username') ? mb_strtolower(trim((string) $this->input('username'))) : null,
            'email' => $this->filled('email') ? mb_strtolower(trim((string) $this->input('email'))) : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:50', 'regex:/^[a-z0-9._-]+$/', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:5'],
            'persona_id' => ['required', 'exists:personas,id', 'unique:users,persona_id'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['exists:roles,id'],
            ...$this->reglasAreasHabilitadas(),
            ...$this->reglasPermisosDirectos(),
        ];
    }

    public function messages(): array
    {
        return [
            'username.regex' => 'El usuario solo puede contener letras minúsculas, números, puntos, guiones y guiones bajos.',
            'username.unique' => 'Ese nombre de usuario ya está en uso.',
            'persona_id.unique' => 'La persona seleccionada ya tiene un usuario vinculado.',
        ];
    }
}
