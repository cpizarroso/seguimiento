# Entornos y modos de ejecución

Documento operativo de los modos de la aplicación. Define qué base de datos usa cada modo, cómo se muestra en la interfaz y cómo cambiar entre ellos sin tocar código.

## 1. Resumen

La aplicación tiene **tres modos** y cada uno apunta a una base de datos distinta:

| Modo | `SISTEMA_MODO` | Base de datos | Badge |
|---|---|---|---|
| Desarrollo | `dev` | `seguimiento-dev` | **Desarrollo** (amarillo) |
| Producción | `prod` | `seguimiento-prod` | **Producción** (verde) |
| Capacitación | `capacitacion` | `seguimiento-cap` | **Capacitación** (azul) |

El modo se define **solo en `.env`**. No hay selector en la interfaz ni tabla de configuración.

Además existe `APP_ENV`, que es el entorno técnico de Laravel (`local`, `production`, `testing`) y controla debug, manejo de errores y caché. **No** selecciona la base de datos ni el badge.

| Variable | Para qué sirve | Valores |
|---|---|---|
| `APP_ENV` | Comportamiento técnico de Laravel | `local`, `production`, `testing` |
| `APP_DEBUG` | Mostrar errores detallados | `true` en desarrollo, `false` en producción |
| `SISTEMA_MODO` | Base de datos de negocio + badge | `dev`, `prod`, `capacitacion` |
| `SISTEMA_NOTA_CAPACITACION` | Nota libre que se muestra con el badge y en el login | texto o vacío |

Combinaciones recomendadas:

| Escenario | `APP_ENV` | `APP_DEBUG` | `SISTEMA_MODO` |
|---|---|---|---|
| Desarrollo local | `local` | `true` | `dev` |
| Producción | `production` | `false` | `prod` |
| Capacitación | `production` | `false` | `capacitacion` |

> `APP_ENV=production` con `SISTEMA_MODO=dev` es técnicamente posible, pero no debe usarse en un servidor real: la app quedaría en modo desarrollo apuntando a `seguimiento-dev`.

## 2. Cómo se selecciona la base de datos

El mapeo vive en un único lugar: `app/Support/Modo.php`.

```php
Modo::baseDatos('dev');          // seguimiento-dev
Modo::baseDatos('prod');         // seguimiento-prod
Modo::baseDatos('capacitacion'); // seguimiento-cap
```

`config/database.php` deriva la base de la conexión `mysql` desde ese mapeo:

```php
'database' => Modo::baseDatos((string) env('SISTEMA_MODO', Modo::DEV)),
```

Consecuencias:

- **`DB_DATABASE` ya no se usa** para MySQL. Si queda definida en `.env`, se ignora; la base siempre sale de `SISTEMA_MODO`.
- Un valor inválido en `SISTEMA_MODO` lanza una excepción al arrancar (`SISTEMA_MODO inválido: «…»`). Es intencional: es preferible fallar a apuntar en silencio a la base equivocada.
- El modo aplica a **todos los contextos**: web, `php artisan`, scheduler y workers. Todo proceso que cargue el mismo `.env` usa la misma base.
- `config/database.php` solo cambia la conexión `mysql`. SQLite (usado por los tests) no se ve afectado.

## 3. El badge de modo

El backend comparte la información en `HandleInertiaRequests`:

```php
'sistema' => [
    'modo' => config('app.modo'),
    'entorno' => app()->environment(),
    'etiqueta' => Modo::etiqueta(config('app.modo')),
    'variante' => Modo::variante(config('app.modo')),
    'nota' => config('app.nota_capacitacion'),
],
```

Dónde se ve:

- **Login** (`/login`): badge arriba del título "Iniciar sesión". Si `SISTEMA_NOTA_CAPACITACION` tiene texto, se muestra también como aviso.
- **Cabecera** de la aplicación autenticada: badge junto al menú de usuario.
- El tooltip del badge muestra `Modo: … · APP_ENV: …` y, si existe, la nota.
- Colores del badge: **Desarrollo** amarillo (`warning`), **Producción** verde (`success`) y **Capacitación** azul (`info`).

