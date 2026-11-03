<?php

namespace App\Console\Commands;

use App\Services\ImportacionDocumentosDlaService;
use Illuminate\Console\Command;

class ImportarDocumentosDla extends Command
{
    protected $signature = 'importar:documentos-dla
                            {archivo : Ruta del archivo .xlsx}
                            {--simular : Analiza el archivo sin escribir en la base de datos}
                            {--forzar : Importa aunque ya existan trámites de DLA en la gestión}';

    protected $description = 'Importa la planilla de DOCUMENTOS RECIB DLA (gestión 2026)';

    public function handle(ImportacionDocumentosDlaService $servicio): int
    {
        $archivo = (string) $this->argument('archivo');
        $simular = (bool) $this->option('simular');

        $this->info($simular ? 'Simulando importación...' : 'Importando...');

        $reporte = $servicio->importar($archivo, $simular, (bool) $this->option('forzar'));

        $this->table(
            ['Métrica', 'Total'],
            [
                ['Trámites', $reporte['tramites']],
                ['Derivaciones', $reporte['derivaciones']],
                ['Duplicados renumerados', $reporte['duplicados']],
                ['Filas sin datos', $reporte['sin_datos']],
            ],
        );

        if ($simular) {
            $this->warn('Modo simulación: no se escribió nada.');
        }

        return self::SUCCESS;
    }
}
