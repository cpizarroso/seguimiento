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

        if (!str_contains($login, '@')) {
            $login .= '@' . config('app.user_domain');
        }

        $user = User::where('email', $login)->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        return $user;
    }
}
