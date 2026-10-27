# Seguimiento de Trámites

Aplicación web para el seguimiento de trámites documentales, construida con un stack Laravel + React mediante Inertia.

## Tech Stack

| Capa             | Tecnología                                          |
|------------------|-----------------------------------------------------|
| Backend          | Laravel 13 (PHP 8.3+)                               |
| Frontend         | React 19 + TypeScript 6 (strict)                    |
| Capa híbrida     | Inertia.js v3 (SPA sin SSR)                         |
| CSS              | Tailwind CSS v4                                     |
| Auth             | Laravel Sanctum (SPA con cookies) + RBAC propio     |
| Base de datos    | MySQL 8                                              |
| Build tool       | Vite 8                                               |
| Testing          | Pest 4 (backend) + Vitest 4 + React Testing Library  |
| Gráficos         | Recharts 3                                           |
| Documentos       | DomPDF (PDF) + Laravel Excel (XLSX)                  |

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/cpizarroso/seguimiento.git
cd seguimiento

# Instalar dependencias PHP
composer install

# Instalar dependencias JS
npm install

# Configurar entorno
cp .env.example .env
php artisan key:generate

# Configurar base de datos en .env y luego:
php artisan migrate --seed

# Compilar assets
npm run build

# Iniciar servidor de desarrollo
php artisan serve
```

Los backups requieren los binarios de MySQL (`mysqldump` y `mysql`). Se autodetectan desde `PATH` o desde las rutas candidatas de `config/backups.php`; también se pueden fijar con `BACKUP_MYSQLDUMP_PATH` y `BACKUP_MYSQL_PATH`.

## Módulos

- **Dashboard** (`/dashboard`)
- **Trámites** (`/tramites`) — listado, filtros, exportación, derivaciones, actuaciones y timeline
- **Personas** (`/personas`)
- **Áreas y Puestos** (`/areas`)
- **Reporte** (`/reporte`) — filtros, gráficos, historial y descarga en PDF
- **Configuración** (`/configuracion`)
- **Usuarios** (`/users`)
- **Roles** (`/roles`)
- **Backups** (`/backups`) — copias manuales y automáticas, descarga, restauración y auditoría (ver [`logica-backup.md`](logica-backup.md))

Cada ítem del sidebar aparece solo si el usuario tiene el permiso `{modulo}.consulta`.

## Seeders disponibles

```bash
php artisan db:seed                            # DatabaseSeeder: limpia y repuebla todo
php artisan db:seed --class=RolesYPermisosSeeder    # módulos, acciones, permisos y roles
php artisan db:seed --class=PermisosBackupsSeeder   # permisos del módulo backups
php artisan db:seed --class=TramiteSeeder           # trámites con derivaciones (requiere usuarios y áreas)
php artisan migrate:fresh --seed               # Reset completo + seed
```

`DatabaseSeeder` **limpia** las tablas de negocio antes de sembrar, incluidas `backups` y `backup_eventos`.

### Usuarios de prueba

| Rol          | Email                        | Contraseña |
|--------------|------------------------------|------------|
| Admin        | admin@seguimiento.gob.bo     | password   |
| Admin        | amontoya@seguimiento.gob.bo  | password   |
| Admin        | cpizarroso@seguimiento.gob.bo| password   |
| Secretaría   | erodriguez@seguimiento.gob.bo| password   |

El resto de usuarios se crea con `User::factory()`, también con contraseña `password`.

## Paleta de colores

Tokens definidos en `resources/js/app.css`:

| Token              | Hex       | Uso                                        |
|--------------------|-----------|--------------------------------------------|
| `excel-green`      | `#107C41` | Títulos, botones primarios, sidebar activo |
| `excel-gold`       | `#F2C811` | Badges "en proceso", acentos               |
| `excel-red`        | `#C42B1C` | Botones peligro, estados críticos          |
| `excel-blue`       | `#0078D4` | Enlaces y avisos informativos              |
| `excel-bg`         | `#F3F2F1` | Fondo general                              |
| `excel-surface`    | `#FFFFFF` | Tarjetas y paneles                         |
| `excel-surface-2`  | `#FAF9F8` | Filas alternas                             |
| `excel-border`     | `#E1DFDD` | Bordes y separadores                       |
| `excel-text`       | `#242424` | Texto principal                            |
| `excel-muted`      | `#605E5C` | Texto secundario                           |

Los nombres `patuju-*` siguen disponibles como alias de los mismos valores.

## Verificación

```bash
php artisan test      # Pest
npm run test          # Vitest
npx tsc --noEmit      # tipos
npm run build         # build de producción

php artisan backups:diagnostico   # binarios, BD, disco y backups
php artisan schedule:list         # programación de backups:auto
```

## Licencia

MIT
