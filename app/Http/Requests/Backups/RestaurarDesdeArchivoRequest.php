<?php

namespace App\Http\Requests\Backups;

use Illuminate\Foundation\Http\FormRequest;

class RestaurarDesdeArchivoRequest extends RestaurarBackupRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $maximoKb = max(1, (int) config('backups.max_import_mb', 100)) * 1024;

        return [
            ...parent::rules(),
            'archivo' => ['required', 'file', 'max:'.$maximoKb],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            ...parent::messages(),
            'archivo.required' => 'Seleccione un archivo de backup.',
            'archivo.file' => 'El archivo no es válido.',
            'archivo.max' => 'El archivo supera el tamaño máximo permitido.',
        ];
    }
}
