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
            'glosa_observacion' => ['nullable', 'string', 'max:2000'],
            'derivado_a' => ['required_if:estado,observado', 'exists:users,id', 'different:auth.id'],
            'glosa_finalizacion' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->input('estado') === 'observado') {
                $userId = (int) $this->input('derivado_a');
                if ($userId === (int) $this->user()?->id) {
                    $validator->errors()->add('derivado_a', 'No puedes derivarte a ti mismo al observar.');
                }
            }
        });
    }
}
