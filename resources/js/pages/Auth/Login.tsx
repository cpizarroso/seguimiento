import { useState, type FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { BadgeEntorno } from '@/components/features/sistema/BadgeEntorno';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { useSistema } from '@/hooks/useSistema';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const sistema = useSistema();
    const { data, setData, post, processing, errors } = useForm({
        login: '',
        password: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen bg-excel-bg dark:bg-gray-950">
            <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
                <section className="relative hidden overflow-hidden bg-excel-green p-10 text-white lg:flex lg:flex-col lg:justify-between">
                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
                    <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-black/10" />

                    <div className="relative">
                        <div className="flex items-center gap-3">
                            <img
                                src="/favicon/android-chrome-192x192.png"
                                alt="Seguimiento de Trámites"
                                className="h-11 w-11 rounded-lg bg-white p-1 shadow-sm"
                            />
                            <div className="leading-tight">
                                <p className="text-sm font-semibold">Seguimiento</p>
                                <p className="text-xs text-white/75">Gestión de trámites</p>
                            </div>
                        </div>

                        <h1 className="mt-14 max-w-md text-3xl font-semibold leading-tight">
                            Control claro y ordenado de cada trámite.
                        </h1>
                        <p className="mt-4 max-w-md text-sm leading-6 text-white/80">
                            Consulta, registra y da seguimiento a los trámites de tu institución desde un solo lugar.
                        </p>

                        <div className="mt-8 space-y-3">
                            {[
                                { icon: 'document' as const, text: 'Registro y numeración por área' },
                                { icon: 'people' as const, text: 'Seguimiento de responsables y derivaciones' },
                                { icon: 'chart' as const, text: 'Reportes y control de estados' },
                            ].map((item) => (
                                <div key={item.text} className="flex items-center gap-3 text-sm text-white/90">
                                    <span className="flex h-7 w-7 items-center justify-center rounded bg-white/15">
                                        <Icon name={item.icon} size={15} />
                                    </span>
                                    {item.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="relative text-xs text-white/60">
                        © {new Date().getFullYear()} Sistema de Seguimiento de Trámites
                    </p>
                </section>

                <section className="flex items-center justify-center p-5 sm:p-8">
                    <div className="w-full max-w-sm">
                        <div className="mb-6 flex items-center gap-3 lg:hidden">
                            <img
                                src="/favicon/android-chrome-192x192.png"
                                alt="Seguimiento de Trámites"
                                className="h-10 w-10 rounded-lg"
                            />
                            <div className="leading-tight">
                                <p className="text-sm font-semibold text-excel-text dark:text-gray-100">Seguimiento</p>
                                <p className="text-xs text-excel-muted dark:text-gray-400">Gestión de trámites</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-excel-border bg-excel-surface p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                            <div className="mb-5">
                                <div className="mb-3">
                                    <BadgeEntorno />
                                </div>
                                <h2 className="text-xl font-semibold text-excel-text dark:text-gray-100">Iniciar sesión</h2>
                                <p className="mt-1 text-xs text-excel-muted dark:text-gray-400">
                                    Ingresa tus credenciales para continuar.
                                </p>
                                {sistema?.nota && (
                                    <p className="mt-3 rounded border border-excel-gold/40 bg-[#fff8d6] px-2.5 py-2 text-[11px] leading-5 text-[#8a6700] dark:border-excel-gold/30 dark:bg-excel-gold/10 dark:text-excel-gold">
                                        {sistema.nota}
                                    </p>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    label="Email o Usuario"
                                    type="text"
                                    value={data.login}
                                    onChange={(e) => setData('login', e.target.value)}
                                    error={errors.login}
                                    autoFocus
                                    placeholder="usuario o correo@institucion.gob.bo"
                                />
                                <Input
                                    label="Contraseña"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                    placeholder="••••••••"
                                    rightElement={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-excel-muted transition-colors hover:text-excel-text focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
                                            tabIndex={-1}
                                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        >
                                            {showPassword ? (
                                                <Icon name="eye-off" size={16} strokeWidth={1.5} />
                                            ) : (
                                                <Icon name="eye" size={16} strokeWidth={1.5} />
                                            )}
                                        </button>
                                    }
                                />
                                <Button type="submit" loading={processing} className="w-full" size="lg">
                                    Iniciar sesión
                                </Button>
                            </form>
                        </div>

                        <p className="mt-4 text-center text-[11px] text-excel-muted dark:text-gray-500">
                            Acceso restringido a personal autorizado.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
