# AGENTS.md — Seguimiento de Trámites

## Descripción del proyecto

Aplicación web para el seguimiento de trámites. Construida con:

- **Backend**: Laravel 13 (PHP 8.3+)
- **Frontend**: React 19 + TypeScript 6 (strict)
- **Capa híbrida**: Inertia.js v3 (SPA sin SSR; no hay API REST aparte)
- **CSS**: Tailwind CSS v4 con tokens `excel-*` en `resources/js/app.css`
- **Auth**: Laravel Sanctum (SPA con cookies) + RBAC propio (`modulos` / `acciones` / `permisos`)
- **BD**: MySQL 8
- **Build**: Vite 8
- **Testing**: Pest 4 (backend) + Vitest 4 + React Testing Library (frontend)
- **Tipado**: `spatie/laravel-typescript-transformer` → `resources/js/types/generated/`

La radiografía técnica del proyecto está en `stack.md`; la especificación funcional de backups, en `logica-backup.md`.

## Convenciones de código

### Backend (Laravel)
- Controllers delgados; toda la lógica de negocio en `app/Services/`
- Usar Form Requests para validación (`app/Http/Requests/`)
- Usar API Resources para transformación de respuestas
- Nombrado: `TramiteController`, `TramiteService`, `StoreTramiteRequest`
- Rutas con nombre y agrupadas por módulo, protegidas con `middleware('permission:{modulo}[,{accion}]')`
- Usar Pest para tests, no PHPUnit
- Validaciones que se repiten se extraen a traits en `app/Http/Requests/Concerns/`

### Frontend (React + TypeScript)
- TypeScript strict mode — evitar `any`
- Componentes UI 100% presentacionales (en `components/ui/`)
- Feature components combinan UI components + hooks (en `components/features/`)
- Hooks consumen services (en `hooks/`) y exponen estado + acciones
- Services encapsulan llamadas a Inertia (en `services/`)
- Páginas Inertia en `pages/` solo orquestan, no contienen lógica
- Formularios con `useForm` de `@inertiajs/react`
- Estado UI: props de Inertia + Context API (sin Redux ni Zustand)
- Props y DTO tipados en `types/` (no repetir interfaces dentro de las páginas)
- Tests con Vitest + React Testing Library

### Paleta de colores
Tokens definidos en `resources/js/app.css` (`@theme`, con variante oscura):

- `excel-green` `#107C41` — Títulos, botones primarios, sidebar activo
- `excel-gold` `#F2C811` — Badges "en proceso", acentos
- `excel-red` `#C42B1C` — Botones peligro, estados críticos
- `excel-blue` `#0078D4` — Enlaces y avisos informativos
- `excel-bg` `#F3F2F1` — Fondo general
- `excel-surface` `#FFFFFF` / `excel-surface-2` `#FAF9F8` — Tarjetas y filas alternas
- `excel-border` `#E1DFDD` — Bordes
- `excel-text` `#242424` / `excel-muted` `#605E5C` — Texto principal y secundario

Los nombres `patuju-*` siguen existiendo como alias de los mismos valores; el código nuevo usa `excel-*`.

## Reglas de comportamiento

1. **Siempre preguntar antes de**:
   - Crear o modificar migraciones de base de datos
   - Instalar nuevos paquetes/composer/npm
   - Cambiar la estructura de directorios existente
   - Modificar `stack.md`

2. **Seguir la arquitectura existente** — no crear patrones nuevos sin justificación

3. **TypeScript strict** — no usar `any`, `@ts-ignore`, o `as unknown`

4. **Tests primero para bugs** — ante un bug, escribir test que lo reproduzca antes de corregir

5. **Commits descriptivos** en español o inglés, convencional (ej: `feat:`, `fix:`, `test:`)

6. **No exponer secrets** — revisar que no se hardcodeen API keys, tokens, etc.

7. **Nunca ejecutar `mysqldump`/`mysql` reales en tests** — el contenedor enlaza `FakeDumper`; los tests usan SQLite en memoria

