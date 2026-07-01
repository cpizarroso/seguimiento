<?php

namespace Database\Seeders;

use App\Models\Accion;
use App\Models\Modulo;
use App\Models\Permiso;
use App\Models\Rol;
use Illuminate\Database\Seeder;

class RolesYPermisosSeeder extends Seeder
{
    public function run(): void
    {
        $modulos = [
            ['nombre' => 'Dashboard', 'slug' => 'dashboard', 'orden' => 1],
            ['nombre' => 'Trámites', 'slug' => 'tramites', 'orden' => 2],
            ['nombre' => 'Funcionarios', 'slug' => 'funcionarios', 'orden' => 3],
            ['nombre' => 'Áreas y Puestos', 'slug' => 'areas_puestos', 'orden' => 4],
            ['nombre' => 'Reporte', 'slug' => 'reporte', 'orden' => 5],
            ['nombre' => 'Configuración', 'slug' => 'configuracion', 'orden' => 6],
            ['nombre' => 'Usuarios', 'slug' => 'usuarios', 'orden' => 7],
            ['nombre' => 'Roles', 'slug' => 'roles', 'orden' => 8],
        ];

        foreach ($modulos as $m) {
            Modulo::create($m);
        }

        $acciones = [
            ['nombre' => 'Consulta', 'slug' => 'consulta'],
            ['nombre' => 'Creación', 'slug' => 'creacion'],
            ['nombre' => 'Edición', 'slug' => 'edicion'],
            ['nombre' => 'Baja', 'slug' => 'baja'],
        ];

        foreach ($acciones as $a) {
            Accion::create($a);
        }

        $moduloIds = Modulo::pluck('id', 'slug');
        $accionIds = Accion::pluck('id', 'slug');

        $permisosMatrix = [
            'dashboard' => ['consulta'],
            'tramites' => ['consulta', 'creacion', 'edicion', 'baja'],
            'funcionarios' => ['consulta', 'creacion', 'edicion', 'baja'],
            'areas_puestos' => ['consulta', 'creacion', 'edicion', 'baja'],
            'reporte' => ['consulta'],
            'configuracion' => ['consulta'],
            'usuarios' => ['consulta', 'creacion', 'edicion', 'baja'],
            'roles' => ['consulta', 'creacion', 'edicion', 'baja'],
        ];

        $permisoIds = [];
        foreach ($permisosMatrix as $moduloSlug => $accionesSlugs) {
            foreach ($accionesSlugs as $accionSlug) {
                $permiso = Permiso::create([
                    'modulo_id' => $moduloIds[$moduloSlug],
                    'accion_id' => $accionIds[$accionSlug],
                ]);
                $permisoIds[$moduloSlug][$accionSlug] = $permiso->id;
            }
        }

        $rolesData = [
            'admin' => [
                'nombre' => 'Administrador',
                'descripcion' => 'Acceso total al sistema',
                'es_sistema' => true,
                'permisos' => $permisosMatrix,
            ],
            'secretaria' => [
                'nombre' => 'Secretaria',
                'descripcion' => 'Gestión de trámites',
                'es_sistema' => true,
                'permisos' => [
                    'dashboard' => ['consulta'],
                    'tramites' => ['consulta', 'creacion', 'edicion'],
                    'reporte' => ['consulta'],
                    'configuracion' => ['consulta'],
                ],
            ],
            'jefe' => [
                'nombre' => 'Jefe',
                'descripcion' => 'Consulta de trámites y reportes',
                'es_sistema' => true,
                'permisos' => [
                    'dashboard' => ['consulta'],
                    'tramites' => ['consulta'],
                    'reporte' => ['consulta'],
                ],
            ],
            'user' => [
                'nombre' => 'Usuario',
                'descripcion' => 'Consulta básica de trámites',
                'es_sistema' => true,
                'permisos' => [
                    'dashboard' => ['consulta'],
                    'tramites' => ['consulta'],
                    'reporte' => ['consulta'],
                    'configuracion' => ['consulta'],
                ],
            ],
        ];

        foreach ($rolesData as $slug => $data) {
            $rol = Rol::create([
                'nombre' => $data['nombre'],
                'slug' => $slug,
                'descripcion' => $data['descripcion'],
                'es_sistema' => $data['es_sistema'],
            ]);

            $pIds = [];
            foreach ($data['permisos'] as $moduloSlug => $accionesSlugs) {
                foreach ($accionesSlugs as $accionSlug) {
                    if (isset($permisoIds[$moduloSlug][$accionSlug])) {
                        $pIds[] = $permisoIds[$moduloSlug][$accionSlug];
                    }
                }
            }
            $rol->permisos()->sync($pIds);
        }


    }
}
