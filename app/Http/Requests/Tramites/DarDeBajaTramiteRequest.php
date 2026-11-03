<?php

namespace App\Http\Requests\Tramites;

use Illuminate\Foundation\Http\FormRequest;

class DarDeBajaTramiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'glosa_baja' => ['required', 'string', 'min:10', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'glosa_baja.required' => 'La glosa de baja es obligatoria.',
            'glosa_baja.min' => 'La glosa de baja debe tener al menos 10 caracteres.',
        ];
    }
}
