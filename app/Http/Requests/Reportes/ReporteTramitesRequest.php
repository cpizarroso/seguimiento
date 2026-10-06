<?php

namespace App\Http\Requests\Reportes;

use Illuminate\Foundation\Http\FormRequest;

class ReporteTramitesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fecha_desde' => ['nullable', 'date'],
            'fecha_hasta' => ['nullable', 'date', 'after_or_equal:fecha_desde'],
            'hoy' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * Filtros normalizados: si "hoy" está activo, el rango es hoy.
     *
     * @return array{fecha_desde: ?string, fecha_hasta: ?string, hoy: bool}
     */
    public function filtros(): array
    {
        $hoy = filter_var($this->input('hoy'), FILTER_VALIDATE_BOOLEAN);

        if ($hoy) {
            $hoyStr = today()->toDateString();

            return [
                'fecha_desde' => $hoyStr,
                'fecha_hasta' => $hoyStr,
                'hoy' => true,
            ];
        }

        return [
            'fecha_desde' => $this->input('fecha_desde'),
            'fecha_hasta' => $this->input('fecha_hasta'),
            'hoy' => false,
        ];
    }
}
