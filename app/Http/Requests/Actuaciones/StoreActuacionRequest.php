<?php

namespace App\Http\Requests\Actuaciones;

use Illuminate\Foundation\Http\FormRequest;

class StoreActuacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'glosa' => ['required', 'string', 'max:5000'],
        ];
    }
}
