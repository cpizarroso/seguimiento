<?php

namespace App\Http\Controllers;

use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function show(): Response
    {
        $user = User::with(['funcionario', 'puestoActivo.puesto.area', 'historialPuestos.puesto.area'])
            ->findOrFail(request()->user()->id);

        return Inertia::render('Profile/Show', [
            'user' => new UserResource($user),
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password' => bcrypt($request->input('password')),
        ]);

        return to_route('profile.show')
            ->with('success', 'Contraseña actualizada exitosamente.');
    }
}
