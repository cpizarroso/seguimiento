import { useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

interface AreaOption {
    id: number;
    nombre: string;
    sigla: string;
}

interface PuestoOption {
    id: number;
    nombre: string;
    sigla: string;
    area_id: number;
}

interface RolPermiso {
    id: number;
    modulo: string;
    accion: string;
}

interface RolOption {
    id: number;
    nombre: string;
    slug: string;
    descripcion: string | null;
    es_sistema: boolean;
    permiso_ids: number[];
    permisos: RolPermiso[];
}

interface CreateProps {
    areas: { data: AreaOption[] };
    puestos: { data: PuestoOption[] };
    roles: { data: RolOption[] };
}

const accionLabels: Record<string, string> = {
    consulta: 'Consulta', creacion: 'Creación', edicion: 'Edición', baja: 'Baja',
};

const EMAIL_DOMAIN = '@seguimiento.gob.bo';

export default function UsersCreate({ areas, puestos, roles }: CreateProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [emailLocal, setEmailLocal] = useState('');
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        profesion: '',
        password: '',
        role_ids: [] as number[],
        area_id: '',
        puesto_id: '',
    });

    const toggleRole = (id: number) => {
        setData('role_ids',
            data.role_ids.includes(id)
                ? data.role_ids.filter((rid) => rid !== id)
                : [...data.role_ids, id],
        );
    };

    const generarPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let pwd = '';
        for (let i = 0; i < 8; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setData('password', pwd);
    };

    const puestosFiltrados = useMemo(
        () => (data.area_id ? puestos.data.filter((p) => p.area_id === Number(data.area_id)) : []),
        [data.area_id, puestos.data],
    );

    const handleEmailChange = (value: string) => {
        setEmailLocal(value);
        setData('email', value + EMAIL_DOMAIN);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (emailLocal) {
            setData('email', emailLocal + EMAIL_DOMAIN);
        }
        post('/users');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green">Nuevo Usuario</h2>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Nombre Completo"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                        />
                        <Input
                            label="Email"
                            type="text"
                            value={emailLocal}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            error={errors.email}
                            append={EMAIL_DOMAIN}
                            placeholder="usuario"
                        />
                        <Input
                            label="Teléfono"
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            error={errors.phone}
                        />
                        <Input
                            label="Profesión"
                            value={data.profesion}
                            onChange={(e) => setData('profesion', e.target.value)}
                            error={errors.profesion}
                        />
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-patuju-green mb-2">Roles</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {roles.data.map((rol) => (
                                    <label
                                        key={rol.id}
                                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                            data.role_ids.includes(rol.id)
                                                ? 'border-patuju-green bg-patuju-green/5'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-patuju-green'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <input
                                                type="checkbox"
                                                className="accent-patuju-green"
                                                checked={data.role_ids.includes(rol.id)}
                                                onChange={() => toggleRole(rol.id)}
                                            />
                                            <span className="font-medium text-sm">{rol.nombre}</span>
                                        </div>
                                        <div className="ml-6 flex flex-wrap gap-1">
                                            {rol.permisos.map((p) => (
                                                <span key={p.id} className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                    {p.modulo}.{accionLabels[p.accion] ?? p.accion}
                                                </span>
                                            ))}
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {errors.role_ids && (
                                <p className="text-sm text-patuju-red mt-1">{errors.role_ids}</p>
                            )}
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="block text-sm font-medium text-patuju-green mb-1">Contraseña</label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        error={errors.password}
                                        rightElement={
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                    </svg>
                                                )}
                                            </button>
                                        }
                                    />
                                </div>
                                <Button type="button" variant="secondary" onClick={generarPassword} className="whitespace-nowrap shrink-0">
                                    Generar
                                </Button>
                            </div>
                        </div>
                        <Select
                            label="Área"
                            options={[
                                { value: '', label: 'Seleccionar área' },
                                ...areas.data.map((a) => ({ value: String(a.id), label: `${a.nombre} (${a.sigla})` })),
                            ]}
                            value={data.area_id}
                            onChange={(e) => {
                                setData('area_id', e.target.value);
                                setData('puesto_id', '');
                            }}
                            error={errors.area_id}
                        />
                        <Select
                            label="Puesto"
                            options={[
                                { value: '', label: puestosFiltrados.length ? 'Seleccionar puesto' : 'Seleccione un área primero' },
                                ...puestosFiltrados.map((p) => ({ value: String(p.id), label: `${p.nombre} (${p.sigla})` })),
                            ]}
                            value={data.puesto_id}
                            onChange={(e) => setData('puesto_id', e.target.value)}
                            error={errors.puesto_id}
                            disabled={!data.area_id}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" loading={processing}>Guardar</Button>
                        <Button type="button" variant="secondary" onClick={() => window.history.back()}>Cancelar</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
