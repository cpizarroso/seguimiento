import { useState, type FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
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
                                <h2 className="text-xl font-semibold text-excel-text dark:text-gray-100">Iniciar sesión</h2>
                                <p className="mt-1 text-xs text-excel-muted dark:text-gray-400">
                                    Ingresa tus credenciales para continuar.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    label="Email o Usuario"
                                    type="text"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                    autoFocus
                                    placeholder="usuario@institucion.gob.bo"
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
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                </svg>
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
