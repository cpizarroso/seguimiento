# Stack Tecnológico — Seguimiento de Trámites

## Tecnologías principales

| Capa              | Tecnología                                                  |
|-------------------|-------------------------------------------------------------|
| Backend           | Laravel 13 (PHP 8.3+)                                       |
| Frontend          | React 19 + TypeScript 6 (strict)                            |
| Capa híbrida      | Inertia.js v3 (SPA sin SSR; no hay API REST aparte)         |
| CSS               | Tailwind CSS v4 (plugin `@tailwindcss/vite`)                |
| Auth              | Laravel Sanctum (SPA con cookies) + RBAC propio             |
| Base de datos     | MySQL 8                                                      |
| Build tool        | Vite 8 + `laravel-vite-plugin`                              |
| Testing           | Pest 4 (backend) + Vitest 4 + React Testing Library         |
| Tipado compartido | `spatie/laravel-typescript-transformer` → `types/generated` |
| Gráficos          | Recharts 3                                                   |
| Documentos        | `barryvdh/laravel-dompdf` (PDF) + `maatwebsite/excel` (XLSX) |
| Formato de código | Laravel Pint + `tsc --noEmit`                                |

## Paleta de colores

Los tokens viven en `resources/js/app.css` con `@theme` y tienen variante clara y oscura.

| Token Tailwind     | Claro     | Uso                                              |
|--------------------|-----------|--------------------------------------------------|
| `excel-green`      | `#107C41` | Títulos, botones primarios, sidebar activo       |
| `excel-green-dark` | `#0C5C30` | Hover de primarios                               |
| `excel-green-light`| `#E6F4EA` | Fondo de estado activo                           |
| `excel-gold`       | `#F2C811` | Badges "en proceso", acentos, alertas            |
| `excel-red`        | `#C42B1C` | Botones peligro, estados críticos                |
| `excel-blue`       | `#0078D4` | Enlaces y avisos informativos                    |
| `excel-bg`         | `#F3F2F1` | Fondo general                                    |
| `excel-surface`    | `#FFFFFF` | Tarjetas y paneles                               |
| `excel-surface-2`  | `#FAF9F8` | Filas alternas y cabeceras de tabla              |
| `excel-border`     | `#E1DFDD` | Bordes y separadores                             |
| `excel-text`       | `#242424` | Texto principal                                  |
| `excel-muted`      | `#605E5C` | Texto secundario                                 |

`patuju-green`, `patuju-yellow`, `patuju-red`, `patuju-white`, `patuju-cream` y `patuju-card` siguen definidos como alias de los mismos valores; el código nuevo usa `excel-*`.

## Arquitectura del proyecto

### Backend (`app/`)

```
app/
├── Backups/                        # Volcado e importación de MySQL
│   ├── Contrato/Dumper.php         # Interfaz volcar() / importar()
│   ├── CliMySqlDumper.php          # mysqldump + mysql vía proc_open
│   └── FakeDumper.php              # Implementación para tests
├── Console/Commands/
│   ├── BackupsAuto.php             # backups:auto (scheduler)
│   ├── BackupsDiagnostico.php      # backups:diagnostico
│   └── BackupsRecuperar.php        # backups:recuperar
├── Exports/
│   └── TramitesExport.php
├── Http/
│   ├── Controllers/
│   │   ├── Actuaciones/ActuacionController.php
│   │   ├── Areas/AreaController.php
│   │   ├── Auth/AuthController.php
│   │   ├── Backups/
│   │   │   ├── BackupController.php
│   │   │   └── BackupRestauracionController.php
│   │   ├── Configuracion/ConfiguracionController.php
│   │   ├── Contador/ContadorController.php
│   │   ├── Derivaciones/DerivacionController.php
│   │   ├── Personas/PersonaController.php
│   │   ├── Roles/RolController.php
│   │   ├── Tramites/TramiteController.php
│   │   ├── Users/UserController.php
│   │   ├── Controller.php
│   │   ├── DashboardController.php
│   │   ├── ProfileController.php
│   │   └── ReporteController.php
│   ├── Middleware/
│   │   ├── CheckPermission.php     # permission:{modulo}[,{accion}]
│   │   ├── CheckRole.php
│   │   ├── EjecutarBackupVencido.php
│   │   └── HandleInertiaRequests.php
│   ├── Requests/
│   │   ├── Actuaciones/  Areas/  Backups/  Contador/  Derivaciones/
│   │   ├── Personas/  Puestos/  Reportes/  Roles/  Tramites/  Users/
│   │   └── Concerns/ValidaAreasHabilitadas.php
│   └── Resources/                  # Actuacion, Area, Backup, Derivacion,
│                                   # Persona, PersonaPuesto, Puesto, Rol,
│                                   # Tramite, User
├── Models/
│   ├── Accion.php  Actuacion.php  Area.php  Configuracion.php
│   ├── ContadorTramite.php  Derivacion.php  Modulo.php  Permiso.php
│   ├── Persona.php  PersonaPuesto.php  Puesto.php  Reporte.php
│   ├── Reseteo.php  Rol.php  Tramite.php  User.php
│   └── Backup.php  BackupEvento.php
├── Observers/
│   └── TramiteObserver.php
├── Providers/
│   ├── AppServiceProvider.php          # binding Dumper → CliMySqlDumper
│   └── TypeScriptTransformerServiceProvider.php
├── Services/
│   ├── ActuacionService.php  AreaService.php  AuthService.php
│   ├── ConfiguracionService.php  ContadorTramiteService.php
│   ├── DerivacionService.php  PersonaService.php  PuestoService.php
│   ├── ReporteService.php  TramiteService.php  UserService.php
│   ├── BackupService.php                 # crear, retención, pre-restauración, eventos
│   ├── BackupProgramacionService.php     # vencimiento y configuración vigente
│   ├── BackupEspacioService.php          # disco, cuota, proyección, alertas
│   ├── BackupRestauracionService.php     # reemplazo total + rollback
│   └── BackupValidador.php               # archivos importados
└── Support/
    └── BinarioMysql.php                  # autodetección de mysqldump/mysql
```

