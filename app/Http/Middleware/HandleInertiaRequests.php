<?php

namespace App\Http\Middleware;

use App\Support\Modo;
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
        $user = $request->user()?->loadMissing('persona.puestoActivo.puesto.area');
        $modo = (string) config('app.modo', Modo::DEV);

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->nombre_completo,
                    'username' => $user->username,
                    'email' => $user->email,
                    'persona_id' => $user->persona_id,
                    'puesto' => $user->persona?->puestoActivo?->puesto?->nombre,
                    'area' => $user->persona?->puestoActivo?->puesto?->area?->nombre,
                    'area_id' => $user->persona?->puestoActivo?->puesto?->area_id,
                    'permisos' => $user->permisos_slug,
                ] : null,
            ],
            'dominio_usuario' => (string) config('app.user_domain'),
            'sistema' => [
                'modo' => $modo,
                'entorno' => app()->environment(),
                'etiqueta' => Modo::etiqueta($modo),
                'variante' => Modo::variante($modo),
                'nota' => config('app.nota_capacitacion'),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
