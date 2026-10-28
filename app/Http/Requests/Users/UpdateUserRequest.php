<?php

namespace App\Http\Requests\Users;

use App\Http\Requests\Concerns\ValidaAreasHabilitadas;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    use ValidaAreasHabilitadas;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('usuarios', 'edicion') ?? false;
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
        $userId = $this->route('user')->id ?? $this->route('user');

        return [
            'username' => [
                'required',
                'string',
                'max:50',
                'regex:/^[a-z0-9._-]+$/',
                Rule::unique('users', 'username')->ignore($userId),
            ],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => ['nullable', 'string', 'min:5'],
            'persona_id' => [
                'required',
                'exists:personas,id',
                Rule::unique('users', 'persona_id')->ignore($userId),
            ],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['exists:roles,id'],
            ...$this->reglasAreasHabilitadas(),
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