### Frontend (`resources/js/`)

```
resources/js/
├── components/
│   ├── ui/                        # Presentacionales, sin lógica de negocio
│   │   ├── AlertDialog.tsx  Badge.tsx  Button.tsx  Card.tsx
│   │   ├── CheckboxList.tsx  FilterChip.tsx  Icon.tsx  InfoTooltip.tsx
│   │   ├── Input.tsx  Modal.tsx  Pagination.tsx  SearchableSelect.tsx
│   │   └── Select.tsx  Table.tsx  Toast.tsx
│   ├── layout/
│   │   ├── DashboardLayout.tsx  Header.tsx  Sidebar.tsx
│   └── features/                  # UI + hooks por módulo
│       ├── areas/         AreaFormModal.tsx  PuestoFormModal.tsx
│       ├── backups/       EstadoAlmacenamiento.tsx  FormAutomatizacion.tsx
│       │                  ModalEliminar.tsx  ModalHistorial.tsx
│       │                  ModalRestaurar.tsx  ModalRestaurarArchivo.tsx
│       │                  TablaBackups.tsx  formato.ts
│       ├── derivaciones/  DerivarForm.tsx  DerivarModal.tsx  DestinoDerivacion.tsx
│       ├── personas/      PersonaFormModal.tsx
│       ├── reporte/       RangoCalendario.tsx  ReporteFiltros.tsx
│       │                  ReporteHistorial.tsx  SemanalChart.tsx
│       │                  TramitesPorAreaChart.tsx  TramitesPorUsuarioChart.tsx
│       ├── roles/         RolForm.tsx
│       ├── tramites/      TramiteForm.tsx  TramiteTimeline.tsx
│       └── users/         UserForm.tsx
├── hooks/                         # Consumen services, exponen estado + acciones
│   ├── useAuth.ts  usePermissions.ts  useReporte.ts
│   ├── useBackups.ts  useSidebar.ts  useTheme.tsx
├── services/
│   ├── authService.ts  reporteService.ts  backupService.ts
├── pages/                         # Una página por ruta; solo orquestan
│   ├── Auth/Login.tsx  Dashboard.tsx  Profile/Show.tsx
│   ├── Areas/Index.tsx  Backups/Index.tsx  Configuracion/Index.tsx
│   ├── Contador/Index.tsx  Personas/Index.tsx  Reporte/Index.tsx
│   ├── Roles/  (Index, Create, Edit)
│   ├── Tramites/  (Index, Create, Edit, Show)
│   └── Users/  (Index, Create, Edit, Show)
├── types/
│   ├── generated/                 # Tramite.d.ts, User.d.ts, transformer
│   ├── backups.ts  derivaciones.ts
│   ├── inertia.d.ts  index.d.ts
├── tests/                         # Vitest + React Testing Library
│   ├── Areas/  Backups/  Configuracion/  Derivaciones/  Personas/
│   ├── Reporte/  Tramites/  Users/  layout/  ui/
│   ├── mocks/inertia.tsx
│   └── setup.ts
├── app.tsx                        # Entrada única de Vite
└── app.css                        # Tailwind v4 + tokens de color
```

