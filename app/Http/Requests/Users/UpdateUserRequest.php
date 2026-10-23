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

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'phone' => ['nullable', 'string', 'max:20'],
            'profesion' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:5'],
            'persona_id' => ['required', 'exists:personas,id', Rule::unique('users', 'persona_id')->ignore($this->route('user'))],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['exists:roles,id'],
            ...$this->reglasAreasHabilitadas(),
        ];
    }
}
