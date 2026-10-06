<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user()?->loadMissing('funcionario.area', 'puestoActivo.puesto.area');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'funcionario_id' => $user->funcionario?->id,
                    'puesto' => $user->puestoActivo?->puesto?->nombre,
                    'area' => $user->funcionario?->area?->nombre
                        ?? $user->puestoActivo?->puesto?->area?->nombre,
                    'area_id' => $user->funcionario?->area_id
                        ?? $user->puestoActivo?->puesto?->area_id,
                    'permisos' => $user->permisos_slug,
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