## Módulo Backups

Documentación funcional completa: [`logica-backup.md`](logica-backup.md).

| Aspecto | Implementación |
|---|---|
| Permiso de módulo | `backups` con acciones `consulta`, `creacion`, `edicion`, `baja`, `descarga`, `restauracion` |
| Rutas | `routes/web.php`, bloque `backups.*` con `permission:backups[,accion]` |
| Disco | `backups` en `config/filesystems.php` → `storage/app/private/backups-{slug}` |
| Slug | `BACKUP_APP_SLUG` (`config/backups.php`), independiente de `APP_NAME` |
| Configuración | `config/backups.php` (binarios, timeouts, tablas sin datos, validaciones) |
| Dump | `mysqldump`/`mysql` por CLI, sin paquetes adicionales |
| Automatización | `backups:auto` cada minuto vía scheduler + middleware `EjecutarBackupVencido` |
| Retención | Máximo configurable (10 por defecto); los `protegido` nunca se borran |
| Restauración | `pre_restauracion` obligatorio, `RESTAURAR` + contraseña, reemplazo total con rollback |
| Auditoría | Tablas `backups` y `backup_eventos`; la bitácora sobrevive a las restauraciones |
| Diagnóstico | `php artisan backups:diagnostico` (código 1 si falla algo) |
| Recuperación | `php artisan backups:recuperar [--limpiar]` |

Detalles que afectan al código:

- La tabla `users` es MyISAM, por eso `backups` y `backup_eventos` **no** llevan FK a `users`.
- `sessions`, `cache`, `jobs`, `personal_access_tokens`, `backups` y `backup_eventos` se respaldan solo como estructura (`tablas_sin_datos`).
- Los binarios se autodetectan (`app/Support/BinarioMysql.php`) y se cachean por proceso; en tests se enlaza `FakeDumper`.
- `Backup::completados()` excluye los fallidos; la retención nunca toca protegidos.

## Convenciones

- **Rutas**: con nombre, prefijo por módulo y middleware `permission:{modulo}[,{accion}]`; el frontend usa `route()` de Ziggy o las URLs de cada service
- **Formularios**: `useForm` de `@inertiajs/react`
- **Estado UI**: props de Inertia + Context API (sin estado global externo)
- **Componentes UI**: propios con Tailwind, 100% presentacionales (sin lógica de negocio)
- **Feature components**: combinan UI components + hooks; las páginas solo orquestan
- **Services (frontend)**: encapsulan llamadas a Inertia (`router.get`, `router.post`, etc.)
- **Hooks**: consumen services y exponen estado + acciones a los componentes
- **Servicios (backend)**: thin controllers, toda la lógica de negocio en `Services/`
- **Modelos**: interfaces TypeScript auto-generadas en `types/generated/`
- **Colores**: tokens `excel-*` de `app.css` (los `patuju-*` son alias)

## Sidebar — Módulos

Cada ítem se muestra solo si el usuario tiene `{modulo}.consulta`.

- **Dashboard** (`/dashboard`)
- **Trámites** (`/tramites`) — listado, filtros, exportación, derivaciones, actuaciones y timeline
- **Personas** (`/personas`) — personas, puestos y cambios de puesto
- **Áreas y Puestos** (`/areas`) — estructura organizacional
- **Reporte** (`/reporte`) — filtros, gráficos, historial y descarga en PDF
- **Configuración** (`/configuracion`) — gestión inicial del reporte y contadores
- **Usuarios** (`/users`) — CRUD y reseteo de contraseñas
- **Roles** (`/roles`) — roles, módulos, acciones y permisos
- **Backups** (`/backups`) — backups manuales, automatización, descarga, restauración y auditoría

## Comandos de trabajo

```bash
php artisan test                 # Pest (suite completa)
npm run test                     # Vitest
npx tsc --noEmit                 # Chequeo de tipos
npm run build                    # Build de producción
php artisan typescript:transform # Regenera types/generated

php artisan backups:diagnostico  # Verifica binarios, BD, disco y backups
php artisan backups:recuperar    # Sale de mantenimiento y limpia interrumpidos
php artisan schedule:list        # Confirma la programación de backups:auto
```
