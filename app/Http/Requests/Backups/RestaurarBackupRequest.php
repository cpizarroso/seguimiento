<?php

namespace App\Http\Requests\Backups;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class RestaurarBackupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('backups', 'restauracion') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'confirmacion' => ['required', 'string', Rule::in(['RESTAURAR'])],
            'password' => [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $user = $this->user();

                    if ($user === null || ! Hash::check((string) $value, $user->password)) {
                        $fail('La contraseña no es correcta.');
                    }
                },
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'confirmacion.required' => 'Escriba RESTAURAR para confirmar.',
            'confirmacion.in' => 'Escriba RESTAURAR (en mayúsculas) para confirmar.',
            'password.required' => 'Ingrese su contraseña.',
        ];
    }
}
