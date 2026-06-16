# Stack Tecnológico — Seguimiento de Trámites

## Tecnologías principales

| Capa             | Tecnología                                      |
|------------------|--------------------------------------------------|
| Backend          | Laravel 11                                       |
| Frontend         | React 19 + TypeScript (strict)                   |
| Capa híbrida     | Inertia.js (SSR + SPA sin API REST explícita)    |
| CSS              | Tailwind CSS v4                                   |
| Auth             | Laravel Sanctum (SPA con cookies)                |
| Base de datos    | MySQL                                            |
| Build tool       | Vite 6                                           |
| Testing          | Pest (backend) + Vitest + React Testing Library  |
| Tipado compartido | laravel-typescript (auto-generado desde modelos) |

## Paleta de colores — Flor de Patujú

| Color           | Tailwind         | Hex       | Uso                                          |
|-----------------|------------------|-----------|----------------------------------------------|
| Verde Patujú    | `patuju-green`   | `#2D6A4F` | Títulos, botones primarios, sidebar activo   |
| Amarillo Patujú | `patuju-yellow`  | `#F4A100` | Badges "en progreso", acentos                |
| Rojo Patujú     | `patuju-red`     | `#C1121F` | Botones peligro, estados críticos            |
| Blanco base     | `patuju-white`   | `#F8FAFC` | Fondo general                                |
| Card            | `patuju-card`    | `#ECFBE9` | Fondo de tarjetas y paneles   |
| Crema           | `patuju-cream`   | `#FFF8E7` | Acentos secundarios           |

## Arquitectura del proyecto

### Backend (`app/`)

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   │   └── AuthController.php
│   │   ├── DashboardController.php
│   │   ├── Tramites/
│   │   │   ├── TramiteController.php
│   │   │   └── TramiteEstadoController.php
│   │   ├── Funcionarios/
│   │   │   └── FuncionarioController.php
│   │   └── ReporteController.php
│   ├── Requests/
│   │   ├── Tramites/
│   │   │   ├── StoreTramiteRequest.php
│   │   │   └── UpdateTramiteRequest.php
│   │   └── Funcionarios/
│   │       ├── StoreFuncionarioRequest.php
│   │       └── UpdateFuncionarioRequest.php
│   └── Resources/
│       ├── TramiteResource.php
│       └── FuncionarioResource.php
├── Models/
│   ├── User.php
│   ├── Tramite.php
│   └── Funcionario.php
├── Services/
│   ├── TramiteService.php
│   ├── FuncionarioService.php
│   ├── ReporteService.php
│   └── AuthService.php
└── Providers/
    └── AppServiceProvider.php
```

### Frontend (`resources/js/`)

```
resources/js/
├── components/
│   ├── ui/                        # Componentes puramente presentacionales
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Select.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   └── Pagination.tsx
│   ├── layout/                    # Layout + navegación persistente
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SidebarItem.tsx
│   │   └── Header.tsx
│   └── features/                  # Composición de UI + hooks por módulo
│       ├── tramites/
│       │   ├── TramiteForm.tsx
│       │   ├── TramiteTable.tsx
│       │   ├── TramiteFilters.tsx
│       │   └── TramiteTimeline.tsx
│       ├── funcionarios/
│       │   ├── FuncionarioForm.tsx
│       │   └── FuncionarioTable.tsx
│       └── reporte/
│           ├── ReporteFilters.tsx
│           └── ReporteChart.tsx
├── hooks/                         # Lógica reusable (consumen services)
│   ├── useAuth.ts
│   ├── useTramites.ts
│   ├── useFuncionarios.ts
│   └── useSidebar.ts
├── services/                      # Capa de comunicación con Inertia
│   ├── tramiteService.ts
│   ├── funcionarioService.ts
│   ├── reporteService.ts
│   └── authService.ts
├── pages/                         # Páginas Inertia (una por ruta)
│   ├── Auth/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── Dashboard.tsx
│   ├── Tramites/
│   │   ├── Index.tsx
│   │   ├── Create.tsx
│   │   └── Show.tsx
│   ├── Funcionarios/
│   │   ├── Index.tsx
│   │   ├── Create.tsx
│   │   └── Show.tsx
│   └── Reporte/
│       └── Index.tsx
├── types/
│   ├── generated/                 # Interfaces auto-generadas (laravel-typescript)
│   │   ├── Tramite.d.ts
│   │   ├── Funcionario.d.ts
│   │   └── User.d.ts
│   ├── inertia.d.ts
│   └── index.d.ts
├── app.tsx
├── app.css
└── ssr.tsx
```

## Convenciones

- **Rutas**: versionadas con Ziggy (`route()` en JS desde el frontend)
- **Formularios**: `useForm` de `@inertiajs/react`
- **Estado UI**: props de Inertia + Context API (sin estado global externo)
- **Componentes UI**: propios con Tailwind, 100% presentacionales (sin lógica de negocio)
- **Feature components**: combinan UI components + hooks; las páginas solo orquestan
- **Services (frontend)**: encapsulan llamadas a Inertia (`router.get`, `router.post`, etc.)
- **Hooks**: consumen services y exponen estado + acciones a los componentes
- **Servicios (backend)**: thin controllers, toda la lógica de negocio en `Services/`
- **Modelos**: interfaces TypeScript auto-generadas en `types/generated/`
- **Paleta**: colores personalizados Patujú en `tailwind.config.js`

## Sidebar — Módulos

- **Trámites** (`/tramites`) — CRUD de trámites, filtros, timeline de estados
- **Funcionarios** (`/funcionarios`) — CRUD de funcionarios
- **Reporte** (`/reporte`) — Vista de reportes con filtros y gráficos
