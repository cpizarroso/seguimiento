<?php

namespace App\Http\Requests\Users;

use App\Models\User;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEstadoUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermission('usuarios', 'edicion');
    }

    public function rules(): array
    {
        return [
            'activo' => ['required', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $user = $this->route('user');

                if (! $this->boolean('activo') && $user instanceof User && $user->is($this->user())) {
                    $validator->errors()->add('activo', 'No puedes desactivar tu propia cuenta.');
                }
            },
        ];
    }

    public function attributes(): array
    {
        return [
            'activo' => 'estado de la cuenta',
        ];
    }
}
