<?php

namespace App\Console\Commands;

use App\Backups\DiscosBackups;
use App\Models\Backup;
use App\Services\BackupEspacioService;
use App\Services\BackupProgramacionService;
use App\Services\BackupRestauracionService;
use App\Support\BinarioMysql;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class BackupsDiagnostico extends Command
{
    protected $signature = 'backups:diagnostico
                            {--importar= : Ruta absoluta de un archivo .sql o .sql.gz para importar}
                            {--limpiar-temporales : Elimina archivos temporales de más de 24 horas}';

    protected $description = 'Verifica binarios, base de datos, disco, configuración y backups';

    public function handle(
        BinarioMysql $binarios,
        BackupProgramacionService $programacion,
        BackupEspacioService $espacio,
        BackupRestauracionService $restauracion,
        DiscosBackups $discos,
    ): int {
        $fallos = 0;

        $binariosOk = $this->mostrarBinarios($binarios);
        $dbOk = $this->mostrarBaseDatos();
        $discoOk = $this->mostrarEspacio($espacio);

        if (! $binariosOk || ! $dbOk || ! $discoOk) {
            $fallos++;
        }

        $this->mostrarConfiguracion($programacion, $discos);
        $this->mostrarBackups();

        if ($this->option('limpiar-temporales')) {
            $this->limpiarTemporales();
        }

        $ruta = $this->option('importar');

        if (is_string($ruta) && $ruta !== '') {
            $this->importar($ruta, $restauracion);
        }

        if ($fallos > 0) {
            $this->newLine();
            $this->error('Diagnóstico con problemas: revise las líneas marcadas como FALLÓ.');

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Diagnóstico OK.');

        return self::SUCCESS;
    }

    private function mostrarBinarios(BinarioMysql $binarios): bool
    {
        $this->info('Binarios de MySQL');

        $mysqldump = $binarios->mysqldump();
        $mysql = $binarios->mysql();

        $this->line('  mysqldump: '.($mysqldump ?? 'NO ENCONTRADO'));
        $this->line('  mysql:     '.($mysql ?? 'NO ENCONTRADO'));

        if ($mysqldump === null || $mysql === null) {
            $this->warn('  Configure BACKUP_MYSQLDUMP_PATH y BACKUP_MYSQL_PATH en .env');

            return false;
        }

        $this->line('  versión:   '.($binarios->version($mysqldump) ?? 'desconocida'));
        $this->newLine();

        return true;
    }

    private function mostrarBaseDatos(): bool
    {
        $this->info('Base de datos');

        $conexion = (array) config('database.connections.mysql');

        try {
            $pdo = DB::connection()->getPdo();
            $pdo->query('SELECT 1');
            $version = (string) $pdo->getAttribute(\PDO::ATTR_SERVER_VERSION);

            $this->line('  base:    '.($conexion['database'] ?? '—'));
            $this->line('  versión: '.$version);
            $this->newLine();

            return true;
        } catch (Throwable $e) {
            $this->error('  conexión FALLÓ: '.$e->getMessage());
            $this->newLine();

            return false;
        }
    }

    private function mostrarEspacio(BackupEspacioService $espacio): bool
    {
        $datos = $espacio->calcular();

        $this->info('Almacenamiento');

        $ruta = $datos['disco']['ruta'];
        $escribible = is_dir($ruta) && is_writable($ruta);

        $this->line('  ruta:      '.$ruta);
        $this->line('  escritura: '.($escribible ? 'OK' : 'FALLÓ (sin permisos de escritura)'));
        $this->line('  libre:     '.$this->mb((int) ($datos['disco']['libre_bytes'] ?? 0)));
        $this->line('  backups:   '.$datos['backups']['cantidad'].' ('.$this->mb((int) $datos['backups']['total_bytes']).')');
        $this->line('  huérfanos: '.$datos['backups']['huerfanos']);

        foreach ($datos['alertas'] as $alerta) {
            $this->warn("  [{$alerta['nivel']}] {$alerta['mensaje']}");
        }

        $this->newLine();

        return $escribible;
    }

    private function mostrarConfiguracion(BackupProgramacionService $programacion, DiscosBackups $discos): void
    {
        $config = $programacion->configuracion();

        $destino = $config['destino'] === null
            ? 'predeterminado'
            : $config['destino'].' → '.$discos->ruta($discos->nombreDisco($config['destino']));

        $this->info('Automatización');
        $this->line('  habilitado: '.($config['habilitado'] ? 'sí' : 'no'));
        $this->line('  frecuencia: '.$config['frecuencia']);
        $this->line('  hora:       '.$config['hora']);
        $this->line('  máximo:     '.$config['maximo']);
        $this->line('  destino:    '.$destino);
        $this->line('  última:     '.($config['ultima_ejecucion']?->format('d/m/Y H:i') ?? 'nunca'));
        $this->line('  próxima:    '.($config['proxima_ejecucion']?->format('d/m/Y H:i') ?? 'no programada'));
        $this->newLine();
    }

    private function mostrarBackups(): void
    {
        $ultimos = Backup::latest('created_at')->limit(10)->get();

        if ($ultimos->isEmpty()) {
            $this->line('No hay backups registrados.');
            $this->newLine();

            return;
        }

        $this->table(
            ['ID', 'Nombre', 'Tipo', 'Estado', 'Tamaño', 'Creado'],
            $ultimos->map(fn (Backup $backup): array => [
                $backup->id,
                $backup->nombre,
                $backup->tipo,
                $backup->estado,
                $this->mb((int) $backup->tamano_bytes),
                $backup->created_at?->format('d/m/Y H:i'),
            ])->all(),
        );
    }

    private function limpiarTemporales(): void
    {
        $directorio = storage_path('framework/tmp');
        $limite = now()->subHours(24)->getTimestamp();
        $eliminados = 0;

        foreach (glob($directorio.DIRECTORY_SEPARATOR.'*') ?: [] as $archivo) {
            if (is_file($archivo) && filemtime($archivo) < $limite) {
                @unlink($archivo);
                $eliminados++;
            }
        }

        $this->info("Temporales eliminados: {$eliminados}");
    }

    private function importar(string $ruta, BackupRestauracionService $restauracion): void
    {
        $this->warn('IMPORTANTE: esta operación reemplaza los datos actuales.');
        $this->line("Archivo: {$ruta}");

        if (! $this->confirm('¿Desea continuar con la importación?', false)) {
            $this->line('Importación cancelada.');

            return;
        }

        try {
            $resultado = $restauracion->restaurarArchivoDelServidor($ruta);

            $this->info("Importación completada desde {$resultado['backup']->nombre}.");
            $this->line("Copia previa: {$resultado['pre']->nombre}");
            $this->line("Duración: {$resultado['duracion_ms']} ms");
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());
        }
    }

    private function mb(int $bytes): string
    {
        return number_format($bytes / 1048576, 2, ',', '.').' MB';
    }
}
