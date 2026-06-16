<?php

namespace App\Http\Requests\Tramites;

use App\Models\Tramite;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEstadoTramiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'estado' => ['required', Rule::in(Tramite::ESTADOS)],
        ];
    }
}
