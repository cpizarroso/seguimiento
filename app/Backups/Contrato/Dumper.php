<?php

namespace App\Backups\Contrato;

/**
 * Abstracción del motor de volcado/restauración.
 *
 * Permite sustituir MySQL por otro motor (o por un doble de pruebas) sin
 * tocar la lógica de negocio de los servicios de backup.
 */
interface Dumper
{
    /**
     * Indica si el motor está disponible (binarios encontrados, conexión válida).
     */
    public function disponible(): bool;

    /**
     * Genera un volcado SQL completo en la ruta indicada.
     *
     * @param  string  $tipo  manual|automatico|pre_restauracion|importado (solo cabecera)
     */
    public function volcar(string $rutaSql, string $tipo): void;

    /**
     * Importa un archivo SQL sobre la base configurada.
     */
    public function restaurar(string $rutaSql): void;

    /**
     * Elimina todas las tablas de la base configurada (reemplazo total).
     */
    public function vaciarEsquema(): void;
}
