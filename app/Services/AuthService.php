<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(array $credentials): User
    {
        $login = mb_strtolower(trim((string) ($credentials['login'] ?? $credentials['email'] ?? '')));

        $user = str_contains($login, '@')
            ? User::where('email', $login)->first()
            : User::where('username', $login)->first();

        // Compatibilidad: si no existe el username, se intenta el prefijo
        // del correo institucional (login histórico por local-part).
        if (! $user && ! str_contains($login, '@')) {
            $user = User::where('email', $login.'@'.config('app.user_domain'))->first();
        }

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Las credenciales ingresadas no coinciden con nuestros registros.'],
            ]);
        }

        if (! $user->activo) {
            throw ValidationException::withMessages([
                'login' => ['Tu cuenta está inactiva. Contacta al administrador.'],
            ]);
        }

        return $user;
    }
}
