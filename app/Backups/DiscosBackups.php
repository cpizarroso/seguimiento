<?php

namespace App\Backups;

use App\Models\Configuracion;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Resuelve el disco donde se guardan los backups.
 *
 * Sin destino configurado se usa el disco `backups`
 * (storage/app/private/backups-{slug}). Si el administrador elige una unidad
 * local del servidor, los backups nuevos se guardan en
 * `{unidad}:\{carpeta}` mediante un disco propio por unidad (`backups-d`),
 * de modo que cada registro conserva la ubicación real de su archivo aunque
 * después se cambie el destino.
 */
final class DiscosBackups
{
    public const DISCO_PREDETERMINADO = 'backups';

    public const CLAVE_DESTINO = 'backup_destino';

    public const CARPETA_POR_DEFECTO = 'backup-seguimiento';

    /**
     * Catálogo de destinos disponibles (unidades locales del servidor).
     *
     * En Windows se enumeran las unidades existentes; en otros sistemas (y en
     * pruebas) se usa la lista de `config('backups.destinos')`.
     *
     * @return list<array{id: string, etiqueta: string, ruta: string, libre_bytes: int|null, total_bytes: int|null}>
     */
    public function destinos(): array
    {
        $configurados = config('backups.destinos');

        if (is_array($configurados) && $configurados !== []) {
            return array_values(array_map(
                fn (mixed $entrada): array => $this->destinoDesdeConfig($entrada),
                $configurados,
            ));
        }

        if (PHP_OS_FAMILY !== 'Windows') {
            return [];
        }

        $destinos = [];

        foreach (range('A', 'Z') as $letra) {
            if (! @is_dir($letra.':'.DIRECTORY_SEPARATOR)) {
                continue;
            }

            $destinos[] = $this->destinoDesdeLetra($letra);
        }

        return $destinos;
    }

    /**
     * Destino guardado en la configuración (null = predeterminado del servidor).
     */
    public function destinoActual(): ?string
    {
        $valor = Configuracion::where('clave', self::CLAVE_DESTINO)->value('valor');

        if (! is_string($valor)) {
            return null;
        }

        $valor = trim($valor);

        return $valor === '' ? null : $valor;
    }

    /**
     * Nombre del disco Laravel que se está usando para escribir backups.
     */
    public function activo(): string
    {
        return $this->nombreDisco($this->destinoActual());
    }

    public function nombreDisco(?string $destino): string
    {
        if ($destino === null || trim($destino) === '') {
            return self::DISCO_PREDETERMINADO;
        }

        $sufijo = preg_replace('/[^a-z0-9]+/', '-', $this->normalizarId($destino)) ?? '';
        $sufijo = trim($sufijo, '-');

        return self::DISCO_PREDETERMINADO.'-'.($sufijo !== '' ? $sufijo : 'extra');
    }

    /**
     * Devuelve el disco Laravel para el nombre indicado, registrándolo si aún
     * no existe (por ejemplo `backups-d`).
     */
    public function disco(?string $nombre = null): Filesystem
    {
        $nombre ??= $this->activo();

        $clave = "filesystems.disks.{$nombre}";

        if (! config()->has($clave)) {
            config([$clave => [
                'driver' => 'local',
                'root' => $this->raiz($nombre),
                'throw' => true,
                'report' => false,
                'serve' => false,
            ]]);
        }

        return Storage::disk($nombre);
    }

    public function ruta(?string $nombre = null): string
    {
        return $this->raiz($nombre ?? $this->activo());
    }

    /**
     * Comprueba si la unidad elegida sigue disponible en el servidor.
     */
    public function disponible(string $destino): bool
    {
        $id = $this->normalizarId($destino);

        foreach ($this->destinos() as $candidato) {
            if ($this->normalizarId($candidato['id']) === $id) {
                return true;
            }
        }

        return false;
    }

    /**
     * Crea la carpeta del destino y verifica que se pueda escribir en ella.
     *
     * @return string ruta absoluta lista para usar
     *
     * @throws RuntimeException
     */
    public function preparar(string $destino): string
    {
        if (! $this->disponible($destino)) {
            throw new RuntimeException("La unidad «{$destino}» no está disponible en el servidor.");
        }

        $ruta = $this->rutaDeDestino($destino);

        if (! is_dir($ruta) && ! @mkdir($ruta, 0775, true) && ! is_dir($ruta)) {
            throw new RuntimeException("No se pudo crear la carpeta de backups en «{$ruta}».");
        }

        if (! is_writable($ruta)) {
            throw new RuntimeException("Sin permisos de escritura en «{$ruta}».");
        }

        return $ruta;
    }

