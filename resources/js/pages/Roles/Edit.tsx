import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface PermisoOption {
    id: number;
    modulo: string;
    modulo_nombre: string;
    accion: string;
    accion_nombre: string;
}

interface RolData {
    id: number;
    nombre: string;
    slug: string;
    descripcion: string | null;
    es_sistema: boolean;
    permiso_ids: number[];
    permisos: { id: number; modulo: string; accion: string }[];
}

interface EditProps {
    rol: RolData;
    permisos_agrupados: Record<string, PermisoOption[]>;
}

const moduloOrder = ['dashboard', 'tramites', 'funcionarios', 'areas_puestos', 'reporte', 'configuracion', 'usuarios', 'roles'];

export default function RolesEdit({ rol, permisos_agrupados }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        nombre: rol.nombre,
        slug: rol.slug,
        descripcion: rol.descripcion ?? '',
        permiso_ids: rol.permiso_ids ?? [],
    });

    const togglePermiso = (id: number) => {
        setData('permiso_ids',
            data.permiso_ids.includes(id)
                ? data.permiso_ids.filter((pid) => pid !== id)
                : [...data.permiso_ids, id],
        );
    };

    const ordenarModulos = (entries: [string, PermisoOption[]][]) =>
        entries.sort(([a], [b]) => moduloOrder.indexOf(a) - moduloOrder.indexOf(b));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/roles/${rol.id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-patuju-green">Editar Rol</h2>
                {rol.es_sistema && <Badge variant="primary">Sistema</Badge>}
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Nombre del Rol"
                            value={data.nombre}
                            onChange={(e) => setData('nombre', e.target.value)}
                            error={errors.nombre}
                        />
                        <Input
                            label="Slug (identificador único)"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            error={errors.slug}
                            disabled={rol.es_sistema}
                        />
                    </div>
                    <Input
                        label="Descripción"
                        value={data.descripcion}
                        onChange={(e) => setData('descripcion', e.target.value)}
                        error={errors.descripcion}
                    />

                    <div>
                        <h3 className="text-lg font-semibold text-patuju-green mb-4">Permisos</h3>
                        <div className="space-y-4">
                            {ordenarModulos(Object.entries(permisos_agrupados)).map(([moduloNombre, permisos]) => (
                                <div key={moduloNombre} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{moduloNombre}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {permisos.map((p) => (
                                            <label
                                                key={p.id}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer border transition-colors ${
                                                    data.permiso_ids.includes(p.id)
                                                        ? 'bg-patuju-green/10 border-patuju-green text-patuju-green'
                                                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-patuju-green'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={data.permiso_ids.includes(p.id)}
                                                    onChange={() => togglePermiso(p.id)}
                                                />
                                                {p.accion_nombre}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors.permiso_ids && (
                            <p className="text-sm text-patuju-red mt-1">{errors.permiso_ids}</p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" loading={processing}>Actualizar</Button>
                        <Button type="button" variant="secondary" onClick={() => window.history.back()}>Cancelar</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
