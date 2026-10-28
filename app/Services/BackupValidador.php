<?php

namespace App\Services;

use App\Backups\DiscosBackups;
use App\Models\Backup;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Valida la integridad y compatibilidad de archivos de backup.
 *
 * Dos entradas: archivo subido por el usuario y archivo registrado en disco.
 */
class BackupValidador
{
    public const EXTENSIONES = ['sql', 'gz'];

    public function __construct(
        private readonly DiscosBackups $discos,
    ) {}

    /**
     * Valida una subida y devuelve el SQL descomprimido.
     *
     * @throws ValidationException
     */
    public function validarSubida(UploadedFile $archivo): string
    {
        $nombre = (string) $archivo->getClientOriginalName();
        $extension = strtolower((string) $archivo->getClientOriginalExtension());

        if (! in_array($extension, self::EXTENSIONES, true)) {
            throw $this->error('El archivo debe tener extensión .sql o .sql.gz.');
        }

        if (! $archivo->isValid()) {
            throw $this->error('La subida del archivo falló. Intente nuevamente.');
        }

        $maximo = $this->maximoBytes();

        if ((int) $archivo->getSize() > $maximo) {
            throw $this->error('El archivo supera el límite de '.$this->mb($maximo).'.');
        }

        $contenido = file_get_contents($archivo->getRealPath());

        if ($contenido === false || $contenido === '') {
            throw $this->error('El archivo está vacío o no se pudo leer.');
        }

        return $this->validarContenido($contenido, $nombre);
    }

    /**
     * Valida un contenido ya leído (subida o archivo del servidor).
     *
     * @throws ValidationException
     */
    public function validarContenido(string $contenido, string $nombre): string
    {
        $sql = $this->descomprimir($contenido, $nombre);

        if (strlen($sql) > $this->maximoBytes() * 10) {
            throw $this->error('El contenido descomprimido es demasiado grande.');
        }

        $this->validarSql($sql);

        return $sql;
    }

    /**
     * Valida un backup registrado y devuelve su SQL descomprimido.
     */
    public function validarInterno(Backup $backup): string
    {
        $disco = $this->discos->disco($backup->disco);

        if (! $disco->exists($backup->ruta)) {
            throw new RuntimeException('El archivo del backup ya no existe en el disco.');
        }

        $contenido = $disco->get($backup->ruta);

        if ($contenido === null || $contenido === '') {
            throw new RuntimeException('No se pudo leer el archivo del backup.');
        }

        if ($backup->hash_sha256 !== null
            && ! hash_equals($backup->hash_sha256, hash('sha256', $contenido))) {
            throw new RuntimeException('La integridad del backup no coincide (hash SHA-256).');
        }

        $sql = @gzdecode($contenido);

        if ($sql === false) {
            throw new RuntimeException('El archivo del backup está dañado y no se puede descomprimir.');
        }

        $this->validarSql($sql);

        return $sql;
    }

    /**
     * Límite efectivo de subida: el menor entre configuración y php.ini.
     */
    public function maximoBytes(): int
    {
        $configurado = max(1, (int) config('backups.max_import_mb', 100)) * 1048576;
        $subida = $this->iniBytes((string) ini_get('upload_max_filesize'));
        $post = $this->iniBytes((string) ini_get('post_max_size'));

        $limites = array_filter(
            [$configurado, $subida, $post],
            fn (?int $bytes): bool => $bytes !== null && $bytes > 0,
        );

        return $limites === [] ? $configurado : (int) min($limites);
    }

    /**
     * @throws ValidationException
     */
    private function validarSql(string $sql): void
    {
        if (stripos($sql, 'CREATE TABLE') === false && stripos($sql, 'INSERT INTO') === false) {
            throw $this->error('El archivo no contiene sentencias SQL reconocibles.');
        }

        foreach ((array) config('backups.sentencias_prohibidas', []) as $sentencia) {
            if ($sentencia !== '' && stripos($sql, (string) $sentencia) !== false) {
                throw $this->error("El archivo contiene una sentencia no permitida: {$sentencia}.");
            }
        }

        $esperadas = (array) config('backups.tablas_esperadas', []);
        $encontradas = 0;

        foreach ($esperadas as $tabla) {
            if (preg_match('/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?'.preg_quote((string) $tabla, '/').'`?/i', $sql) === 1
                || preg_match('/INSERT\s+INTO\s+`?'.preg_quote((string) $tabla, '/').'`?/i', $sql) === 1) {
                $encontradas++;
            }
        }

        if ($esperadas !== [] && $encontradas < count($esperadas)) {
            throw $this->error('El archivo no parece ser un backup de esta aplicación (faltan tablas esperadas).');
        }
    }

    private function descomprimir(string $contenido, string $nombre): string
    {
        $esGzip = str_ends_with(strtolower($nombre), '.gz')
            || str_starts_with($contenido, "\x1f\x8b");

        if (! $esGzip) {
            return $contenido;
        }

        $sql = @gzdecode($contenido);

        if ($sql === false) {
            throw $this->error('El archivo .gz no se pudo descomprimir.');
        }

        return $sql;
    }

    private function iniBytes(string $valor): ?int
    {
        $valor = trim($valor);

        if ($valor === '' || $valor === '-1') {
            return null;
        }

        $unidad = strtolower(substr($valor, -1));
        $numero = (float) $valor;

        return (int) match ($unidad) {
            'g' => $numero * 1073741824,
            'm' => $numero * 1048576,
            'k' => $numero * 1024,
            default => $numero,
        };
    }

    private function mb(int $bytes): string
    {
        return max(1, (int) round($bytes / 1048576)).' MB';
    }

    private function error(string $mensaje): ValidationException
    {
        return ValidationException::withMessages(['archivo' => $mensaje]);
    }
}
