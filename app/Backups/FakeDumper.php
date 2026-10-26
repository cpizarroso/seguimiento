<?php

namespace App\Backups;

use App\Backups\Contrato\Dumper;
use RuntimeException;

/**
 * Doble de pruebas: no invoca binarios de MySQL.
 *
 * Se enlaza en el container desde los tests con app()->instance(Dumper::class, $fake).
 */
class FakeDumper implements Dumper
{
    public bool $fallaAlVolcar = false;

    /**
     * Número de restauración (1-based) que debe fallar. null = nunca falla.
     */
    public ?int $fallarEnRestauracion = null;

    /** @var list<array{ruta: string, tipo: string}> */
    public array $volcados = [];

    /** @var list<string> */
    public array $restauraciones = [];

    public int $vaciados = 0;

    public string $contenidoSql = '';

    public function __construct()
    {
        $this->contenidoSql = $this->sqlPorDefecto();
    }

    public function disponible(): bool
    {
        return true;
    }

    public function volcar(string $rutaSql, string $tipo): void
    {
        if ($this->fallaAlVolcar) {
            throw new RuntimeException('Fallo simulado de mysqldump.');
        }

        file_put_contents($rutaSql, $this->contenidoSql);

        $this->volcados[] = ['ruta' => $rutaSql, 'tipo' => $tipo];
    }

    public function restaurar(string $rutaSql): void
    {
        $numero = count($this->restauraciones) + 1;

        if ($this->fallarEnRestauracion !== null && $numero === $this->fallarEnRestauracion) {
            $this->restauraciones[] = $rutaSql;

            throw new RuntimeException('Fallo simulado de importación.');
        }

        $this->restauraciones[] = $rutaSql;
    }

    public function vaciarEsquema(): void
    {
        $this->vaciados++;
    }

    private function sqlPorDefecto(): string
    {
        return <<<'SQL'
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE `users` (`id` bigint unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`));
CREATE TABLE `migrations` (`id` int unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`));
CREATE TABLE `areas` (`id` bigint unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`));
CREATE TABLE `personas` (`id` bigint unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`));
CREATE TABLE `tramites` (`id` bigint unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`));
CREATE TABLE `derivaciones` (`id` bigint unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`));

INSERT INTO `areas` (`id`) VALUES (1);

SET FOREIGN_KEY_CHECKS=1;
SQL;
    }
}
