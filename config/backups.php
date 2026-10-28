<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Identidad del almacenamiento
    |--------------------------------------------------------------------------
    |
    | Slug estable usado para la carpeta y el nombre de los archivos. No se
    | deriva de APP_NAME a propósito: cambiar el nombre visible de la
    | aplicación no debe dejar huérfanos los backups existentes.
    |
    */

    'app_slug' => env('BACKUP_APP_SLUG', 'seguimiento-adm'),

    /*
    |--------------------------------------------------------------------------
    | Disco
    |--------------------------------------------------------------------------
    */

    'disk' => env('BACKUP_DISK', 'backups'),

    /*
    |--------------------------------------------------------------------------
    | Disco de destino configurable
    |--------------------------------------------------------------------------
    |
    | El administrador puede elegir una unidad local del servidor (por ejemplo
    | D:) desde la pestaña Automatización. Los backups nuevos se guardan en
    | {unidad}\{carpeta_destino}. Sin selección se usa el disco `backups`
    | (storage/app/private/backups-{app_slug}).
    |
    | `destinos` permite declarar el catálogo manualmente (Linux o pruebas):
    | [['id' => 'D', 'ruta' => '/mnt/d', 'etiqueta' => 'Disco D']]
    | Si está vacío, en Windows se enumeran las unidades existentes.
    |
    */

    'carpeta_destino' => env('BACKUP_CARPETA_DESTINO', 'backup-seguimiento'),

    'destinos' => [],

    /*
    |--------------------------------------------------------------------------
    | Binarios de MySQL (vacío = autodetección)
    |--------------------------------------------------------------------------
    */

    'mysqldump' => env('BACKUP_MYSQLDUMP_PATH'),

    'mysql' => env('BACKUP_MYSQL_PATH'),

    /*
    |--------------------------------------------------------------------------
    | Ejecución
    |--------------------------------------------------------------------------
    */

    'timeout' => (int) env('BACKUP_TIMEOUT', 3600),

    'prefijo' => env('BACKUP_PREFIJO', 'backup'),

    'maximo_default' => 10,

    'cuota_mb_default' => 0,

    'alerta_porcentaje_default' => 85,

    'max_import_mb' => (int) env('BACKUP_MAX_IMPORT_MB', 100),

    /*
    |--------------------------------------------------------------------------
    | Restauración
    |--------------------------------------------------------------------------
    |
    | reemplazo_total: antes de importar se eliminan todas las tablas para no
    | dejar un estado híbrido entre el esquema actual y el del archivo.
    |
    | rollback_automatico: si el import falla, se reimporta el backup
    | pre_restauracion recién creado para volver al estado anterior.
    |
    */

    'reemplazo_total' => true,

    'rollback_automatico' => true,

    'pre_restauracion_protegidos' => 1,

    /*
    |--------------------------------------------------------------------------
    | Contenido del backup
    |--------------------------------------------------------------------------
    |
    | Estas tablas se respaldan solo con estructura (sin datos): son
    | regenerables o contienen la propia auditoría de backups.
    |
    */

    'tablas_sin_datos' => [
        'cache',
        'cache_locks',
        'sessions',
        'jobs',
        'job_batches',
        'failed_jobs',
        'personal_access_tokens',
        'password_reset_tokens',
        'backups',
        'backup_eventos',
    ],

    /*
    |--------------------------------------------------------------------------
    | Validación de archivos importados
    |--------------------------------------------------------------------------
    */

    'tablas_esperadas' => [
        'users',
        'tramites',
        'personas',
        'derivaciones',
        'areas',
    ],

    'sentencias_prohibidas' => [
        'DROP DATABASE',
        'CREATE USER',
        'GRANT ',
        'ALTER USER',
    ],

    /*
    |--------------------------------------------------------------------------
    | Autodetección de binarios
    |--------------------------------------------------------------------------
    */

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