Componentes:

- `resources/js/hooks/useSistema.ts`
- `resources/js/components/features/sistema/BadgeEntorno.tsx`

El badge es **solo informativo**: no bloquea acciones ni aísla datos por sí mismo. El aislamiento real proviene de que cada modo apunta a una base distinta.

## 4. Configuración de `.env`

### Desarrollo

```dotenv
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

SISTEMA_MODO=dev
SISTEMA_NOTA_CAPACITACION=

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
```

### Producción

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://seguimiento.institucion.gob.bo

SISTEMA_MODO=prod
SISTEMA_NOTA_CAPACITACION=

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=usuario_prod
DB_PASSWORD=...
```

### Capacitación

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://capacitacion.institucion.gob.bo

SISTEMA_MODO=capacitacion
SISTEMA_NOTA_CAPACITACION="Datos de prueba para el curso de mayo"

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=usuario_cap
DB_PASSWORD=...
```

Recomendaciones:

- Usar un **usuario MySQL distinto** por modo, con permisos solo sobre su base. Así un `.env` mal editado no puede escribir en `seguimiento-prod`.
- No definir `DB_DATABASE`. Si se define, no se usa.
- `APP_KEY` debe ser **estable** por instalación. No copiar la de producción a capacitación si la base de capacitación contendrá datos reales; y nunca rotarla sin planificar.

## 5. Cambiar de modo

1. Editar `.env` y cambiar `SISTEMA_MODO` (y `APP_ENV` / `APP_DEBUG` si corresponde).
2. Limpiar o regenerar la configuración cacheada:

   ```bash
   php artisan config:clear
   ```

   Si el servidor trabaja con configuración cacheada:

   ```bash
   php artisan config:cache
   ```

3. Reiniciar los workers de cola y el proceso web (PHP-FPM/Apache) para que tomen el nuevo `.env`.
4. Verificar (ver siguiente sección).

> Con `config:cache` activo, cambiar `.env` **no tiene efecto** hasta volver a ejecutar `php artisan config:cache`. Es la causa más común de "cambié el modo y sigue igual".

### Nota sobre varios modos en un mismo servidor

Cada instalación debe tener su propio directorio y su propio `.env`. No es seguro compartir el mismo código con dos `.env` alternados: el scheduler y los workers de un modo podrían ejecutar contra la base del otro.

## 6. Verificación

```bash
# Entorno técnico, debug y URL
php artisan about

# Modo activo y nota
php artisan config:show app

# Base de datos resultante
php artisan config:show database

# Conexión real y nombre de la base
php artisan db:show
```

En PowerShell se puede filtrar:

```powershell
php artisan config:show app | Select-String "modo|nota_capacitacion"
php artisan config:show database | Select-String "seguimiento-"
```

Resultado esperado en desarrollo:

- `Environment`: `local`
- `modo`: `dev`
- `connections ⇁ mysql ⇁ database`: `seguimiento-dev`
- Login y cabecera: badge **Desarrollo**

## 7. Protección de `seguimiento-prod`

`seguimiento-prod` es la base que debe protegerse. Reglas operativas:

1. **Antes de cualquier operación destructiva**, confirmar la base activa con `php artisan db:show`. Debe decir `seguimiento-prod` solo cuando sea intencional.
2. **Nunca** ejecutar `php artisan migrate:fresh` ni `php artisan db:seed` en producción. `db:seed` limpia las tablas de negocio.
3. Las migraciones en producción se ejecutan con `php artisan migrate --force`, **después** de crear un backup.
4. Crear un backup manual antes de cada despliegue que incluya migraciones.
5. El usuario MySQL de producción no debe tener permisos `DROP DATABASE`. La creación o borrado de bases se hace con una cuenta administrativa, fuera de la aplicación.
6. El módulo de backups usa la conexión activa: en modo `prod` respalda `seguimiento-prod`; en modo `capacitacion`, `seguimiento-cap`.

