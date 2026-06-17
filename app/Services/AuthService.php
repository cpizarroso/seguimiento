<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(array $credentials): User
    {
        $login = $credentials['email'];

        $user = User::where('email', $login)
            ->orWhere('username', $login)
            ->first();

        if (!$user && !str_contains($login, '@')) {
            $email = $login . '@' . config('app.user_domain');
            $user = User::where('email', $email)->first();
        }

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales ingresadas no coinciden con nuestros registros.'],
            ]);
        }

        return $user;
    }
}
