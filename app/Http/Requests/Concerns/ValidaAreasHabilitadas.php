<?php

namespace App\Http\Requests\Concerns;

use Closure;

trait ValidaAreasHabilitadas
{
    /**
     * Reglas para las áreas habilitadas para crear trámites.
     *
     * @return array<string, mixed>
     */
    protected function reglasAreasHabilitadas(): array
    {
        return [
            'area_ids' => ['nullable', 'array'],
            'area_ids.*' => ['integer', 'distinct', 'exists:areas,id'],
            'area_predeterminada_id' => [
                'nullable',
                'integer',
                'required_with:area_ids',
                'exists:areas,id',
                $this->areaPredeterminadaPertenece(),
            ],
        ];
    }

    private function areaPredeterminadaPertenece(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            $areaIds = array_map('intval', (array) $this->input('area_ids', []));

            if ($areaIds === []) {
                return;
            }

            if (! in_array((int) $value, $areaIds, true)) {
                $fail('El área predeterminada debe ser una de las áreas habilitadas.');
            }
        };
    }
}
