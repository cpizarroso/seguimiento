# AGENTS.md — Seguimiento de Trámites

## Descripción del proyecto

Aplicación web para el seguimiento de trámites. Construida con:

- **Backend**: Laravel 11 (PHP 8.3+)
- **Frontend**: React 19 + TypeScript strict
- **Capa híbrida**: Inertia.js (SSR + SPA)
- **CSS**: Tailwind CSS v4 con paleta Patujú
- **Auth**: Laravel Sanctum (SPA con cookies)
- **BD**: MySQL
- **Build**: Vite 6
- **Testing**: Pest (backend) + Vitest + React Testing Library (frontend)
- **Tipado**: laravel-typescript (auto-generado desde modelos)

## Convenciones de código

### Backend (Laravel)
- Controllers delgados; toda la lógica de negocio en `app/Services/`
- Usar Form Requests para validación (`app/Http/Requests/`)
- Usar API Resources para transformación de respuestas
- Nombrado: `TramiteController`, `TramiteService`, `StoreTramiteRequest`
- Rutas definidas con nombre y versionadas con Ziggy
- Usar Pest para tests, no PHPUnit

### Frontend (React + TypeScript)
- TypeScript strict mode — evitar `any`
- Componentes UI 100% presentacionales (en `components/ui/`)
- Feature components combinan UI components + hooks (en `components/features/`)
- Hooks consumen services (en `hooks/`) y exponen estado + acciones
- Services encapsulan llamadas a Inertia (en `services/`)
- Páginas Inertia en `pages/` solo orquestan, no contienen lógica
- Formularios con `useForm` de `@inertiajs/react`
- Estado UI: props de Inertia + Context API (sin Redux ni Zustand)
- Tests con Vitest + React Testing Library

### Paleta Patujú
- `patuju-green` `#2D6A4F` — Títulos, botones primarios, sidebar activo
- `patuju-yellow` `#F4A100` — Badges "en progreso", acentos
- `patuju-red` `#C1121F` — Botones peligro, estados críticos
- `patuju-white` `#F8FAFC` — Fondo general
- `patuju-cream` `#FFF8E7` — Fondo de tarjetas y paneles

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

## Seeders disponibles

- `php artisan db:seed --class=PuestoSeeder` — 8 puestos/departamentos
- `php artisan db:seed --class=FuncionarioSeeder` — 15 funcionarios
- `php artisan db:seed --class=TramiteSeeder` — 42 trámites con 94 derivaciones
- `php artisan db:seed` — todo lo anterior + usuario admin
- `php artisan migrate:fresh --seed` — reset completo + seed

### Usuarios
- Admin: `admin@seguimiento.gob.bo` / `admin123` (vinculado a Carlos Mendoza)
- Cada funcionario tiene un usuario con su mismo email y pass `funcionario123`
  - Ej: `hsalinas@ejemplo.gob.bo` / `funcionario123` (Hugo Salinas)
  - Ej: `sorozco@ejemplo.gob.bo` / `funcionario123` (Sofía Orozco)

### Estados de trámites
- `iniciado` — creado en el sistema, sin derivaciones
- `proceso` — derivado a un funcionario para su tramitación
- `observado` — pausado por el funcionario actual
- `finalizado` — concluido, no admite más derivaciones

### Estructura de derivaciones
Cada trámite tiene entre 1 y 6 derivaciones registradas en la tabla `derivaciones`, con seguimiento de origen/destino, glosas y recepciones.
