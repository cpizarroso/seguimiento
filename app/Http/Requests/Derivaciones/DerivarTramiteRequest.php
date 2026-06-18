<?php

namespace App\Http\Requests\Derivaciones;

use Illuminate\Foundation\Http\FormRequest;

class DerivarTramiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'derivado_a' => ['required', 'exists:users,id', 'different:tramite.derivado_a'],
            'glosa_derivacion' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $userId = (int) $this->input('derivado_a');
            if ($userId === (int) $this->user()?->id) {
                $validator->errors()->add('derivado_a', 'No puedes derivarte a ti mismo.');
            }
        });
    }
}