8. **No agregar FK hacia `users`** — esa tabla es MyISAM y MySQL no permite FKs entre InnoDB y MyISAM; la integridad se garantiza por aplicación (caso `backups.user_id`)

## Módulo Backups

Especificación completa: `logica-backup.md`. Pantalla: `/backups` (ítem del sidebar visible con `backups.consulta`).

### Permisos
Módulo `backups` con 6 acciones: `consulta`, `creacion`, `edicion`, `baja`, `descarga`, `restauracion`.

### Rutas principales (`routes/web.php`)
| Ruta | Nombre | Acción requerida |
|---|---|---|
| `GET /backups` | `backups.index` | `consulta` |
| `GET /backups/espacio` | `backups.espacio` | `consulta` |
| `GET /backups/{backup}/eventos` | `backups.eventos` | `consulta` |
| `POST /backups` | `backups.store` | `creacion` |
| `PUT /backups/automatizacion` | `backups.automatizacion` | `edicion` |
| `PUT /backups/{backup}/proteger` | `backups.proteger` | `edicion` |
| `DELETE /backups/{backup}` | `backups.destroy` | `baja` |
| `GET /backups/{backup}/descargar` | `backups.descargar` | `descarga` |
| `POST /backups/{backup}/restaurar` | `backups.restaurar` | `restauracion` |
| `POST /backups/restaurar-archivo` | `backups.restaurar-archivo` | `restauracion` |

### Comandos
- `php artisan backups:auto` — ejecuta el backup automático si venció (scheduler cada minuto + middleware `EjecutarBackupVencido`)
- `php artisan backups:diagnostico [--importar=<ruta>] [--limpiar-temporales]` — verifica binarios, BD, disco y backups; sale con código 1 si algo falla
- `php artisan backups:recuperar [--limpiar]` — levanta la app, verifica la conexión, marca interrumpidos y limpia huérfanos

### Reglas del módulo
- Retención: máximo configurable (10 por defecto). Los backups `protegido` nunca se eliminan solos.
- El `pre_restauracion` se crea siempre antes de restaurar; solo el más reciente queda protegido.
- La restauración es un reemplazo total con rollback automático; requiere escribir `RESTAURAR` y la contraseña del usuario.
- Tras restaurar se redirige a `backups.index` con flash (sin logout forzado); ver `logica-backup.md` §13.6.
- `backups` y `backup_eventos` se respaldan solo como estructura (`tablas_sin_datos`); la bitácora se reinserta después del import.
- Archivos en `storage/app/private/backups-{BACKUP_APP_SLUG}`; el slug es estable y **no** se deriva de `APP_NAME`.
- Tests: `tests/Feature/Backup*.php` y `resources/js/tests/Backups/`.

## Seeders disponibles

- `php artisan db:seed` — ejecuta `DatabaseSeeder`: **limpia** las tablas de negocio (incluidas `backups` y `backup_eventos`, solo si existen) y siembra únicamente roles y permisos, configuración, áreas con sus puestos y los usuarios institucionales. **No crea trámites, derivaciones ni actuaciones**
- `php artisan migrate:fresh --seed` — reset completo + seed (deja la base operativa vacía de trámites)
- `php artisan db:seed --class=RolesYPermisosSeeder` — módulos, acciones, permisos y roles (`admin`, `secretaria`, `jefe`, `user`)
- `php artisan db:seed --class=PermisosTramitacionSeeder` — agrega la acción `tramitacion` del módulo `tramites` y la concede a todos los roles existentes; idempotente (apto para producción sin `migrate:fresh`)
- `php artisan db:seed --class=PermisosCreacionTramitesSeeder` — agrega la acción `creacion` del módulo `tramites` y la concede a todos los roles existentes (todos los usuarios pueden crear trámites); idempotente
- `php artisan db:seed --class=PermisosBackupsSeeder` — módulo `backups` con sus 6 permisos; idempotente
- `php artisan db:seed --class=ConfiguracionSeeder` — configuración inicial (gestión del reporte)
- `php artisan db:seed --class=AreaSeeder` — áreas y puestos
- `php artisan db:seed --class=UsuarioSeeder` — los 7 usuarios institucionales con su persona, puesto vigente, rol y áreas habilitadas; idempotente
- `php artisan db:seed --class=TramiteSeeder` — **solo manual**: trámites con derivaciones y actuaciones (`crearParaUsuario($user, $cantidad)` para lotes a medida). Asume que ya existen usuarios y áreas sembrados
- `php artisan db:seed --class=ActuacionSeeder` — **solo manual**: actuaciones adicionales
- `PersonaSeeder`, `AdminUserSeeder`, `UserSeeder` y `UserSecretariaSeeder` quedan en disco como referencia histórica pero **ya no se invocan** desde `DatabaseSeeder`; `UsuarioSeeder` los reemplaza

