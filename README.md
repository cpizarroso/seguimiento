# Seguimiento de Trámites

Aplicación web para el seguimiento de trámites documentales, construida con un stack moderno Laravel + React.

## Tech Stack

| Capa             | Tecnología                                    |
|------------------|-----------------------------------------------|
| Backend          | Laravel 11 (PHP 8.3+)                         |
| Frontend         | React 19 + TypeScript (strict)                |
| Capa híbrida     | Inertia.js (SSR + SPA)                        |
| CSS              | Tailwind CSS v4                               |
| Auth             | Laravel Sanctum (SPA con cookies)             |
| Base de datos    | MySQL                                         |
| Build tool       | Vite 6                                        |
| Testing          | Pest (backend) + Vitest + React Testing Lib   |

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

## Seeders disponibles

```bash
php artisan db:seed --class=PuestoSeeder      # 8 puestos/departamentos
php artisan db:seed --class=FuncionarioSeeder  # 15 funcionarios
php artisan db:seed --class=TramiteSeeder      # 42 trámites con 94 derivaciones
php artisan migrate:fresh --seed               # Reset completo + seed
```

### Usuarios de prueba

| Rol      | Email                          | Contraseña      |
|----------|--------------------------------|-----------------|
| Admin    | admin@seguimiento.gob.bo       | admin123        |
| Funcionario | hsalinas@ejemplo.gob.bo    | funcionario123  |
| Funcionario | sorozco@ejemplo.gob.bo    | funcionario123  |

## Paleta de colores — Flor de Patujú

| Color           | Hex       | Uso                                        |
|-----------------|-----------|--------------------------------------------|
| Verde Patujú    | `#2D6A4F` | Títulos, botones primarios, sidebar activo |
| Amarillo Patujú | `#F4A100` | Badges "en progreso", acentos              |
| Rojo Patujú     | `#C1121F` | Botones peligro, estados críticos          |
| Blanco base     | `#F8FAFC` | Fondo general                              |
| Card            | `#ECFBE9` | Fondo de tarjetas y paneles                |
| Crema           | `#FFF8E7` | Acentos secundarios                        |

## Licencia

MIT
