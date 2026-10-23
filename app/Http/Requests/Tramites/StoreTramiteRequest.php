<?php

namespace App\Http\Requests\Tramites;

use App\Models\User;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class StoreTramiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'descripcion' => ['required', 'string', 'max:5000'],
            'numero_diamante' => ['nullable', 'string', 'max:255'],
            'area_id' => ['required', 'exists:areas,id', $this->areaHabilitada()],
            'urgente' => ['nullable', 'boolean'],
        ];
    }

    private function areaHabilitada(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            $user = $this->user();

            if (! $user instanceof User) {
                $fail('Usuario no autenticado.');

                return;
            }

            if (! $user->tieneAreaHabilitada((int) $value)) {
                $fail('No tienes habilitada esa área para crear trámites.');
            }
        };
    }
}
