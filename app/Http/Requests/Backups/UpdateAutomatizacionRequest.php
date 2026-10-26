<?php

namespace App\Http\Requests\Backups;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAutomatizacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('backups', 'edicion') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'habilitado' => ['required', 'boolean'],
            'frecuencia' => ['required', Rule::in(['diaria', 'semanal', 'mensual'])],
            'hora' => ['required', 'date_format:H:i'],
            'dia_semana' => ['nullable', 'required_if:frecuencia,semanal', 'integer', 'between:1,7'],
            'dia_mes' => ['nullable', 'required_if:frecuencia,mensual', 'integer', 'between:1,31'],
            'maximo' => ['required', 'integer', 'between:1,999'],
            'cuota_mb' => ['required', 'integer', 'between:0,1048576'],
            'alerta_porcentaje' => ['required', 'integer', 'between:1,99'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'habilitado.required' => 'Indique si la automatización está habilitada.',
            'frecuencia.required' => 'Seleccione una frecuencia.',
            'frecuencia.in' => 'La frecuencia seleccionada no es válida.',
            'hora.required' => 'Indique la hora de ejecución.',
            'hora.date_format' => 'La hora debe tener el formato HH:MM.',
            'dia_semana.required_if' => 'Seleccione el día de la semana.',
            'dia_semana.between' => 'El día de la semana debe estar entre 1 (lunes) y 7 (domingo).',
            'dia_mes.required_if' => 'Indique el día del mes.',
            'dia_mes.between' => 'El día del mes debe estar entre 1 y 31.',
            'maximo.required' => 'Indique el número máximo de backups a conservar.',
            'maximo.between' => 'El máximo debe estar entre 1 y 999.',
            'cuota_mb.required' => 'Indique la cuota de almacenamiento.',
            'cuota_mb.between' => 'La cuota debe estar entre 0 y 1.048.576 MB.',
            'alerta_porcentaje.required' => 'Indique el porcentaje de alerta.',
            'alerta_porcentaje.between' => 'El porcentaje de alerta debe estar entre 1 y 99.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'habilitado' => 'automatización',
            'frecuencia' => 'frecuencia',
            'hora' => 'hora',
            'dia_semana' => 'día de la semana',
            'dia_mes' => 'día del mes',
            'maximo' => 'máximo de backups',
            'cuota_mb' => 'cuota',
            'alerta_porcentaje' => 'porcentaje de alerta',
        ];
    }
}