    /**
     * Prepara el destino activo antes de escribir. El disco predeterminado lo
     * crea el driver local, así que aquí solo se valida la unidad elegida.
     */
    public function prepararActivo(): void
    {
        $destino = $this->destinoActual();

        if ($destino !== null) {
            $this->preparar($destino);
        }
    }

    private function rutaDeDestino(string $destino): string
    {
        $id = $this->normalizarId($destino);

        foreach ($this->destinos() as $candidato) {
            if ($this->normalizarId($candidato['id']) === $id) {
                return $candidato['ruta'];
            }
        }

        if (preg_match('/^[a-z]$/', $id) === 1) {
            return strtoupper($id).':'.DIRECTORY_SEPARATOR.$this->carpeta();
        }

        throw new RuntimeException("La unidad «{$destino}» no está disponible en el servidor.");
    }

    private function raiz(string $nombre): string
    {
        if ($nombre === self::DISCO_PREDETERMINADO) {
            return (string) config('filesystems.disks.backups.root');
        }

        $sufijo = $this->sufijoDeDisco($nombre);

        foreach ($this->destinos() as $destino) {
            if ($this->normalizarId($destino['id']) === $this->normalizarId($sufijo)) {
                return $destino['ruta'];
            }
        }

        // La unidad ya no está conectada: se reconstruye la ruta para que los
        // registros antiguos se comporten como «archivo no encontrado» en vez
        // de romper la pantalla.
        if (preg_match('/^[a-z]$/', $this->normalizarId($sufijo)) === 1) {
            return strtoupper($sufijo).':'.DIRECTORY_SEPARATOR.$this->carpeta();
        }

        throw new RuntimeException("Disco de backups desconocido: «{$nombre}».");
    }

    private function sufijoDeDisco(string $nombre): string
    {
        $prefijo = self::DISCO_PREDETERMINADO.'-';

        if (! str_starts_with($nombre, $prefijo)) {
            throw new RuntimeException("Disco de backups desconocido: «{$nombre}».");
        }

        return substr($nombre, strlen($prefijo));
    }

    /**
     * @return array{id: string, etiqueta: string, ruta: string, libre_bytes: int|null, total_bytes: int|null}
     */
    private function destinoDesdeLetra(string $letra): array
    {
        $letra = strtoupper($letra);
        $unidad = $letra.':'.DIRECTORY_SEPARATOR;
        $libre = @disk_free_space($unidad);
        $total = @disk_total_space($unidad);

        return [
            'id' => $letra,
            'etiqueta' => $letra.':',
            'ruta' => $unidad.$this->carpeta(),
            'libre_bytes' => is_numeric($libre) ? (int) $libre : null,
            'total_bytes' => is_numeric($total) ? (int) $total : null,
        ];
    }

    /**
     * @return array{id: string, etiqueta: string, ruta: string, libre_bytes: int|null, total_bytes: int|null}
     */
    private function destinoDesdeConfig(mixed $entrada): array
    {
        if (is_string($entrada)) {
            $entrada = ['ruta' => $entrada];
        }

        $datos = is_array($entrada) ? $entrada : [];
        $ruta = rtrim((string) ($datos['ruta'] ?? ''), '\\/');
        $id = trim((string) ($datos['id'] ?? ''));

        if ($id === '') {
            $id = (string) (Str::slug($ruta) ?: 'extra');
        }

        $libre = $ruta !== '' ? @disk_free_space($ruta) : false;
        $total = $ruta !== '' ? @disk_total_space($ruta) : false;

        return [
            'id' => $id,
            'etiqueta' => (string) ($datos['etiqueta'] ?? $id),
            'ruta' => $ruta !== '' ? $ruta.DIRECTORY_SEPARATOR.$this->carpeta() : '',
            'libre_bytes' => is_numeric($libre) ? (int) $libre : null,
            'total_bytes' => is_numeric($total) ? (int) $total : null,
        ];
    }

    private function carpeta(): string
    {
        $carpeta = trim((string) config('backups.carpeta_destino', self::CARPETA_POR_DEFECTO), '\\/');

        return $carpeta !== '' ? $carpeta : self::CARPETA_POR_DEFECTO;
    }

    private function normalizarId(string $id): string
    {
        return Str::lower(trim($id));
    }
}
