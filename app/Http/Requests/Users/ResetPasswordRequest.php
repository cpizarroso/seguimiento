<?php

namespace App\Http\Requests\Users;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermission('usuarios', 'edicion');
    }

    public function rules(): array
    {
        return [
            'password' => ['required', 'string', 'min:5', 'confirmed'],
        ];
    }

    public function attributes(): array
    {
        return [
            'password' => 'nueva contraseña',
        ];
    }
}
