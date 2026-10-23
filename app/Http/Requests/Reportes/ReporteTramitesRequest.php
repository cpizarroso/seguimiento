<?php

namespace App\Http\Requests\Reportes;

use App\Services\ConfiguracionService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReporteTramitesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $numeroTramite = $this->input('numero_tramite');

        if (is_string($numeroTramite) && trim($numeroTramite) === '') {
            $this->merge(['numero_tramite' => null]);
        }

        // El valor 0 representa "Todas las gestiones". Se normaliza a null,
        // conservando la clave para distinguirlo de una petición sin filtro.
        if ($this->has('gestion') && in_array((string) $this->input('gestion'), ['', '0'], true)) {
            $this->merge(['gestion' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'fecha_desde' => ['nullable', 'date'],
            'fecha_hasta' => ['nullable', 'date', 'after_or_equal:fecha_desde'],
            'hoy' => ['nullable', 'boolean'],
            'gestion' => [
                'nullable',
                'integer',
                'min:1',
                Rule::in(app(ConfiguracionService::class)->gestionesDisponibles()),
            ],
            'area_id' => ['nullable', 'integer', 'exists:areas,id'],
            'numero_tramite' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^\s*\d+(\s*-\s*\d+)?(\s*,\s*\d+(\s*-\s*\d+)?)*\s*$/',
            ],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'gestion.in' => 'La gestión seleccionada no está disponible.',
            'numero_tramite.regex' => 'El N° de trámite debe ser un número, una lista separada por comas o un rango. Ej.: 5, 1,3,5 o 1-10.',
        ];
    }

    /**
     * Filtros normalizados: si "hoy" está activo, el rango es hoy.
     *
     * @return array{
     *     fecha_desde: ?string,
     *     fecha_hasta: ?string,
     *     hoy: bool,
     *     gestion: ?int,
     *     area_id: ?int,
     *     numero_tramite: ?string
     * }
     */
    public function filtros(): array
    {
        $hoy = filter_var($this->input('hoy'), FILTER_VALIDATE_BOOLEAN);
        $numeroTramite = $this->normalizarNumeroTramite($this->input('numero_tramite'));
        $areaId = $this->filled('area_id') ? (int) $this->input('area_id') : null;
        $gestion = $this->has('gestion')
            ? ($this->filled('gestion') ? (int) $this->input('gestion') : null)
            : (int) now()->year;

        if ($hoy) {
            $hoyStr = today()->toDateString();

            return [
                'fecha_desde' => $hoyStr,
                'fecha_hasta' => $hoyStr,
                'hoy' => true,
                'gestion' => $gestion,
                'area_id' => $areaId,
                'numero_tramite' => $numeroTramite,
            ];
        }

        return [
            'fecha_desde' => $this->input('fecha_desde'),
            'fecha_hasta' => $this->input('fecha_hasta'),
            'hoy' => false,
            'gestion' => $gestion,
            'area_id' => $areaId,
            'numero_tramite' => $numeroTramite,
        ];
    }

    private function normalizarNumeroTramite(mixed $valor): ?string
    {
        if (! is_string($valor) || trim($valor) === '') {
            return null;
        }

        $segmentos = array_map('trim', explode(',', $valor));

        $normalizados = array_map(function (string $segmento): string {
            if (str_contains($segmento, '-')) {
                [$inicio, $fin] = array_map(
                    fn (string $parte) => (int) trim($parte),
                    explode('-', $segmento, 2),
                );

                if ($inicio > $fin) {
                    [$inicio, $fin] = [$fin, $inicio];
                }

                return "{$inicio}-{$fin}";
            }

            return (string) (int) $segmento;
        }, $segmentos);

        return implode(',', $normalizados);
    }
}
