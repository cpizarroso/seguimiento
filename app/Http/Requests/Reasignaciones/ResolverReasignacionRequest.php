<?php

namespace App\Http\Requests\Reasignaciones;

use Illuminate\Foundation\Http\FormRequest;

class ResolverReasignacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'glosa_respuesta' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
