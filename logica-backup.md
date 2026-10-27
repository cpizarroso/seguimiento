# Lógica de Backup — Seguimiento de Trámites

| Campo | Valor |
|---|---|
| Documento | `logica-backup.md` |
| Versión | 1.1 |
| Fecha | 2026-10-26 |
| Aplicación | Seguimiento de Trámites (Laravel 13 + React 19 + Inertia + MySQL 8.4) |
| Audiencia | Desarrollo, infraestructura, auditoría interna |
| Propósito | Especificación completa y portable del módulo de backups, para replicar el mismo comportamiento en otro sistema |

> Este documento es la **fuente de verdad** del módulo. Si el código y este documento difieren, es un bug: se corrige el código o se actualiza el documento, nunca se ignora la diferencia.

---

## Índice

1. [Objetivo y alcance](#1-objetivo-y-alcance)
2. [Resumen de decisiones](#2-resumen-de-decisiones)
3. [Modelo de datos](#3-modelo-de-datos)
4. [Estructura en disco y nombres de archivo](#4-estructura-en-disco-y-nombres-de-archivo)
5. [Configuración](#5-configuración)
6. [Permisos y roles](#6-permisos-y-roles)
7. [Flujo: backup manual](#7-flujo-backup-manual)
8. [Flujo: backup automático](#8-flujo-backup-automático)
9. [Cálculo de vencimiento](#9-cálculo-de-vencimiento)
10. [Composición del archivo de backup](#10-composición-del-archivo-de-backup)
11. [Retención y protección](#11-retención-y-protección)
12. [Auditoría](#12-auditoría)
13. [Flujo: restauración](#13-flujo-restauración)
14. [Advertencia de pérdida de datos](#14-advertencia-de-pérdida-de-datos)
15. [Detalles posteriores a la restauración](#15-detalles-posteriores-a-la-restauración)
16. [Panel de estado del almacenamiento](#16-panel-de-estado-del-almacenamiento)
17. [Mapa de la pantalla](#17-mapa-de-la-pantalla)
18. [Rutas y API](#18-rutas-y-api)
19. [Comandos artisan](#19-comandos-artisan)
20. [Despliegue y programación del sistema operativo](#20-despliegue-y-programación-del-sistema-operativo)
21. [Procedimiento manual de emergencia](#21-procedimiento-manual-de-emergencia)
22. [Prueba de fuego (drill)](#22-prueba-de-fuego-drill)
23. [Solución de problemas](#23-solución-de-problemas)
24. [Portabilidad a otro sistema](#24-portabilidad-a-otro-sistema)
25. [Fuera de alcance y mejoras futuras](#25-fuera-de-alcance-y-mejoras-futuras)
26. [Inventario de archivos](#26-inventario-de-archivos)
27. [Anexos](#27-anexos)

---

## 1. Objetivo y alcance

### 1.1 Qué hace el módulo

Gestiona el ciclo de vida completo de los respaldos de la base de datos MySQL de la aplicación:

1. **Generar** backups de la base de datos (`mysqldump`).
2. **Almacenar** los archivos comprimidos en un disco privado, fuera del alcance público.
3. **Registrar** quién genera, quién descarga y quién restaura, con fecha y hora.
4. **Automatizar** la generación con frecuencia diaria, semanal o mensual.
5. **Limitar** la cantidad de backups retenidos (10 por defecto).
6. **Restaurar** la base desde un backup interno **o desde un archivo seleccionado del disco** por el usuario.
7. **Informar** el estado del almacenamiento mediante gráficos (disco, cuota de backups, tamaño por archivo).

### 1.2 Qué NO hace (explícitamente)

- No respalda archivos fuera de la base de datos: PDFs de reportes (`storage/app/private/reportes/`), `.env`, código fuente, `node_modules`, `public/build`.
- No cifra los archivos de backup (ver §25).
- No envía backups a almacenamiento remoto (S3/FTP) en esta versión.
- No reemplaza una política institucional de respaldo: es el mecanismo operativo de la aplicación.

### 1.3 Contexto técnico verificado del entorno

| Aspecto | Valor real verificado |
|---|---|
| PHP | 8.3.28 (`C:\wamp64\bin\php\php8.3.28\php.ini`) |
| MySQL | 8.4.7 |
| Base de datos | `seguimiento_adm` |
| Motor de tablas de negocio | **MyISAM** (todas las tablas existentes) |
| Tamaño actual de la BD | ~1 MB |
| `mysqldump` | `C:\wamp64\bin\mysql\mysql8.4.7\bin\mysqldump.exe` (v8.4.7) — **no está en PATH** |
| `mysql` (cliente) | `C:\wamp64\bin\mysql\mysql8.4.7\bin\mysql.exe` — **no está en PATH** |
| `exec` / `proc_open` | Habilitados |
| `upload_max_filesize` / `post_max_size` | 100 MB / 104 MB |
| `memory_limit` | 256 MB |
| `max_execution_time` | 0 (ilimitado) |
| Zona horaria de la app | `America/La_Paz` (UTC−4) |
| Disco de almacenamiento | `local` → `storage/app/private` |
| Gráficos | `recharts` 3.x ya instalado (no requiere dependencias nuevas) |

### 1.4 Consecuencias del motor MyISAM

Este punto condiciona el diseño y **debe revisarse si se migra a InnoDB**:

| Consecuencia | Implicación en el backup |
|---|---|
| No hay transacciones | `mysqldump --single-transaction` **no sirve**; se usa `--lock-tables` (bloqueo de escritura durante el dump) |
| El bloqueo de tablas es global por dump | Con ~1 MB es imperceptible; con bases grandes habrá una pausa breve de escrituras |
| Las FKs no se aplican | `SET FOREIGN_KEY_CHECKS` es inocuo, pero se mantiene por portabilidad |
| Restauración no es atómica | Obligatorio backup `pre_restauracion` + **rollback automático** si el import falla |
| Las tablas nuevas del módulo serán InnoDB | No se pueden declarar FKs hacia `users` (MyISAM): integridad a nivel de aplicación |

---

## 2. Resumen de decisiones

Tabla de decisiones cerradas con el usuario (sirve como criterio de réplica en otro sistema).

| # | Tema | Decisión |
|---|---|---|
| 1 | Generación del dump | `mysqldump` CLI con ruta configurable y autodetección. Sin paquetes de terceros |
| 2 | Disparo automático | Laravel Scheduler **+** disparo perezoso de respaldo (middleware en `terminate()`) |
| 3 | Contenido | Estructura de **todas** las tablas + datos solo de tablas de negocio |
| 4 | Restauración | Backup `pre_restauracion` obligatorio + escribir `RESTAURAR` + contraseña del usuario + modo mantenimiento |
| 5 | Retención | Tope global (10 por defecto) con bandera `protegido` que la limpieza nunca elimina |
| 6 | Formato | `.sql.gz` comprimido con `gzencode` de PHP |
| 7 | Auditoría | Dos tablas: `backups` (archivo) + `backup_eventos` (bitácora inmutable) |
| 8 | Permisos | Módulo `backups` con 6 permisos: `consulta`, `creacion`, `edicion`, `baja`, `descarga`, `restauracion` |
| 9 | Ubicación | Disco `backups` en `filesystems.php`, root por `.env`; la UI solo muestra la ruta |
| 10 | Ejecución | Síncrona, sin cola de trabajo, con `set_time_limit(0)` |
| 11 | Fallos | Estado `fallido` visible + banner de alerta (< 72 h) + `Log::error` |
| 12 | Frecuencia | Una sola activa: diaria / semanal / mensual / desactivada |
| 13 | Archivo externo | Se archiva como `importado` y se marca `protegido` automáticamente (desprotegible a mano) |
| 14 | Backup pre-restauración | Se crea siempre; **solo el más reciente** queda `protegido` (los anteriores se desprotegen solos) |
| 15 | Auditoría tras restaurar | El historial local sobrevive; se reinserta el evento de restauración si el archivo lo borró |
| 16 | Configuración tras restaurar | Se preserva la configuración vigente de backups (frecuencia, hora, tope, cuota) |
| 17 | Estado del disco | Dona del disco + cuota de backups + tamaño por backup en el tiempo (sin serie acumulada reescrita) |
| 18 | Reemplazo de datos | Restauración = reemplazo total (drop de todas las tablas) con rollback automático si el import falla |
| 19 | Modo mantenimiento | `register_shutdown_function` garantiza el `up`; comando `backups:recuperar` para desbloqueo manual |
| 20 | Identidad de la carpeta | Slug estable `BACKUP_APP_SLUG`, independiente de `APP_NAME` |
| 21 | Sesión tras restaurar | Redirect a `backups.index` con flash, **sin** logout forzado (§13.6) |
| 22 | Historial por backup | `GET /backups/{backup}/eventos` (JSON) alimenta el modal "Ver historial" de cada fila (§12.2) |
| 23 | Diagnóstico monitoreable | `backups:diagnostico` devuelve código `1` si binarios, base de datos o escritura fallan (§19) |
| 24 | Recuperación tras corte | `backups:recuperar` marca `fallido` todo `en_proceso` de más de 1 h y `--limpiar` elimina huérfanos del disco (§19) |

---

## 3. Modelo de datos

### 3.1 Tabla `backups` — el archivo

| Campo | Tipo | Nulo | Default | Descripción |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED PK | no | auto | |
| `nombre` | VARCHAR(180) | no | | Nombre del archivo en disco |
| `nombre_original` | VARCHAR(180) | sí | null | Solo para `tipo=importado`: nombre que subió el usuario |
| `ruta` | VARCHAR(255) | no | | Ruta relativa al disco (`backups/...`) |
| `disco` | VARCHAR(40) | no | `backups` | Nombre del disco de Laravel usado |
| `tipo` | ENUM | no | | `manual` \| `automatico` \| `pre_restauracion` \| `importado` |
| `estado` | ENUM | no | `en_proceso` | `en_proceso` \| `completado` \| `fallido` |
| `tamano_bytes` | BIGINT UNSIGNED | sí | null | Tamaño del archivo comprimido |
| `hash_sha256` | CHAR(64) | sí | null | Integridad; se recalcula antes de restaurar |
| `protegido` | TINYINT(1) | no | 0 | Excluido de la limpieza automática |
| `user_id` | BIGINT UNSIGNED | sí | null | Autor. `null` = Sistema (scheduler) |
| `error` | TEXT | sí | null | Mensaje de fallo de `mysqldump`/import |
| `created_at` / `updated_at` | TIMESTAMP | sí | null | |

Índices: `(estado, created_at)`, `(tipo)`, `(protegido)`, `(user_id)`.

> **Sin FK hacia `users`**: la tabla `users` es MyISAM y MySQL no permite FKs entre InnoDB y MyISAM. La integridad se garantiza por aplicación y `user_id` se muestra como "Sistema" cuando es `null` o cuando el usuario ya no existe.

### 3.2 Tabla `backup_eventos` — bitácora inmutable

| Campo | Tipo | Nulo | Descripción |
|---|---|---|---|
| `id` | BIGINT UNSIGNED PK | no | |
| `backup_id` | BIGINT UNSIGNED | sí | FK a `backups` con `ON DELETE SET NULL` |
| `backup_nombre` | VARCHAR(180) | no | Snapshot: sobrevive al borrado del registro |
| `accion` | ENUM | no | `creacion` \| `carga_externa` \| `descarga` \| `restauracion` \| `eliminacion` \| `fallo` |
| `user_id` | BIGINT UNSIGNED | sí | `null` = scheduler/sistema |
| `ip` | VARCHAR(45) | sí | IPv4/IPv6 del actor |
| `detalle` | TEXT | sí | Duración, error, nombre original, aclaraciones |
| `created_at` | TIMESTAMP | sí | |

Reglas:
- La bitácora **nunca se edita ni se borra** desde la aplicación.
- Sobrevive al borrado del archivo (por eso `backup_nombre` es snapshot).
- No se elimina en cascada al borrar un backup.

### 3.3 Claves de configuración (tabla `configuraciones`)

Se reutiliza la tabla clave/valor existente (`clave` VARCHAR único, `valor` TEXT).

| Clave | Valores | Default | Uso |
|---|---|---|---|
| `backup_auto_habilitado` | `0` / `1` | `0` | Interruptor de automatización |
| `backup_frecuencia` | `diaria` / `semanal` / `mensual` | `diaria` | Frecuencia activa |
| `backup_hora` | `HH:MM` | `02:00` | Hora de ejecución (zona `America/La_Paz`) |
| `backup_dia_semana` | `1`–`7` (ISO: 1=lunes) | `1` | Solo si `semanal` |
| `backup_dia_mes` | `1`–`31` | `1` | Solo si `mensual`; si el mes no tiene el día, se usa el último día |
| `backup_maximo` | entero ≥ 1 | `10` | Tope global de backups |
| `backup_cuota_mb` | entero ≥ 0 | `0` | Cuota de la carpeta de backups; `0` = ilimitada |
| `backup_alerta_porcentaje` | 1–99 | `85` | Umbral de alerta de espacio |
| `backup_ultima_ejecucion` | `Y-m-d H:i:s` | null | Línea base del cálculo de vencimiento |
| `backup_auto_habilitado_en` | `Y-m-d H:i:s` | null | Momento en que se activó la automatización |

### 3.4 DDL completo

```sql
-- Tabla de archivos de backup
CREATE TABLE `backups` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(180) NOT NULL,
  `nombre_original` VARCHAR(180) DEFAULT NULL,
  `ruta` VARCHAR(255) NOT NULL,
  `disco` VARCHAR(40) NOT NULL DEFAULT 'backups',
  `tipo` ENUM('manual','automatico','pre_restauracion','importado') NOT NULL,
  `estado` ENUM('en_proceso','completado','fallido') NOT NULL DEFAULT 'en_proceso',
  `tamano_bytes` BIGINT UNSIGNED DEFAULT NULL,
  `hash_sha256` CHAR(64) DEFAULT NULL,
  `protegido` TINYINT(1) NOT NULL DEFAULT 0,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `error` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `backups_estado_created_at_index` (`estado`,`created_at`),
  KEY `backups_tipo_index` (`tipo`),
  KEY `backups_protegido_index` (`protegido`),
  KEY `backups_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bitácora de eventos
CREATE TABLE `backup_eventos` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `backup_id` BIGINT UNSIGNED DEFAULT NULL,
  `backup_nombre` VARCHAR(180) NOT NULL,
  `accion` ENUM('creacion','carga_externa','descarga','restauracion','eliminacion','fallo') NOT NULL,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `detalle` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `backup_eventos_backup_id_foreign` (`backup_id`),
  KEY `backup_eventos_accion_created_at_index` (`accion`,`created_at`),
  CONSTRAINT `backup_eventos_backup_id_foreign`
    FOREIGN KEY (`backup_id`) REFERENCES `backups` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.5 Módulos y acciones de permisos (RBAC)

Se insertan con un **seeder idempotente** (`PermisosBackupsSeeder`), seguro de ejecutar en producción sin `migrate:fresh`.

```text
Módulo nuevo:
  nombre = "Backups", slug = "backups", orden = 9

Acciones nuevas (globales, si no existen):
  nombre = "Descarga",     slug = "descarga"
  nombre = "Restauración", slug = "restauracion"

Permisos del módulo (modulo_id = backups):
  backups.consulta      → ver la pantalla, la lista, el panel de espacio y el historial
  backups.creacion      → generar backup manual
  backups.edicion       → configurar la automatización y proteger/desproteger backups
  backups.baja          → eliminar un backup (reutiliza la acción global existente "Baja")
  backups.descarga      → descargar un archivo de backup
  backups.restauracion  → restaurar desde un backup o desde un archivo externo

Asignación por defecto:
  rol admin → los 6 permisos
  otros roles → ninguno (el administrador los asigna desde la UI de Roles)
```

> Por qué `baja` y no `consulta` para eliminar: borrar un backup **reduce la capacidad de recuperación** del sistema. Con un tope de 10 archivos, es una acción destructiva y debe estar separada de la simple consulta. Además se reutiliza el vocabulario RBAC ya existente (`consulta`, `creacion`, `edicion`, `baja`).

---

## 4. Estructura en disco y nombres de archivo

### 4.1 Disco

```php
// config/filesystems.php
'backups' => [
    'driver' => 'local',
    'root'   => env(
        'BACKUP_PATH',
        storage_path('app/private/backups-'.config('backups.app_slug'))
    ),
    'throw'  => true,      // falla ruidosamente si no puede escribir
    'report' => false,
    'serve'  => false,     // nunca se sirve como estático
],
```

Ruta por defecto en esta instalación:

```text
storage/app/private/backups-seguimiento-adm/     (BACKUP_APP_SLUG=seguimiento-adm)
```

> **El slug es independiente de `APP_NAME`.** `APP_NAME` es un texto cosmético («Segimiento ADM» hoy, con typo). Si se derivara la carpeta de él, corregir o traducir el nombre de la aplicación dejaría huérfanos todos los backups existentes. Por eso se usa la variable estable `BACKUP_APP_SLUG`. Corregir `APP_NAME` sigue siendo recomendable, pero ya no afecta al almacenamiento.

> La carpeta **nunca** debe estar en `public/`. La descarga solo se sirve por ruta autenticada con permiso `backups.descarga`.

### 4.2 Nombres

| Tipo | Patrón | Ejemplo |
|---|---|---|
| Manual | `backup-{slug}-{Ymd-His}-manual.sql.gz` | `backup-seguimiento-adm-20261026-153000-manual.sql.gz` |
| Automático | `backup-{slug}-{Ymd-His}-automatico.sql.gz` | `backup-seguimiento-adm-20261026-020000-automatico.sql.gz` |
| Pre-restauración | `backup-{slug}-{Ymd-His}-pre-restauracion.sql.gz` | `backup-seguimiento-adm-20261026-160102-pre-restauracion.sql.gz` |
| Importado | `importado-{Ymd-His}-{uuid8}.sql.gz` | `importado-20261026-161500-3f9a1c2b.sql.gz` |

Reglas de seguridad en nombres:
- El nombre del archivo subido por el usuario **jamás** se usa como ruta destino; solo se guarda como metadato (`nombre_original`).
- Se rechazan rutas con `..`, `/`, `\` o caracteres de control.

### 4.3 Archivos temporales

```text
storage/app/private/backups-<slug>/.tmp/     → dumps .sql antes de comprimir
storage/framework/tmp/                       → archivos my.cnf temporales (permisos 0600)
```

Limpieza: `finally` en todos los flujos; además `backups:diagnostico --limpiar-temporales` elimina residuos de más de 24 h.

---

## 5. Configuración

### 5.1 `config/backups.php`

```php
<?php

return [
    // Identidad estable del almacenamiento (no depende de APP_NAME)
    'app_slug' => env('BACKUP_APP_SLUG', 'seguimiento-adm'),

    // Disco donde se almacenan los archivos
    'disk' => env('BACKUP_DISK', 'backups'),

    // Binarios de MySQL (vacío = autodetección)
    'mysqldump' => env('BACKUP_MYSQLDUMP_PATH'),
    'mysql' => env('BACKUP_MYSQL_PATH'),

    // Tiempo máximo en segundos para cada operación externa
    'timeout' => (int) env('BACKUP_TIMEOUT', 3600),

    // Prefijo de los archivos
    'prefijo' => env('BACKUP_PREFIJO', 'backup'),

    // Límites y defaults
    'maximo_default' => 10,
    'cuota_mb_default' => 0,
    'alerta_porcentaje_default' => 85,
    'max_import_mb' => (int) env('BACKUP_MAX_IMPORT_MB', 100),

    // Reemplazo total: antes del import se eliminan todas las tablas existentes
    'reemplazo_total' => true,

    // Rollback automático reimportando el backup pre_restauracion si el import falla
    'rollback_automatico' => true,

    // Cuántos backups pre_restauracion se mantienen protegidos automáticamente
    'pre_restauracion_protegidos' => 1,

    // Tablas de las que NO se respaldan datos (solo estructura)
    'tablas_sin_datos' => [
        'cache',
        'cache_locks',
        'sessions',
        'jobs',
        'job_batches',
        'failed_jobs',
        'personal_access_tokens',
        'password_reset_tokens',
        'backups',          // auditoría local, ver §15
        'backup_eventos',   // auditoría local, ver §15
    ],

    // Tablas que deben existir en un archivo importado para aceptarlo como compatible
    'tablas_esperadas' => [
        'users', 'tramites', 'personas', 'derivaciones', 'areas',
    ],

    // Rutas candidatas para autodetección de binarios (Windows y Linux)
    'rutas_binarios' => [
        'C:\\wamp64\\bin\\mysql\\mysql8.4.7\\bin',
        'C:\\xampp\\mysql\\bin',
        'C:\\laragon\\bin\\mysql\\mysql-8.4.7-winx64\\bin',
        '/usr/bin',
        '/usr/local/bin',
        '/usr/local/mysql/bin',
        '/opt/homebrew/bin',
    ],
];
```

### 5.2 Variables de entorno

```dotenv
BACKUP_APP_SLUG=seguimiento-adm    # identidad estable de la carpeta y los nombres
BACKUP_DISK=backups
BACKUP_PATH=                       # vacío = storage/app/private/backups-{BACKUP_APP_SLUG}
BACKUP_MYSQLDUMP_PATH=             # vacío = autodetección
BACKUP_MYSQL_PATH=                 # vacío = autodetección
BACKUP_TIMEOUT=3600
BACKUP_PREFIJO=backup
BACKUP_MAX_IMPORT_MB=100
```

### 5.3 Autodetección de binarios

`App\Support\BinarioMysql` resuelve en este orden:

1. Valor explícito de `config('backups.mysqldump')` / `config('backups.mysql')`.
2. Búsqueda en `PATH` (`where mysqldump` en Windows, `command -v` en Linux).
3. Rutas candidatas de `config('backups.rutas_binarios')`.
4. Si no encuentra, devuelve `null` y el módulo muestra error accionable: «No se encontró `mysqldump`. Configure `BACKUP_MYSQLDUMP_PATH`».

El resultado se cachea por request. `php artisan backups:diagnostico` imprime qué binario se resolvió y su versión.

### 5.4 Credenciales

**Nunca** se pasan por línea de comandos (`-p***` es visible en `ps`/Task Manager). Se genera un archivo temporal:

```ini
# storage/framework/tmp/my-<random>.cnf   (permisos 0600 / sólo el usuario del proceso)
[client]
host=127.0.0.1
port=3306
user=root
password=********
default-character-set=utf8mb4
```

Se usa con `--defaults-extra-file=<ruta>` y se elimina en `finally`. Las credenciales se leen de `config('database.connections.mysql')`, nunca de texto escrito a mano.

> **Recomendación pendiente de aprobación del proyecto:** hoy la conexión usa `root`. Para producción conviene un usuario dedicado con permisos mínimos (el dump necesita `SELECT, LOCK TABLES, SHOW VIEW, TRIGGER, EVENT`; la restauración necesita además `INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES`). Mientras no se apruebe, este documento describe el comportamiento con el usuario actual de la conexión.

---

## 6. Permisos y roles

### 6.1 Middleware

Rutas protegidas con el middleware existente `permission:{modulo},{accion}`:

```php
Route::middleware('permission:backups,consulta')->group(function () {
    Route::get('backups', [BackupController::class, 'index'])->name('backups.index');
    Route::get('backups/espacio', [BackupController::class, 'espacio'])->name('backups.espacio');
    Route::get('backups/{backup}/descargar', [BackupController::class, 'descargar'])
        ->middleware('permission:backups,descarga')->name('backups.descargar');
    Route::get('backups/{backup}/eventos', [BackupController::class, 'eventos'])->name('backups.eventos');
});

Route::middleware('permission:backups,creacion')->group(function () {
    Route::post('backups', [BackupController::class, 'store'])->name('backups.store');
});

Route::middleware('permission:backups,edicion')->group(function () {
    Route::put('backups/automatizacion', [BackupController::class, 'updateAutomatizacion'])
        ->name('backups.automatizacion');
    Route::put('backups/{backup}/proteger', [BackupController::class, 'proteger'])->name('backups.proteger');
});

Route::middleware('permission:backups,restauracion')->group(function () {
    Route::post('backups/{backup}/restaurar', [BackupRestauracionController::class, 'restaurar'])
        ->name('backups.restaurar');
    Route::post('backups/restaurar-archivo', [BackupRestauracionController::class, 'restaurarDesdeArchivo'])
        ->name('backups.restaurar-archivo');
});

Route::middleware('permission:backups,baja')->group(function () {
    Route::delete('backups/{backup}', [BackupController::class, 'destroy'])->name('backups.destroy');
});
```

### 6.2 Matriz de capacidades

| Acción | Permiso | Además exige |
|---|---|---|
| Ver pantalla, lista, gráficos, historial | `backups.consulta` | — |
| Generar backup manual | `backups.creacion` | — |
| Configurar automatización | `backups.edicion` | — |
| Proteger / desproteger | `backups.edicion` | el archivo debe existir |
| Descargar backup | `backups.descarga` | archivo existente en disco |
| Restaurar (interno o externo) | `backups.restauracion` | `RESTAURAR` + contraseña válida + backup previo |
| Eliminar | `backups.baja` | confirmación; los `protegido` requieren desproteger primero |

> **Nota de diseño:** eliminar y proteger ya no están bajo `consulta`. Borrar un backup reduce la capacidad de recuperación del sistema, por lo que exige `baja`; proteger altera la política de retención, por lo que exige `edicion`. Así, un usuario de solo lectura no puede destruir la única copia disponible.

### 6.3 Visibilidad en el sidebar

`resources/js/components/layout/Sidebar.tsx`: nuevo ítem

```ts
{ label: 'Backups', href: '/backups', icon: 'database', permission: 'backups' }
```

El filtro existente exige `backups.consulta`, por lo que el ítem desaparece para quien no tiene permiso.

---

## 7. Flujo: backup manual

```text
POST /backups   (permiso backups.creacion)
        │
        ▼
[1] set_time_limit(0)
[2] Cache::lock('backups:ejecutando', timeout=3600)   ← evita dos dumps simultáneos
        │  si no se obtiene → 409 "Ya hay un backup en proceso"
        ▼
[3] Resolver binario mysqldump  (si falla → registro fallido + error accionable)
[4] Verificar disco: existe root, es escribible, libre > 2 × tamaño BD
[5] Crear registro: estado=en_proceso, tipo=manual, user_id=auth()->id()
[6] Dump estructura  → <tmp>/estructura-<uuid>.sql
[7] Dump datos       → <tmp>/datos-<uuid>.sql
[8] Concatenar con cabecera/cierre de FOREIGN_KEY_CHECKS (§10)
[9] Comprimir con gzencode($sql, 6) → bytes
[10] hash_sha256 = hash('sha256', $bytesGzip)
[11] Escribir en disco: backups/<nombre>  (atómico: escribe .part y renombra)
[12] Actualizar registro: estado=completado, tamano_bytes, hash_sha256
[13] Evento: accion=creacion, user_id, ip, detalle="origen=manual"
[14] Aplicar retención (§11)
[15] Invalidar cache de espacio (§16)
[16] Liberar lock
[17] Redirect + flash: "Backup generado: <nombre> (1.2 MB)"
        │
        └── en cualquier fallo:
            [F1] Borrar temporales y archivo parcial
            [F2] registro: estado=fallido, error=<mensaje>
            [F3] evento: accion=fallo, detalle=<mensaje>
            [F4] Log::error('backup.fallido', [...])
            [F5] flash error visible
```

---

## 8. Flujo: backup automático

### 8.1 Vía scheduler (principal)

```php
// routes/console.php
Schedule::command('backups:auto')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();
```

`backups:auto` en cada ejecución:

```text
[1] Leer configuración (configuraciones)
[2] Si backup_auto_habilitado = 0 → salir silenciosamente
[3] Si no hay backup_ultima_ejecucion → fijarla a now() y salir (línea base)
[4] Calcular proxima = proximaEjecucion(ultima_ejecucion, frecuencia, hora, dia_semana, dia_mes)
[5] Si now() < proxima → salir
[6] Cache::lock('backups:ejecutando') → si ocupado, salir (se reintenta al minuto)
[7] Ejecutar el flujo de §7 con tipo=automatico, user_id=null
[8] Al terminar (éxito o fallo): backup_ultima_ejecucion = now()
```

### 8.2 Vía disparo perezoso (respaldo)

Middleware `EjecutarBackupVencido` registrado en el grupo `web`:

```php
public function handle(Request $request, Closure $next): Response
{
    return $next($request);          // nunca retrasa la respuesta al usuario
}

public function terminate(Request $request, Response $response): void
{
    if (! $request->user() || app()->isDownForMaintenance() || app()->runningUnitTests()) {
        return;
    }

    if (! Cache::lock('backups:auto-perezoso', 900)->get()) {
        return;                       // ya se evaluó en los últimos 15 min
    }

    try {
        app(BackupService::class)->ejecutarSiVencido();
    } catch (Throwable $e) {
        Log::error('backup.perezoso.error', ['mensaje' => $e->getMessage()]);
    }
}
```

Justificación: cubre el caso «servidor sin cron configurado». Cuando el scheduler funciona, ambos caminos compiten por el mismo lock y la misma regla de vencimiento, por lo que no hay backups duplicados.

---

## 9. Cálculo de vencimiento

### 9.1 Regla general

```text
proximaEjecucion(ultima, frecuencia, hora, diaSemana, diaMes):

  si frecuencia = diaria:
      candidata = fecha(ultima) + hora
      si candidata <= ultima → candidata += 1 día

  si frecuencia = semanal:
      candidata = próximo día de la semana = diaSemana (ISO 1..7) a la hora,
                  contando desde ultima + 1 día
      si candidata <= ultima → candidata += 7 días

  si frecuencia = mensual:
      diaEfectivoMes(mes) = min(diaMes, ultimoDíaDelMes(mes))
      candidata = ese mes a la hora
      si candidata <= ultima → candidata = mes siguiente, mismo cálculo

  devolver candidata (en zona America/La_Paz)
```

### 9.2 Ejemplos verificables

| Configuración | `ultima_ejecucion` | `now` | Resultado |
|---|---|---|---|
| Diaria 02:00 | 2026-10-26 02:00 | 2026-10-26 02:30 | No vence (próxima 27/10 02:00) |
| Diaria 02:00 | 2026-10-25 02:00 | 2026-10-26 10:00 | **Vence** (una sola ejecución, no acumula) |
| Semanal lunes 03:00 | 2026-10-19 03:00 | 2026-10-26 03:01 | **Vence** |
| Semanal lunes 03:00 | 2026-10-26 03:00 | 2026-10-27 09:00 | No vence (próxima 02/11) |
| Mensual día 31 04:00 | 2026-09-30 04:00 | 2026-10-01 05:00 | No vence (próxima 31/10 04:00) |
| Mensual día 31 04:00 | 2026-09-30 04:00 | 2026-10-31 05:00 | **Vence** (octubre usa el día 31) |
| Mensual día 31 04:00 | 2026-10-31 04:00 | 2026-11-01 05:00 | No vence (noviembre usa el día 30) |
| Cualquiera, `ultima` null | null | cualquiera | No vence; se fija línea base |

Condición de disparo:

```text
auto_habilitado AND ultima_ejecucion IS NOT NULL AND now >= proximaEjecucion(...)
```

### 9.3 Al habilitar la automatización

Al guardar con `backup_auto_habilitado = 1`:

- Si `backup_ultima_ejecucion` es null → se fija a `now()`.
- Se registra `backup_auto_habilitado_en = now()`.
- Consecuencia: el primer backup automático ocurre en el **siguiente** horario programado, nunca de inmediato.

### 9.4 Atrasos

Si el servidor estuvo apagado en el horario programado, al volver se ejecuta **una sola** vez (no se generan los backups perdidos en lote) y `backup_ultima_ejecucion` pasa a `now()`. Esto se documenta para evitar expectativas erróneas.

---

## 10. Composición del archivo de backup

### 10.1 Dos dumps concatenados

Motivo: se quiere **estructura de todas las tablas** pero **datos solo de las tablas de negocio**. Un único `mysqldump` no permite «estructura de todas y datos de algunas» sin excluir también la estructura, así que se generan dos pasadas y se concatenan.

**Paso 1 — estructura de todo:**

```bash
mysqldump --defaults-extra-file=<cnf> \
  --no-data --routines --triggers --events \
  --lock-tables --no-tablespaces --skip-comments \
  --no-create-db --default-character-set=utf8mb4 --set-gtid-purged=OFF \
  <base_datos> > estructura.sql
```

**Paso 2 — datos de tablas de negocio:**

```bash
mysqldump --defaults-extra-file=<cnf> \
  --no-create-info --complete-insert --lock-tables \
  --no-tablespaces --skip-comments \
  --no-create-db --default-character-set=utf8mb4 --set-gtid-purged=OFF \
  <base_datos> tabla1 tabla2 tabla3 ... > datos.sql
```

La lista `tabla1..tablaN` se obtiene de `information_schema.tables` filtrando:

```text
tabla_schema = DATABASE()
  AND table_type = 'BASE TABLE'
  AND table_name NOT IN config('backups.tablas_sin_datos')
```

Se ordena alfabéticamente para que el archivo sea reproducible.

### 10.2 Cabecera y cierre

```sql
-- ============================================================
-- Backup: Seguimiento de Trámites
-- Base: seguimiento_adm
-- Generado: 2026-10-26 02:00:00 (America/La_Paz)
-- Tipo: automatico
-- Motor: MyISAM/InnoDB
-- ============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
SET UNIQUE_CHECKS=0;
SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

<estructura.sql>

<datos.sql>

SET UNIQUE_CHECKS=1;
SET FOREIGN_KEY_CHECKS=1;
-- ====================== FIN DEL BACKUP ======================
```

`--no-create-db` es deliberado: al restaurar en otra instalación no debe crearse ni cambiarse el nombre de la base; se restaura sobre la base configurada en `.env`.

### 10.3 Compresión y verificación

```text
contenido_gzip = gzencode($sql, 6)          // PHP nativo, sin binarios externos
hash_sha256    = hash('sha256', $contenido_gzip)
tamano_bytes   = strlen($contenido_gzip)
```

Antes de restaurar se recalcula `hash_sha256` sobre el archivo en disco y se compara con el guardado. Si no coincide → se rechaza (archivo alterado o corrupto).

### 10.4 Contenido resultante (referencia)

| Incluye | No incluye (solo estructura) |
|---|---|
| `areas`, `puestos`, `personas`, `persona_puesto` | `cache`, `cache_locks` |
| `users`, `roles`, `rol_permiso`, `role_user` | `sessions` |
| `modulos`, `acciones`, `permisos` | `jobs`, `job_batches`, `failed_jobs` |
| `tramites`, `derivaciones`, `actuaciones` | `personal_access_tokens` |
| `contador_tramites`, `reseteos`, `reportes` | `password_reset_tokens` |
| `configuraciones`, `area_user` | `backups`, `backup_eventos` (auditoría local) |
| Estructura de **todas** las tablas | Datos de las tablas de la columna izquierda |

---

## 11. Retención y protección

### 11.1 Regla

```text
maximo    = config backup_maximo (default 10)
completados = backups where estado = 'completado'
excedente = count(completados) - maximo

si excedente > 0:
    candidatos = completados where protegido = 0
                 order by created_at asc
    borrar los primeros min(excedente, count(candidatos)):
        - eliminar archivo del disco
        - eliminar registro
        - evento: accion=eliminacion, detalle="retención automática"
```

### 11.2 Protección

| Tipo | `protegido` por defecto | Motivo |
|---|---|---|
| `manual` | `false` | El usuario decide si conservarlo |
| `automatico` | `false` | Rotación normal |
| `pre_restauracion` | **`true` solo el más reciente** | Red de seguridad tras una restauración, sin acumulación infinita |
| `importado` | **`true`** | Evidencia del archivo usado (desprotegible a mano) |

Reglas adicionales:

- Un backup protegido **nunca** se elimina por retención; solo manualmente (desproteger → eliminar).
- **Protección acotada de `pre_restauracion`:** al crear un nuevo backup `pre_restauracion`, el anterior se **desprotege automáticamente**. Solo se mantienen protegidos los últimos `config('backups.pre_restauracion_protegidos')` (default `1`). Evita que cada restauración histórica deje un archivo inmortal que haga ficticio el tope de retención.
- **`importado`** nace protegido y permanece así hasta que el usuario lo desproteja explícitamente; la UI lo advierte con el texto «este archivo no se eliminará automáticamente».
- Si todos los excedentes están protegidos, **no se borra nada** y la UI muestra: «Límite de backups excedido (12/10) pero todos los sobrantes están protegidos».
- La retención se aplica **después** de crear un backup exitoso y **también** al cambiar el tope a un valor menor.
- `pre_restauracion` **puede** eliminarse manualmente si el usuario lo desprotege primero. No hay regla dura que lo impida: en su lugar, un modal advierte «es su única vía de retorno si la restauración actual falló». Las reglas rígidas terminan generando archivos imposibles de limpiar.

### 11.2.1 Configuración de retención recomendada

El tope por defecto es **10** (decisión del proyecto). Como referencia operativa: con ~1 MB por backup, **30 backups ≈ 30 MB**, por lo que se recomienda **subir el tope a 30 y la cuota a 1024 MB** en instalaciones con trámites sujetos a trazabilidad. Diez días de historia puede ser insuficiente para detectar un error a tiempo. El valor es configurable en la UI (`backup_maximo`) sin cambios de código.

### 11.3 Eliminación manual

```text
DELETE /backups/{id}      (permiso backups.baja)
  1. Si protegido = true → 422 "Desproteja el backup antes de eliminarlo"
  2. Modal de confirmación con nombre y tamaño
  3. Si es el último pre_restauracion → advertencia reforzada (no bloqueante)
  4. Borrar archivo (si no existe, continuar)
  5. Borrar registro
  6. Evento accion=eliminacion, detalle="manual"
```

---

## 12. Auditoría

### 12.1 Eventos registrados

| Acción del usuario | Evento | `user_id` | `detalle` |
|---|---|---|---|
| Genera backup manual | `creacion` | usuario | `origen=manual` |
| Genera backup automático | `creacion` | `null` | `origen=scheduler` o `origen=perezoso` |
| Sube archivo para restaurar | `carga_externa` | usuario | nombre original, tamaño, hash |
| Descarga backup | `descarga` | usuario | `ip` del cliente |
| Restaura (interna o externa) | `restauracion` | usuario | duración, origen, nombre usado |
| Elimina backup (manual o retención) | `eliminacion` | usuario / `null` | `manual` / `retención automática` |
| Falla un backup o una restauración | `fallo` | usuario / `null` | mensaje de error |
| Intento de restauración con contraseña inválida | `fallo` | usuario | `contraseña incorrecta` |

### 12.2 Qué se ve en la UI

- Columna **Autor** en la lista (`Sistema` si `user_id` es null).
- Acción **"Ver historial"** por backup → modal con sus eventos (fecha, acción, usuario, IP).
- El modal se alimenta de `GET /backups/{backup}/eventos` (§18), que devuelve los últimos 100 eventos del backup. La consulta filtra por `backup_id` y, además, por `backup_nombre`: si el registro se perdió en una restauración previa (la tabla `backups` se respalda solo como estructura), la bitácora sigue apareciendo.
- La bitácora **no** tiene opción de borrar ni editar desde la aplicación.
- Consulta directa para auditoría externa:

```sql
SELECT e.created_at, e.accion, e.backup_nombre, u.email, e.ip, e.detalle
FROM backup_eventos e
LEFT JOIN users u ON u.id = e.user_id
ORDER BY e.created_at DESC
LIMIT 100;
```

### 12.3 Retención de la bitácora

Nunca se purga automáticamente. Crecimiento estimado: 3–5 filas por backup + descargas; despreciable frente al tamaño de la base.

---

## 13. Flujo: restauración

### 13.1 Origen A — backup interno

```text
POST /backups/{backup}/restaurar
```

### 13.2 Origen B — archivo seleccionado del disco

```text
POST /backups/restaurar-archivo      (multipart/form-data, campo "archivo")
        │
        ▼
[1] Validar request
    - requerido, archivo
    - extensión: .sql | .sql.gz
    - tamaño ≤ min(upload_max_filesize, BACKUP_MAX_IMPORT_MB)
    - mime declarado coherente
[2] Validar contenido
    - si .gz: gzdecode debe funcionar y producir SQL
    - si .sql: debe contener al menos una sentencia CREATE TABLE o INSERT
    - tamaño descomprimido ≤ 10 × BACKUP_MAX_IMPORT_MB (anti zip-bomb)
[3] Validar compatibilidad
    - el SQL debe mencionar ≥ 5 de config('backups.tablas_esperadas')
    - si no → 422 "El archivo no parece ser un backup de esta aplicación"
[4] Archivar copia
    - si .sql plano → comprimir a .sql.gz
    - guardar como importado-<Ymd-His>-<uuid8>.sql.gz
    - registro: tipo=importado, protegido=true, nombre_original=<nombre subido>
    - hash_sha256 + tamano_bytes
[5] Evento: accion=carga_externa (user, ip, nombre_original, tamaño)
[6] Continuar en el flujo común (§13.3)
```

Caso especial — archivo demasiado grande para el límite de subida:
- La UI lo detecta antes de enviar y muestra: «El archivo supera el límite de 100 MB. Cópielo a la carpeta de backups del servidor y use `php artisan backups:diagnostico --importar=<ruta>`».
- El comando importa un archivo ya presente en el servidor aplicando las mismas validaciones y auditoría.

### 13.3 Flujo común de restauración

```text
[1] Middleware permission:backups,restauracion
[2] Validar: texto RESTAURAR exacto + contraseña con Hash::check(user->password)
        └─ fallo → 422, evento `fallo` ("contraseña incorrecta"), no se toca nada
[3] Localizar y verificar el archivo
    - existe en disco
    - si hash conocido → recalcular y comparar
    - descomprimir a temporal (streaming, sin cargar todo en memoria)
[4] Crear backup pre-restauracion (§7) con user_id=usuario
    - protegerlo y desproteger el pre_restauracion anterior (§11.2)
        └─ si falla → ABORTAR: no se puede restaurar sin red de seguridad
[5] Artisan::call('down')  → modo mantenimiento
    - registrar shutdown function que garantice `up` (ver §13.5)
[6] Reemplazo total del esquema:
    SET FOREIGN_KEY_CHECKS=0;
    DROP TABLE de TODAS las tablas existentes (excepto nada; se recrearán desde el archivo)
    SET FOREIGN_KEY_CHECKS=1;
[7] Ejecutar import:
    mysql --defaults-extra-file=<cnf> --local-infile=0 --default-character-set=utf8mb4 <base> < temporal.sql
[8] Verificar post-import: conexión OK y SELECT 1 sobre `users` y `migrations`
[9] Artisan::call('up')                      (SIEMPRE en finally)
[10] Artisan::call('migrate', ['--force'=>true])   → alinea esquema si el backup es antiguo
[11] Artisan::call('optimize:clear')         → limpia cache/sesión/config
[12] Preservar configuración de backups (§15)
[13] Reinsertar registros de auditoría que el import pudo borrar (§15)
[14] Evento: accion=restauracion, detalle="origen=<interno|externo>; archivo=<nombre>; duración=<n>s"
[15] Invalidar cache de espacio
[16] Redirect a /backups con flash: "Base de datos restaurada desde <nombre>"
        │  (decisión de implementación: no se fuerza logout; ver §13.6)
        │
        └── si falla [6], [7] u [8]:
            [F1] ROLLBACK AUTOMÁTICO (config('backups.rollback_automatico') = true):
                 - vaciar el esquema (DROP TABLE de todo lo que quedó a medias)
                 - reimportar el backup pre_restauracion recién creado
                 - verificar SELECT 1 sobre `users` y `migrations`
                 - si el rollback tiene éxito:
                     · evento `fallo` detalle="import falló; revertido automáticamente"
                     · flash error: "La restauración falló y el sistema se revirtió
                       al estado anterior (backup <nombre>)."
                     · la base queda consistente; NO se fuerza logout
                 - si el rollback también falla:
                     · evento `fallo` detalle="import falló; rollback falló"
                     · flash crítico: "La base quedó inconsistente. Ejecute
                       php artisan backups:recuperar y restaure manualmente
                       <ruta del pre_restauracion>."
                     · Log::critical con rutas y mensajes
            [F2] Artisan::call('up') garantizado por finally + shutdown function
            [F3] Log::error('backup.restauracion.fallida', [...])
```

**Por qué reemplazo total:** si el backup no contiene una tabla que hoy existe, esa tabla sobreviviría con datos viejos y la base quedaría en un estado híbrido que la aplicación no espera (registros hijos sin padre, contadores desfasados, tablas nuevas con datos de un esquema que ya no corresponde). El reemplazo total garantiza que el estado resultante es **exactamente** el del archivo restaurado.

**Por qué rollback automático:** el import no es atómico (MyISAM no tiene transacciones). Si falla a mitad, la base queda inconsistente; con ~1 MB el rollback tarda segundos y convierte una posible catástrofe en un incidente controlado.

### 13.4 Reglas de seguridad del import

- El archivo **nunca** se ejecuta con el nombre ni la ruta que provee el cliente.
- El comando `mysql` nunca recibe credenciales en la línea de comandos.
- Prohibido `LOAD DATA LOCAL INFILE` en el cliente (`--local-infile=0`) para evitar lecturas arbitrarias del servidor al importar un archivo no confiable.
- El import corre con el usuario de base de datos de la aplicación: **no** requiere privilegios de `SUPER` ni de creación de usuarios.
- Si el SQL contiene `DROP DATABASE` o `CREATE USER`, se rechaza en la validación previa (lista negra de sentencias peligrosas).
- El `DROP TABLE` de todas las tablas se ejecuta **solo después** de que el backup `pre_restauracion` se completó correctamente.
- El rollback automático reimporta **exclusivamente** el `pre_restauracion` recién creado en el paso [4]; nunca un archivo anterior, para que el estado de retorno sea exactamente el inmediatamente previo.
- Las sentencias de mantenimiento (drop, import, rollback) se ejecutan en transacciones separadas por proceso; el orden se registra en `backup_eventos` para reconstruir qué pasó.

### 13.5 Modo mantenimiento a prueba de fallos

`Artisan::call('up')` en un bloque `finally` **no alcanza**: si PHP sufre un fatal error, un timeout del servidor o un corte del proceso (reinicio del servicio web), el `finally` no se ejecuta y la aplicación queda en 503 para todos los usuarios.

Mecanismos obligatorios:

```php
// Al entrar en mantenimiento
Artisan::call('down');

// Red de seguridad a nivel de proceso
register_shutdown_function(function (): void {
    try {
        Artisan::call('up');
    } catch (Throwable) {
        // último recurso: borrar la marca de mantenimiento
        @unlink(storage_path('framework/down'));
    }
});

try {
    // drop + import + verificación
} finally {
    Artisan::call('up');
}
```

Además, comando de recuperación manual e idempotente:

```bash
php artisan backups:recuperar
# 1. Ejecuta `up` (si la app está caída)
# 2. Muestra el último backup pre_restauracion y su ruta
# 3. Verifica que la base responda (SELECT 1)
# 4. Informa el último evento de auditoría y si quedaron temporales
```

Se documenta en §23 y en el procedimiento de emergencia (§21).

### 13.6 Sesión y mensaje posterior a la restauración

Decisión de implementación: al terminar con éxito, el controlador redirige a `backups.index` con el flash de confirmación y **no** fuerza el logout del usuario que ejecutó la restauración.

Motivos:

- La tabla `sessions` está en `tablas_sin_datos` (§10): el dump solo lleva su estructura, así que la sesión en curso desaparece con el reemplazo total. Cerrar sesión de forma explícita no aporta nada que el propio reemplazo no haga ya.
- El flash se escribe al final de la misma petición, cuando Laravel persiste la sesión. Redirigir a `/login` en ese momento dejaría el mensaje sin destinatario visible y el operador perdería la confirmación (nombre del backup restaurado y copia previa).
- Dejar la pantalla de backups a la vista permite verificar de inmediato el estado del disco, el `pre_restauracion` creado y el evento de auditoría de la restauración.

Si se prefiere el comportamiento contrario, basta con cerrar la sesión en el controlador antes del redirect; los eventos de auditoría se reinsertan después del import (§15), por lo que la bitácora no se pierde en ninguno de los dos casos.


---

## 14. Advertencia de pérdida de datos

### 14.1 Momento

Antes de **cualquier** restauración (interna o externa), en un modal bloqueante que no puede cerrarse con `Esc` ni clic fuera hasta cancelar explícitamente.

### 14.2 Texto exacto

```text
⚠️  ADVERTENCIA: SE PERDERÁN LOS DATOS ACTUALES

Vas a reemplazar TODA la base de datos "seguimiento_adm" con el contenido de:

  Nombre:   backup-seguimiento-adm-20261023-020000-automatico.sql.gz
  Tipo:     Automático
  Tamaño:   1.2 MB
  Fecha:    23/10/2026 02:00
  Autor:    Sistema
  --- o, para archivo externo ---
  Archivo:  mi_respaldo.sql.gz  (1.2 MB)  [subido ahora]

Se reemplazarán TODOS los registros actuales:
  trámites, derivaciones, actuaciones, personas, áreas, puestos,
  usuarios, roles, permisos, configuración y reportes.

Los registros creados después de la fecha del backup SE PERDERÁN
y no se pueden recuperar desde esta pantalla.

✔ Se creará automáticamente un backup de seguridad ("pre-restauración").
✔ La aplicación entrará en modo mantenimiento durante el proceso.
✔ Todos los usuarios serán desconectados, incluido usted.

┌─────────────────────────────────────────────────────────────┐
│ Escriba RESTAURAR para confirmar:  [____________________]   │
│ Contraseña de su usuario:          [____________________]   │
│                                                             │
│              [Cancelar]   [Restaurar base de datos]         │
└─────────────────────────────────────────────────────────────┘
```

### 14.3 Comportamiento del modal

| Elemento | Regla |
|---|---|
| Botón confirmar | Deshabilitado hasta que el texto sea exactamente `RESTAURAR` (sensible a mayúsculas) **y** la contraseña tenga ≥ 1 carácter |
| Contraseña | Validada en servidor con `Hash::check()`; el error mantiene el modal abierto y no ejecuta nada |
| Doble envío | Bloqueado en cliente (`processing`) y en servidor (lock) |
| Cierre | Solo con «Cancelar»; se pide confirmación si ya escribió texto |
| Registro de cancelación | No se registra (no es una acción del sistema) |

---

## 15. Detalles posteriores a la restauración

Estos puntos evitan efectos colaterales silenciosos.

### 15.1 Auditoría local sobrevive

`backups` y `backup_eventos` están en `tablas_sin_datos`: el dump contiene su **estructura** pero no sus filas. Consecuencia: al restaurar un backup propio, el historial local **no se pierde**. Es una decisión deliberada (la auditoría pertenece a la instalación, no al backup).

Si el archivo restaurado es **externo** y trae datos de auditoría de otro sistema, esos datos sí reemplazan los locales. Para no perder trazabilidad, tras el import se ejecuta un upsert idempotente que garantiza:

1. El registro del backup `pre_restauracion` recién creado (por si el import lo borró).
2. El evento `restauracion` en curso, con su `backup_nombre`, usuario, IP y duración.

### 15.2 Configuración de backups se preserva

`configuraciones` es tabla de negocio y se restaura a la fecha del backup. Para no desactivar la automatización sin querer, después del import se reescriben las claves `backup_*` con los valores que estaban vigentes **antes** de restaurar. Queda registrado en el `detalle` del evento.

Excepción documentada: si el administrador **quiere** restaurar también la configuración histórica, puede volver a guardarla manualmente desde el panel; no hay opción automática para eso.

### 15.3 Sesiones y usuarios

- `sessions` se restaura vacía (estructura sin datos) → todos vuelven al login.
- Si el usuario que restauró no existe en el backup, su sesión queda inválida: correcto y esperado.
- El backup `pre_restauracion` permite volver al estado anterior en un solo paso.

### 15.4 Esquema más nuevo que el backup

Si el backup es anterior a las últimas migraciones, el import deja el esquema viejo. Tras restaurar se ejecuta `php artisan migrate --force`, que aplica solo las migraciones faltantes y es idempotente.

### 15.5 Reemplazo total del esquema

La restauración **no** es una fusión ni un `INSERT` sobre los datos actuales: antes del import se eliminan todas las tablas. Esto garantiza que el estado resultante sea exactamente el del archivo y evita el escenario híbrido (tablas nuevas con datos viejos, registros hijos huérfanos, contadores desfasados).

Consecuencias esperadas y documentadas:

- Tablas creadas después de la fecha del backup desaparecen y son recreadas por `php artisan migrate --force` (vacías).
- Cualquier dato creado entre el backup y la restauración se pierde: es el propósito del backup `pre_restauracion`.
- Si el import falla, el rollback automático reimporta el `pre_restauracion` (§13.3).

---

## 16. Panel de estado del almacenamiento

### 16.1 Datos expuestos

`GET /backups/espacio` (permiso `backups.consulta`, cache 60 s):

```json
{
  "disco": {
    "disponible": true,
    "ruta": "D:\\progra\\seguimiento\\storage\\app\\private\\backups-seguimiento-adm",
    "total_bytes": 512110190592,
    "usado_bytes": 342110190592,
    "libre_bytes": 170000000000,
    "porcentaje_usado": 66.8
  },
  "backups": {
    "cantidad": 7,
    "total_bytes": 7471104,
    "cuota_bytes": 2147483648,
    "porcentaje_cuota": 0.35,
    "huerfanos": 0
  },
  "archivos": [
    { "nombre": "backup-...-20261020-020000-automatico.sql.gz", "fecha": "2026-10-20", "tamano_mb": 1.1, "tipo": "automatico" },
    { "nombre": "backup-...-20261021-020000-automatico.sql.gz", "fecha": "2026-10-21", "tamano_mb": 1.1, "tipo": "automatico" }
  ],
  "proyeccion": { "backups_hasta_cuota": null, "tendencia_mb_por_backup": 0.02 },
  "alertas": [
    { "nivel": "warning", "mensaje": "El disco está al 66.8% de uso." }
  ]
}
```

### 16.2 Fórmulas

```text
disco.total  = disk_total_space(root)        // false → disponible = false
disco.libre  = disk_free_space(root)
disco.usado  = total - libre
disco.porcentaje_usado = usado / total × 100

cuota_bytes  = backup_cuota_mb × 1024 × 1024      (0 = ilimitada)
ocupado      = SUM(backups.tamano_bytes) WHERE estado = 'completado'
porcentaje_cuota = ocupado / cuota_bytes × 100    (null si cuota = 0)

huerfanos    = archivos en el disco sin registro en `backups`
               (se informan y se listan; no se borran automáticamente)

archivos     = un punto por backup completado: { nombre, fecha, tamano_mb, tipo }
               (últimos 90 días) — NO se usa una serie acumulada, porque la
               retención borra archivos y reescribiría el pasado

tendencia    = media móvil del tamaño de los últimos 10 backups (MB por archivo)
proyeccion   = (cuota_bytes - ocupado) / tamano_medio   → cuántos backups caben aún
```

> **Por qué no se usa una serie acumulada:** al purgarse los backups antiguos, un acumulado reconstruido desde los registros existentes hace que la curva del pasado cambie en cada limpieza («siempre parece que hubo 10 archivos»). Un gráfico que reescribe el pasado no es confiable. Graficar el tamaño de cada archivo es preciso, estable y responde la pregunta real: cuánto ocupa cada backup y cuántos más caben en la cuota.

### 16.3 Semáforo y umbrales

| Estado | Condición | Color |
|---|---|---|
| Normal | `% < 70` y `% cuota < 70` y sin fallos recientes | verde |
| Atención | `70 ≤ % < alerta_porcentaje` (o cuota equivalente) | ámbar |
| Crítico | `% ≥ alerta_porcentaje` o cuota superada o último backup fallido | rojo |

Reglas de alerta:

- `disco.disponible = false` (hosting con `open_basedir`/`disable_functions`) → se informa «No disponible en este servidor» y **no** es un error; la cuota y el tamaño por archivo siguen funcionando.
- Si `% cuota ≥ alerta_porcentaje` → banner con acción sugerida «Eliminar backups antiguos».
- Si el último backup automático está `fallido` o tiene más de 2× el intervalo programado → banner rojo.
- Los banners no se pueden descartar permanentemente; desaparecen al resolverse la causa.

### 16.4 Presentación

| Gráfico | Librería | Contenido |
|---|---|---|
| Dona del disco | `recharts` `PieChart` (`innerRadius`) | Usado vs libre, % al centro, GB en leyenda |
| Cuota de backups | Barra de progreso (tokens de color del proyecto) | MB ocupados / cuota; «Ilimitado» si cuota = 0 |
| Tamaño de cada backup | `recharts` `BarChart` o `AreaChart` | Un punto por archivo + **línea horizontal de cuota**; sin serie acumulada |

Refresco: al cargar la pantalla, después de cada acción (crear/eliminar/restaurar) y con el botón «Actualizar» (`router.reload({ only: ['espacio'] })`). Sin `setInterval` para no golpear el disco innecesariamente.

---

## 17. Mapa de la pantalla

Ruta `/backups`, permiso `backups.consulta`.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Backups                                                                      │
│ Carpeta: storage/app/private/backups-seguimiento-adm   [Actualizar]          │
│                                    [Generar backup]  [Restaurar desde archivo]│
├──────────────────────────────────────────────────────────────────────────────┤
│ ⚠ Alertas (solo si hay): último backup falló / disco al 87% / 12 de 10       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Estado del almacenamiento                                                    │
│ ┌────────────┐ ┌──────────────────────┐ ┌──────────────────────────────────┐ │
│ │  dona      │ │  cuota de backups    │ │  tamaño de cada backup           │ │
│ │  66.8%     │ │  7.1 MB / 2048 MB    │ │  barras + línea de cuota         │ │
│ └────────────┘ └──────────────────────┘ └──────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Backups]  [Automatización]                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Nombre                    │ Tipo   │ Fecha        │ Autor  │ Tamaño │ ⛨ │ ⚙ │
│ backup-...-automatico...  │ Auto   │ 26/10 02:00  │ Sistema│ 1.1 MB │ 🔒 │…  │
│ backup-...-manual...      │ Manual │ 25/10 17:32  │ A. M.  │ 1.1 MB │    │…  │
│ importado-...             │ Import.│ 25/10 15:00  │ A. M.  │ 1.0 MB │ 🔒 │…  │
│                           │        │              │        │        │    │   │
│ Acciones por fila: [Descargar] [Restaurar] [Proteger] [Historial] [Eliminar]│
├──────────────────────────────────────────────────────────────────────────────┤
│ Automatización (pestaña: permiso backups.edicion)                            │
│  ( ) Desactivada                                                             │
│  (•) Diaria      hora [02:00]                                                │
│  ( ) Semanal     día [Lunes ▾] hora [03:00]                                  │
│  ( ) Mensual     día del mes [1] hora [04:00]                                │
│  Máximo de backups [10]      Cuota (MB, 0=ilimitado) [0]                      │
│  Alerta de espacio (%) [85]                                                  │
│  Próximo backup: 27/10/2026 02:00        Última ejecución: 26/10/2026 02:00   │
│                                                          [Guardar cambios]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

Componentes: `pages/Backups/Index.tsx` (orquesta) + `components/features/backups/*` (presentacionales) + `hooks/useBackups.ts` + `services/backupService.ts`.

Dos elementos adicionales de la versión implementada:

- **Actividad reciente**: tarjeta bajo la tabla con los últimos 8 eventos globales (acción, nombre del backup, usuario y fecha). Se alimenta de la prop `historial` que envía el controlador con la carga inicial, sin petición extra, y evita abrir el modal de cada fila para saber qué pasó.
- **Contadores en las pestañas**: la pestaña *Backups* muestra el número de registros y *Automatización* la frecuencia activa; a la derecha se indica `N backup(s) · M archivo(s) sin registrar` (huérfanos).

Permisos por acción visible (el botón sin permiso se muestra deshabilitado con tooltip, no se oculta):

| Acción | Permiso |
|---|---|
| [Generar backup] | `backups.creacion` |
| [Restaurar desde archivo] / [Restaurar] | `backups.restauracion` |
| [Descargar] | `backups.descarga` |
| [Proteger] | `backups.edicion` |
| [Eliminar] | `backups.baja` |
| Pestaña [Automatización] | `backups.edicion` |

---

## 18. Rutas y API

| Método | Ruta | Nombre | Permiso | Respuesta |
|---|---|---|---|---|
| GET | `/backups` | `backups.index` | `backups.consulta` | Página Inertia |
| GET | `/backups/espacio` | `backups.espacio` | `backups.consulta` | JSON |
| GET | `/backups/{backup}/descargar` | `backups.descargar` | `backups.descarga` | Descarga binaria |
| GET | `/backups/{backup}/eventos` | `backups.eventos` | `backups.consulta` | JSON |
| POST | `/backups` | `backups.store` | `backups.creacion` | Redirect + flash |
| PUT | `/backups/{backup}/proteger` | `backups.proteger` | `backups.edicion` | Redirect + flash |
| DELETE | `/backups/{backup}` | `backups.destroy` | `backups.baja` | Redirect + flash |
| PUT | `/backups/automatizacion` | `backups.automatizacion` | `backups.edicion` | Redirect + flash |
| POST | `/backups/{backup}/restaurar` | `backups.restaurar` | `backups.restauracion` | Redirect a `backups.index` + flash (§13.6) |
| POST | `/backups/restaurar-archivo` | `backups.restaurar-archivo` | `backups.restauracion` | Redirect a `backups.index` + flash (§13.6) |

Errores esperados:

| Código | Cuándo |
|---|---|
| 403 | Sin permiso |
| 404 | Backup inexistente o archivo borrado del disco |
| 409 | Ya hay un backup/restauración en curso |
| 422 | Validación (texto `RESTAURAR`, contraseña, archivo inválido/incompatible) |
| 500 | Fallo de binario o de escritura (queda registrado y visible) |

---

## 19. Comandos artisan

| Comando | Propósito |
|---|---|
| `php artisan backups:auto` | Ejecuta el backup automático si corresponde (usado por el scheduler) |
| `php artisan backups:diagnostico` | Verifica binarios, ruta, permisos, espacio, configuración y último backup |
| `php artisan backups:diagnostico --importar=<ruta>` | Importa y restaura un archivo local del servidor (para archivos > límite de subida) |
| `php artisan backups:diagnostico --limpiar-temporales` | Elimina temporales de más de 24 h |
| `php artisan backups:recuperar` | Levanta la app si quedó en mantenimiento, verifica la conexión, muestra el último `pre_restauracion` y el último evento, y marca `fallido` todo backup `en_proceso` con más de 1 h (proceso interrumpido) |
| `php artisan backups:recuperar --limpiar` | Hace lo anterior y además elimina los archivos del disco que no tienen registro en `backups` (huérfanos) |

Salida de referencia de `backups:diagnostico`:

```text
Binario mysqldump : C:\wamp64\bin\mysql\mysql8.4.7\bin\mysqldump.exe (Ver 8.4.7)   OK
Binario mysql     : C:\wamp64\bin\mysql\mysql8.4.7\bin\mysql.exe (Ver 8.4.7)       OK
Base de datos     : seguimiento_adm (MySQL 8.4.7)                                  OK
Disco configurado : backups → storage/app/private/backups-seguimiento-adm          OK
Escritura         : OK (libre 158.4 GB)
Backups           : 7 registros / 7 archivos / 7.1 MB / 0 huérfanos                OK
Automatización    : activa (diaria 02:00) — última 26/10/2026 02:00                 OK
Último backup     : completado, 1.1 MB, hace 12 h                                   OK
```

Código de salida `1` si alguna verificación falla (útil para monitoreo). Aplica a binarios, base de datos y escritura en `backups:diagnostico`, y a la conexión en `backups:recuperar`; así ambos comandos sirven igual en un cron de vigilancia que en una revisión manual.

---

## 20. Despliegue y programación del sistema operativo

### 20.1 Linux (producción típica)

```cron
# /etc/cron.d/seguimiento-backups
* * * * * www-data cd /var/www/seguimiento && php artisan schedule:run >> /dev/null 2>&1
```

Alternativa con `supervisor` o `systemd timer`. Verificación: `php artisan schedule:list` debe mostrar `backups:auto` con `everyMinute`.

### 20.2 Windows (entorno actual)

Crear una tarea en el Programador de Tareas de Windows:

```powershell
schtasks /Create /TN "Seguimiento - Scheduler" `
  /TR "C:\wamp64\bin\php\php8.3.28\php.exe C:\ruta\al\proyecto\artisan schedule:run" `
  /SC MINUTE /MO 1 /RU SYSTEM /RL HIGHEST /F
```

Verificar:

```powershell
schtasks /Query /TN "Seguimiento - Scheduler" /V /FO LIST
```

### 20.3 Sin cron

Si no se puede crear la tarea, el **disparo perezoso** (§8.2) ejecuta el backup cuando alguien usa la aplicación tras el vencimiento. Limitaciones a comunicar al usuario:

- El horario exacto no se respeta.
- Si nadie entra en la aplicación durante semanas, no hay backups automáticos.
- No reemplaza al scheduler: es una red de seguridad.

### 20.4 Checklist de despliegue

```text
[ ] Variables BACKUP_* definidas en .env (incluida BACKUP_APP_SLUG)
[ ] php artisan config:clear
[ ] php artisan migrate --force
[ ] php artisan db:seed --class=PermisosBackupsSeeder
[ ] php artisan backups:diagnostico  → todas las líneas "OK"
[ ] Permisos asignados a los roles desde la UI de Roles
[ ] Tarea programada (cron/schtasks) activa y verificada
[ ] Primer backup manual generado y descargado como prueba
[ ] Prueba de restauración en base de prueba (§22) aprobada
```

---

## 21. Procedimiento manual de emergencia

Cuando la aplicación no está disponible pero se necesita respaldar o restaurar.

### 21.1 Crear un backup por consola

Windows (PowerShell):

```powershell
$mysqldump = "C:\wamp64\bin\mysql\mysql8.4.7\bin\mysqldump.exe"
$fecha = Get-Date -Format "yyyyMMdd-HHmmss"
& $mysqldump --user=root --password --single-transaction=OFF `
  --routines --triggers --events --lock-tables `
  --no-tablespaces --skip-comments --default-character-set=utf8mb4 `
  seguimiento_adm > "backup-manual-$fecha.sql"
```

Linux:

```bash
mysqldump --user=root -p --lock-tables --routines --triggers --events \
  --no-tablespaces --default-character-set=utf8mb4 \
  seguimiento_adm > /tmp/backup-manual-$(date +%Y%m%d-%H%M%S).sql
```

Comprimir:

```bash
gzip -9 backup-manual-YYYYMMDD-HHMMSS.sql
# Windows sin gzip: usar 7-Zip → "Add to archive" → GZip
```

### 21.2 Restaurar por consola

Un restore manual es también un **reemplazo total**: hay que vaciar el esquema antes de importar, o quedarán tablas con datos viejas que el archivo no contiene.

```powershell
$mysql   = "C:\wamp64\bin\mysql\mysql8.4.7\bin\mysql.exe"
$dump    = "backup-manual-20261026-020000.sql"
$tablas  = & $mysql --user=root --password -N -B -e "SELECT GROUP_CONCAT(CONCAT('``',table_name,'``')) FROM information_schema.tables WHERE table_schema='seguimiento_adm' AND table_type='BASE TABLE';"

& $mysql --user=root --password seguimiento_adm -e "SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS $tablas; SET FOREIGN_KEY_CHECKS=1;"
& $mysql --user=root --password seguimiento_adm < $dump
```

Con archivo `.gz` (Linux):

```bash
# 1) vaciar esquema
mysql --user=root -p -N -B -e "SELECT CONCAT('DROP TABLE IF EXISTS \`',table_name,'\`;') \
  FROM information_schema.tables WHERE table_schema='seguimiento_adm' AND table_type='BASE TABLE';" \
  | mysql --user=root -p seguimiento_adm

# 2) importar
gunzip -c backup.sql.gz | mysql --user=root -p seguimiento_adm
```

Después de restaurar a mano:

```bash
php artisan up            # por si quedó en mantenimiento
php artisan migrate --force
php artisan optimize:clear
```

> En consola, `-p` sin valor solicita la contraseña de forma interactiva (no queda en el historial). **Nunca** use `-pMiClave` en scripts.

### 21.3 Desbloquear la aplicación tras una restauración fallida

Si la app quedó en modo mantenimiento (error 503) o la base quedó inconsistente:

```bash
php artisan backups:recuperar
```

Reporta: si levantó la app, cuál fue el último `pre_restauracion` y su ruta, si la base responde y el último evento de auditoría. Si la base quedó a medias, seguir el procedimiento de §21.2 con ese `pre_restauracion`.

---

## 22. Prueba de fuego (drill)

Prueba obligatoria antes de dar por operativo el módulo, y recomendada cada 6 meses.

```text
[ ] 1. Crear base de prueba: CREATE DATABASE seguimiento_drill;
[ ] 2. Apuntar una copia del .env a esa base (o usar DB_DATABASE temporal)
[ ] 3. Generar backup desde la UI → verificar registro, archivo y log de creación
[ ] 4. Descargar el archivo → verificar que el evento `descarga` queda registrado
[ ] 5. Borrar un registro conocido de la base de prueba (p. ej. un trámite)
[ ] 6. Restaurar desde el backup → verificar que el registro volvió
[ ] 7. Verificar: existe backup pre_restauracion, eventos de restauración, config preservada
[ ] 8. Crear una tabla de prueba con datos y restaurar de nuevo → la tabla debe DESAPARECER
        (reemplazo total, no estado híbrido)
[ ] 9. Provocar un import inválido (SQL cortado a propósito) → verificar ROLLBACK automático
        y que la app siga operativa con los datos previos intactos
[ ] 10. Restaurar un archivo externo (.sql y .sql.gz) → verificar validaciones y auditoría
[ ] 11. Probar archivo inválido (un PDF renombrado) → debe rechazarse con mensaje claro
[ ] 12. Probar contraseña incorrecta → no debe restaurar y debe registrar `fallo`
[ ] 13. Verificar protección acotada: tras dos restauraciones, solo el pre_restauracion más
        reciente queda protegido; el anterior debe poder eliminarse
[ ] 14. Eliminar la base de prueba y restaurar el .env original
```

Resultado esperado: base idéntica al momento del backup, auditoría completa y ningún archivo huérfano.

---

## 23. Solución de problemas

| Síntoma / error | Causa probable | Solución |
|---|---|---|
| «No se encontró `mysqldump`» | Binario fuera del `PATH` (caso actual) | Definir `BACKUP_MYSQLDUMP_PATH` en `.env` + `config:clear` |
| Código de salida 127 | Comando no existe en el host | Verificar ruta con `backups:diagnostico` |
| `Access denied for user` (1045) | Credenciales de `.env` incorrectas o usuario sin permisos | Probar `mysql -u... -p` manualmente |
| `Can't connect to MySQL server` (2002) | Servicio detenido | Iniciar el servicio (WAMP: `wampmysqld64`) |
| `No space left on device` (28) | Disco lleno | Liberar espacio; la UI lo avisa antes con el panel de disco |
| `Got error 28` a mitad del dump | Se llenó durante el dump | Borrar `.part`, bajar retención, ampliar disco |
| Dump cortado / archivo de 0 bytes | Timeout o `memory_limit` | Ya se usa `set_time_limit(0)` y streaming; revisar espacio |
| «Ya hay un backup en proceso» (409) | Lock activo por un proceso anterior | Esperar; si quedó colgado, reiniciar el servicio web |
| Hash no coincide al restaurar | Archivo modificado/corrupto | Usar otro backup o el `pre_restauracion` |
| «El archivo no parece ser un backup de esta aplicación» | Faltan tablas esperadas | Verificar que sea la base correcta |
| «El archivo supera el límite de 100 MB» | `upload_max_filesize` | Subir por FTP + `backups:diagnostico --importar=<ruta>` |
| Restauración falla a mitad | SQL incompatible o error de sintaxis | El rollback automático revierte al `pre_restauracion`; si también falla, `php artisan backups:recuperar` |
| La app quedó en 503 después de restaurar | Proceso cortado antes del `up` | `php artisan backups:recuperar` (levanta y verifica) |
| Tablas con datos viejos tras restaurar | Import sin reemplazo total | La implementación hace `DROP` de todas las tablas; verificar `reemplazo_total = true` |
| El pre_restauracion ya no está protegido | Protección acotada: solo el más reciente queda protegido | Comportamiento esperado; protegerlo a mano si se necesita conservarlo |
| Después de restaurar no puedo entrar | Sesiones vaciadas (esperado) | Volver a iniciar sesión; si el usuario no existía en el backup, usar el `pre_restauracion` |
| La automatización no corre | Sin cron/tarea programada | Configurar cron/schtasks; verificar `schedule:list` |
| El automático se ejecuta cada minuto | `backup_ultima_ejecucion` no se actualiza | Revisar permisos de escritura en `configuraciones` |
| Día 31 no se ejecuta en febrero | Comportamiento definido | Usa el último día del mes; es intencional |
| Gráfico de disco «No disponible» | `disk_free_space` deshabilitado por hosting | Esperado; la cuota y el tamaño por archivo siguen informando |
| Archivos en disco sin registro | Restauración de un backup antiguo o copia manual | Se muestran como «huérfanos»; decidir conservar o borrar |
| `Can't create TCP/IP socket (10106)` al generar el backup desde la pantalla | En SAPI web (`cli-server`, `php-fpm`, Apache) `$_SERVER` y `$_ENV` no traen las variables de Windows, Symfony Process arma el hijo sin `SystemRoot` ni `PATH` y Winsock no inicializa | Resuelto: `App\Support\EntornoProceso::paraBinariosMysql()` inyecta esas variables en cada `Process`. Si reaparece, verificar que los tres procesos de `CliMySqlDumper` lo reciban; por CLI nunca se reproduce |

---

## 24. Portabilidad a otro sistema

Checklist para replicar el comportamiento exacto en otra instalación (Laravel + MySQL).

### 24.1 Requisitos del destino

```text
[ ] PHP 8.2+ con extensiones: pdo_mysql, zlib, mbstring, fileinfo
[ ] MySQL 8.0+ (o MariaDB 10.6+) con cliente y mysqldump accesibles
[ ] exec / proc_open habilitados
[ ] Escritura en storage/app/private
[ ] Zona horaria de la app definida (America/La_Paz o la local)
[ ] Laravel 11+ (este proyecto usa 13.x): Schedule en routes/console.php y middleware terminate
```

### 24.2 Archivos a copiar

```text
app/Models/Backup.php
app/Models/BackupEvento.php
app/Services/BackupService.php
app/Services/BackupProgramacionService.php
app/Services/BackupEspacioService.php
app/Services/BackupRestauracionService.php
app/Services/BackupValidador.php
app/Backups/Contrato/Dumper.php
app/Backups/CliMySqlDumper.php
app/Backups/FakeDumper.php
app/Support/BinarioMysql.php
app/Support/EntornoProceso.php
app/Console/Commands/BackupsAuto.php
app/Console/Commands/BackupsDiagnostico.php
app/Console/Commands/BackupsRecuperar.php
app/Http/Middleware/EjecutarBackupVencido.php
app/Http/Controllers/Backups/BackupController.php
app/Http/Controllers/Backups/BackupRestauracionController.php
app/Http/Requests/Backups/*.php
app/Http/Resources/BackupResource.php
config/backups.php
database/migrations/*_create_backups_table.php
database/migrations/*_create_backup_eventos_table.php
database/seeders/PermisosBackupsSeeder.php
resources/js/pages/Backups/Index.tsx
resources/js/components/features/backups/*
resources/js/hooks/useBackups.ts
resources/js/services/backupService.ts
resources/js/types/backups.ts
```

### 24.3 Puntos de integración a modificar

```text
[ ] config/filesystems.php     → agregar disco 'backups'
[ ] routes/web.php             → bloque de rutas de §6.1
[ ] routes/console.php         → Schedule::command('backups:auto')->everyMinute()
[ ] bootstrap/app.php          → registrar middleware EjecutarBackupVencido en 'web'
[ ] Sidebar.tsx                → ítem 'Backups' con permiso
[ ] Icon.tsx                   → iconos database, lock, restore, hard-drive
[ ] .env.example               → variables BACKUP_* (incluida BACKUP_APP_SLUG)
[ ] Tabla `configuraciones`    → si no existe, crearla (clave única + valor)
[ ] Seeder de roles           → ejecutar PermisosBackupsSeeder
[ ] AppServiceProvider        → enlazar Dumper::class con CliMySqlDumper
```

### 24.4 Diferencias que hay que adaptar

| Si el destino… | Cambio necesario |
|---|---|
| Usa InnoDB | Reemplazar `--lock-tables` por `--single-transaction`; el rollback automático sigue siendo recomendable |
| Usa PostgreSQL | Sustituir `mysqldump`/`mysql` por `pg_dump`/`psql` en `CliMySqlDumper` (la interfaz `Dumper` lo permite) |
| No tiene acceso a binarios | Implementar un `Dumper` PHP puro y enlazarlo en el container |
| Almacena en S3 | Cambiar el disco `backups` a `s3`; el servicio no cambia (usa `Storage`) |
| Usa colas | Mover la ejecución a un Job; el estado `en_proceso` ya está modelado |
| No puede hacer `DROP` de tablas | Desactivar `reemplazo_total` y documentar el riesgo de estado híbrido |
| Tiene otro nombre de app | Ajustar `BACKUP_APP_SLUG`; **nunca** derivarlo de `APP_NAME` |

### 24.5 Verificación posterior

```text
[ ] php artisan backups:diagnostico  → todo OK
[ ] Crear backup manual → descargar → abrir el .sql.gz
[ ] Restaurar en base de prueba (§22)
[ ] Configurar automatización diaria y verificar `schedule:list`
[ ] Confirmar que el ítem del sidebar solo aparece con `backups.consulta`
```

---

## 25. Fuera de alcance y mejoras futuras

| Mejora | Nota |
|---|---|
| Cifrado del backup (`gpg`/AES) | Recomendable: el archivo contiene CI, correos y hashes de contraseñas |
| Envío a S3/FTP | `Storage` ya lo soporta; falta un disco remoto configurado |
| Respaldo de archivos (PDFs de reportes) | Requiere inventario y política de retención propia |
| Notificación por correo al fallar | Depende de SMTP configurado (hoy `MAIL_MAILER=log`) |
| Restauración parcial (solo una tabla) | Requiere UI de selección y validación de FKs (inviable en MyISAM sin cuidado) |
| Backups incrementales | `mysqldump` no lo soporta nativamente; requiere binlog o xtrabackup |
| Migración a InnoDB | Habilita `--single-transaction`, FKs reales y restauración transaccional |
| Verificación automática del backup | Restaurar en una base temporal y comparar conteos, de forma periódica |

---

## 26. Inventario de archivos

Estado al 27/10/2026: módulo implementado y verificado contra MySQL 8.4.7 (`seguimiento_adm`). Un backup manual produjo 76.559 bytes con 30 `CREATE TABLE`, datos de negocio y ninguna fila de `backups`/`backup_eventos`; la restauración de ese archivo devolvió conteos idénticos (`users` 9, `personas` 13, `areas` 4, `tramites` 111, `derivaciones` 912) y dejó el `pre_restauracion` protegido. Suites en verde: 194 Pest, 89 Vitest, `tsc --noEmit` limpio y build correcto.

Corrección posterior (27/10/2026): el primer backup generado desde la pantalla falló con `Can't create TCP/IP socket (10106)` porque en SAPI web el proceso hijo de `Symfony Process` quedaba sin `SystemRoot` ni `PATH`. Se agregó `app/Support/EntornoProceso.php` y los tres procesos de `CliMySqlDumper` lo reciben; el volcado se verificó de nuevo desde `php -S` (366 KB, 30 `CREATE TABLE`). Suites: 197 Pest (1 omitida por SO), 89 Vitest.

### Backend

| Archivo | Responsabilidad |
|---|---|
| `app/Models/Backup.php` | Registro del archivo; scopes `completados`, `noProtegidos`, constantes de tipo/estado |
| `app/Models/BackupEvento.php` | Bitácora inmutable |
| `app/Services/BackupService.php` | Generar, eliminar, retención, pre-restauración, eventos, ejecutar si vencido |
| `app/Services/BackupProgramacionService.php` | Próxima ejecución, vencimiento, día efectivo del mes, configuración vigente |
| `app/Services/BackupEspacioService.php` | Disco, cuota, tamaño por archivo, proyección, alertas |
| `app/Services/BackupRestauracionService.php` | Restauración interna y externa: pre-restauración, mantenimiento, reemplazo total, rollback |
| `app/Services/BackupValidador.php` | Validación de archivos importados |
| `app/Backups/Contrato/Dumper.php` | Interfaz `volcar()` / `importar()` |
| `app/Backups/CliMySqlDumper.php` | Implementación con `proc_open` y `my.cnf` temporal |
| `app/Backups/FakeDumper.php` | Implementación para tests (genera SQL mínimo) |
| `app/Support/BinarioMysql.php` | Autodetección y caché de binarios |
| `app/Support/EntornoProceso.php` | Entorno de Windows (`SystemRoot`, `PATH`, …) para los `Process` de `mysqldump`/`mysql`; evita el error 10106 en SAPI web |
| `app/Console/Commands/BackupsAuto.php` | `backups:auto` |
| `app/Console/Commands/BackupsDiagnostico.php` | `backups:diagnostico` (`--importar`, `--limpiar-temporales`) |
| `app/Console/Commands/BackupsRecuperar.php` | `backups:recuperar` (`--limpiar`): `up` de emergencia, conexión, último `pre_restauracion`, interrumpidos |
| `app/Http/Middleware/EjecutarBackupVencido.php` | Disparo perezoso |
| `app/Http/Controllers/Backups/BackupController.php` | Listado, crear, descargar, proteger, eliminar, espacio, eventos por backup, automatización |
| `app/Http/Controllers/Backups/BackupRestauracionController.php` | Restaurar interno y externo |
| `app/Http/Requests/Backups/UpdateAutomatizacionRequest.php` | Valida frecuencia, hora, días, tope, cuota, umbral |
| `app/Http/Requests/Backups/RestaurarBackupRequest.php` | `RESTAURAR` + contraseña |
| `app/Http/Requests/Backups/RestaurarDesdeArchivoRequest.php` | Archivo + `RESTAURAR` + contraseña |
| `app/Http/Resources/BackupResource.php` | Serialización para Inertia |

El backup manual no necesita Form Request propio: no recibe datos del cliente (`POST /backups` sin cuerpo).

### Migraciones, seeders y configuración

| Archivo | Responsabilidad |
|---|---|
| `database/migrations/*_create_backups_table.php` | Tabla `backups` (sin FK a `users`, ver §3.1) |
| `database/migrations/*_create_backup_eventos_table.php` | Tabla `backup_eventos` |
| `database/seeders/PermisosBackupsSeeder.php` | Módulo `backups`, 6 acciones y permisos; idempotente |
| `database/seeders/DatabaseSeeder.php` | Limpia `backups`/`backup_eventos` y ejecuta el seeder de permisos |
| `config/backups.php` | Slug, disco, binarios, timeouts, tablas sin datos, listas de validación |
| `config/filesystems.php` | Disco `backups` (root desde `.env`) |
| `app/Providers/AppServiceProvider.php` | Enlace `Dumper` → `CliMySqlDumper` |

### Frontend

| Archivo | Responsabilidad |
|---|---|
| `resources/js/pages/Backups/Index.tsx` | Orquesta la pantalla (sin lógica de negocio) |
| `resources/js/components/features/backups/TablaBackups.tsx` | Lista y acciones por fila |
| `resources/js/components/features/backups/FormAutomatizacion.tsx` | Frecuencia, hora, día, tope, cuota y umbral |
| `resources/js/components/features/backups/EstadoAlmacenamiento.tsx` | Panel de espacio: dona del disco, barra de cuota y tamaño por backup |
| `resources/js/components/features/backups/ModalRestaurar.tsx` | Advertencia + `RESTAURAR` + contraseña |
| `resources/js/components/features/backups/ModalRestaurarArchivo.tsx` | Selector/arrastre de archivo para restaurar |
| `resources/js/components/features/backups/ModalEliminar.tsx` | Confirmación de borrado |
| `resources/js/components/features/backups/ModalHistorial.tsx` | Eventos de un backup |
| `resources/js/components/features/backups/formato.ts` | Formato de bytes, fechas y etiquetas de acción |
| `resources/js/hooks/useBackups.ts` | Estado + acciones |
| `resources/js/services/backupService.ts` | Llamadas Inertia y JSON |
| `resources/js/types/backups.ts` | Tipos del módulo (props, backup, espacio, automatización, eventos) |

Los tres gráficos viven dentro de `EstadoAlmacenamiento.tsx`; no se separaron en componentes propios porque comparten el mismo estado y escala.

### Tests

| Archivo | Cobertura |
|---|---|
| `tests/Feature/BackupTest.php` | Crear, permisos, retención, protegido, descarga |
| `tests/Feature/BackupRestauracionTest.php` | Password, `RESTAURAR`, pre-restauración, reemplazo total, rollback automático, config preservada |
| `tests/Feature/BackupRecuperacionTest.php` | `backups:recuperar`, interrumpidos y salida garantizada del modo mantenimiento |
| `tests/Feature/BackupArchivoExternoTest.php` | Validaciones y archivado del archivo importado |
| `tests/Feature/BackupProgramacionTest.php` | Diaria/semanal/mensual, día 31, atrasos, doble ejecución |
| `tests/Feature/BackupEspacioTest.php` | Datos del panel, alertas, hostings restringidos |
| `tests/Unit/EntornoProcesoTest.php` | Entorno de Windows completo para los binarios (regresión del error 10106) |
| `resources/js/tests/Backups/Index.test.tsx` | Render, permisos deshabilitados, confirmación de restauración, guardado de automatización |

Total al cierre: 44 pruebas Pest del módulo (197 en la suite completa, 1 omitida por sistema operativo) y 4 pruebas Vitest (89 en la suite completa).

---

## 27. Anexos

### Anexo A — Variables de entorno completas

```dotenv
BACKUP_APP_SLUG=seguimiento-adm
BACKUP_DISK=backups
BACKUP_PATH=
BACKUP_MYSQLDUMP_PATH=
BACKUP_MYSQL_PATH=
BACKUP_TIMEOUT=3600
BACKUP_PREFIJO=backup
BACKUP_MAX_IMPORT_MB=100
```

### Anexo B — Consultas útiles de operación

```sql
-- Archivos registrados, del más nuevo al más viejo
SELECT id, nombre, tipo, estado, ROUND(tamano_bytes/1048576, 2) AS mb,
       protegido, user_id, created_at
FROM backups ORDER BY created_at DESC;

-- Espacio total ocupado por backups completados
SELECT COUNT(*) AS cantidad, ROUND(COALESCE(SUM(tamano_bytes),0)/1048576, 2) AS mb
FROM backups WHERE estado = 'completado';

-- Bitácora de los últimos 50 eventos
SELECT created_at, accion, backup_nombre, user_id, ip, detalle
FROM backup_eventos ORDER BY created_at DESC LIMIT 50;

-- Restauraciones realizadas (auditoría)
SELECT created_at, user_id, ip, detalle
FROM backup_eventos WHERE accion = 'restauracion' ORDER BY created_at DESC;

-- Fallos de los últimos 7 días
SELECT created_at, backup_nombre, detalle
FROM backup_eventos
WHERE accion = 'fallo' AND created_at >= NOW() - INTERVAL 7 DAY
ORDER BY created_at DESC;

-- Backups con archivo faltante (comparar con el listado del disco)
SELECT id, nombre, ruta FROM backups WHERE estado = 'completado';
```

### Anexo C — Glosario

| Término | Significado |
|---|---|
| Backup | Archivo `.sql.gz` con la estructura y los datos de la BD |
| Retención | Regla que limita cuántos backups se conservan |
| Protegido | Backup exento de la limpieza automática |
| Protección acotada | Solo el `pre_restauracion` más reciente queda protegido; los anteriores se desprotegen solos |
| Pre-restauración | Backup creado justo antes de restaurar, como red de seguridad |
| Importado | Backup que llegó como archivo externo subido por el usuario |
| Reemplazo total | Antes de importar se eliminan todas las tablas, para no dejar un estado híbrido |
| Rollback automático | Reimportar el `pre_restauracion` cuando el import falla, para volver al estado previo |
| Huérfano | Archivo presente en el disco sin registro en la tabla `backups` |
| Disparo perezoso | Ejecución del backup automático al detectar vencimiento durante una visita |
| Cuota | Límite configurable de espacio para la carpeta de backups (no es una cuota de SO) |

### Anexo D — Registro de cambios del documento

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-10-26 | Versión inicial: decisiones 1–17, flujos, DDL, panel de almacenamiento, portabilidad |
| 1.1 | 2026-10-26 | Revisión experta: 6 permisos (`baja` para eliminar, `edicion` para proteger), protección acotada del `pre_restauracion`, reemplazo total con rollback automático, `backups:recuperar` + shutdown handler, slug estable `BACKUP_APP_SLUG`, gráfico por tamaño de archivo en lugar de serie acumulada |
| 1.2 | 2026-10-27 | Implementación: redirect a `backups.index` con flash en lugar de logout forzado tras restaurar (§13.6), historial de eventos por backup vía `GET /backups/{backup}/eventos` (§12.2), `backups:recuperar --limpiar` y códigos de salida de los comandos (§19), corrección del ejemplo de vencimiento mensual día 31 (§9.2), inventario real de archivos y estado de la implementación (§26) |
| 1.3 | 2026-10-27 | Corrección del error `Can't create TCP/IP socket (10106)` al generar backups desde la pantalla: `App\Support\EntornoProceso` completa `SystemRoot`/`PATH` en los procesos de `mysqldump`/`mysql`; fila nueva en §23, inventario y test de regresión |