Checklist mínimo antes de un despliegue en producción:

```bash
php artisan about                 # APP_ENV=production, debug deshabilitado
php artisan db:show               # seguimiento-prod
# crear backup manual desde /backups o con backups:auto
php artisan migrate --force
php artisan config:cache
php artisan view:cache
# reiniciar workers de cola
php artisan backups:diagnostico   # debe salir con código 0
```

## 8. Crear o actualizar `seguimiento-cap`

La aplicación **selecciona** la base, pero **no la crea**. La copia se hace una vez y se refresca cuando se necesite, fuera del flujo normal.

Procedimiento con los binarios de MySQL (Windows o Linux):

```bash
# 1. Volcado de producción
mysqldump -h 127.0.0.1 -P 3306 -u root -p \
  --single-transaction --routines --triggers \
  seguimiento-prod > prod.sql

# 2. Crear la base de capacitación (si no existe)
mysql -h 127.0.0.1 -P 3306 -u root -p \
  -e "CREATE DATABASE IF NOT EXISTS \`seguimiento-cap\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Importar
mysql -h 127.0.0.1 -P 3306 -u root -p seguimiento-cap < prod.sql
```

Alternativa: usar un backup generado por el módulo Backups (archivo `.sql` en `storage/app/private/backups-{slug}`) e importarlo con el paso 3. Esos backups ya excluyen los datos de `sessions`, `cache`, `jobs`, `personal_access_tokens`, `backups` y `backup_eventos`, lo que es deseable para capacitación.

Advertencias:

- La copia contiene **datos reales**, incluidos usuarios y contraseñas (hasheadas). Para capacitación conviene reemplazar los usuarios por cuentas de prueba o cambiar sus contraseñas antes de habilitar el acceso.
- Tras importar, ejecutar `php artisan migrate --force` en modo capacitación si la copia quedó atrás respecto al código.
- No copiar datos de `seguimiento-cap` hacia `seguimiento-prod` bajo ninguna circunstancia.

## 9. Backups por modo

`BACKUP_APP_SLUG` define la carpeta de backups (`storage/app/private/backups-{slug}`). Recomendación:

| Modo | `BACKUP_APP_SLUG` |
|---|---|
| Desarrollo | `seguimiento-adm-dev` |
| Producción | `seguimiento-adm` (mantener el valor actual si ya existen backups) |
| Capacitación | `seguimiento-adm-cap` |

Cambiar el slug **no mueve** los backups existentes: crea una carpeta nueva. Si ya hay backups en producción, conservar el slug actual.

## 10. Tests

Los tests nunca tocan estas bases:

- `phpunit.xml` fuerza `APP_ENV=testing`, `DB_CONNECTION=sqlite` y `DB_DATABASE=:memory:`.
- `tests/Pest.php` usa `RefreshDatabase`.
- Los backups usan `FakeDumper`; no se ejecutan `mysqldump` ni `mysql` reales.

Por eso `SISTEMA_MODO` no afecta a `php artisan test`.

## 11. Estado actual del repositorio

- `.env`: `APP_ENV=local`, `APP_DEBUG=true`, `SISTEMA_MODO=dev`.
- Base activa: `seguimiento-dev`.
- Badge esperado: **Desarrollo**.
- `SISTEMA_NOTA_CAPACITACION` vacío.

## 12. Referencias

- `stack.md` — stack y arquitectura.
- `logica-backup.md` — funcionamiento del módulo de backups.
- `README.md` — instalación y comandos generales.
- `app/Support/Modo.php` — mapeo modo → base de datos, etiqueta y variante.
- `config/app.php`, `config/database.php` — lectura de las variables.
- `resources/js/components/features/sistema/BadgeEntorno.tsx` — badge.
