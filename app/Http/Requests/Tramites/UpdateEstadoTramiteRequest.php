<?php

namespace App\Http\Requests\Tramites;

use App\Http\Requests\Derivaciones\ValidaDestinatarioDerivacion;
use App\Models\Tramite;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEstadoTramiteRequest extends FormRequest
{
    use ValidaDestinatarioDerivacion;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'estado' => ['required', Rule::in(Tramite::ESTADOS)],
            'area_id' => ['nullable', 'required_if:estado,observado', 'integer', 'exists:areas,id'],
            'glosa_observacion' => ['nullable', 'string', 'max:2000'],
            'derivado_a' => ['nullable', 'required_if:estado,observado', 'integer', 'exists:users,id', $this->destinatarioEnArea()],
            'glosa_finalizacion' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