### Usuarios
- El dominio institucional de las cuentas es `APP_USER_DOMAIN` (`.env`; por defecto `seguimiento.com`) y se expone al frontend como `dominio_usuario`
- El seed deja exactamente **7 usuarios**, todos con contraseña `1234567`:

  | Usuario | Nombre | Área / Puesto | Rol |
  |---|---|---|---|
  | `amontoya@seguimiento.com` | Alfredo Montoya Calderón | SEMPLA / JEFE | admin |
  | `cpizarroso@seguimiento.com` | Cristian Marcelo Pizarroso Peredo | SEMPLA / PROFESIONAL | admin |
  | `erodriguez@seguimiento.com` | Erika Rodriguez | DLA / SECRETARIA | secretaria |
  | `mfcastillo@seguimiento.com` | Mauricio Federico Castillo Otero | ADM / PROFESIONAL | user |
  | `guantelo@seguimiento.com` | Gustavo Antelo Rivero | ADM / PROFESIONAL | user |
  | `motero@seguimiento.com` | Monica Otero Melgar | ADM / ASISTENTE | user |
  | `cyescudero@seguimiento.com` | Carol Yasmil Escudero Mariscal | SEMPLA / ASISTENTE | secretaria |

- Áreas habilitadas: cada usuario tiene el área de su puesto como predeterminada, salvo `erodriguez`, que tiene `LEG` (predeterminada) y `ADM`
- El login acepta el correo completo, el `username` o la parte local del correo institucional
- `users.activo` (por defecto `true`): un usuario inactivo no puede iniciar sesión
- Activar/desactivar se hace desde el modal de estado en el index, edit y show (permiso `usuarios.edicion`); al desactivar se cierran sus sesiones abiertas y se revocan sus tokens API. Un admin no puede desactivar su propia cuenta
- Al resetear una contraseña se cierran las sesiones del usuario para obligarlo a iniciar sesión de nuevo (si el admin resetea la propia, conserva su sesión en curso)
- Al crear un usuario se ofrecen las mismas sugerencias de contraseña que en el reseteo (aleatoria, clásica, CI y nombre + año) y, tras el alta, se muestra un reporte copiable con nombre, cargo, área, usuario y contraseña
- Resto de usuarios: `User::factory()` (`password` por defecto, email `{usuario}@{app.user_domain}`)

### Estados de trámites
- `iniciado` — creado en el sistema, sin derivaciones
- `proceso` — derivado a un funcionario para su tramitación
- `observado` — pausado por el funcionario actual
- `finalizado` — concluido, no admite más derivaciones

### Estructura de derivaciones
Cada trámite generado por el seeder recibe una primera derivación y una cadena de 9 a 19 derivaciones (`DerivacionFactory::crearCadena`), con seguimiento de origen/destino, glosas y recepciones. El número es aleatorio por trámite, así que no hay totales fijos.

## Verificación antes de cerrar un cambio

```bash
php artisan test      # Pest
npm run test          # Vitest
npx tsc --noEmit      # tipos
npm run build         # build de producción
```

Para cambios que toquen backups, además: `php artisan backups:diagnostico`.
