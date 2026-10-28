import { useId, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { RadioCardGroup, type RadioCardOption } from '@/components/ui/RadioCardGroup';
import {
    MINIMO_PASSWORD,
    esPasswordAleatoria,
    generarPassword,
    sugerenciaCi,
    sugerenciaClasica,
    sugerenciaNombre,
    type OpcionContrasena,
} from './passwordReset';

interface SugerenciasContrasenaProps {
    value: string;
    onChange: (valor: string) => void;
    nombres?: string | null;
    apellidos?: string | null;
    ci?: string | null;
    error?: string;
    label?: string;
    labelAdornment?: ReactNode;
    required?: boolean;
    /** En edición no se preseleccionan sugerencias para no cambiar la clave. */
    mostrarSugerencias?: boolean;
}

function opcionDeValor(
    valor: string,
    valores: Record<OpcionContrasena, string | null>,
): OpcionContrasena | null {
    if (valor === '') {
        return null;
    }

    if (esPasswordAleatoria(valor)) {
        return 'aleatoria';
    }

    if (valor === valores.clasica) {
        return 'clasica';
    }

    if (valores.ci !== null && valor === valores.ci) {
        return 'ci';
    }

    if (valores.nombre !== null && valor === valores.nombre) {
        return 'nombre';
    }

    return null;
}

/**
 * Campo de contraseña con las sugerencias administrativas (aleatoria, clásica,
 * CI y nombre + año). Se reutiliza al crear usuarios y al resetear contraseñas.
 */
export function SugerenciasContrasena({
    value,
    onChange,
    nombres,
    apellidos,
    ci,
    error,
    label = 'Contraseña',
    labelAdornment,
    required = false,
    mostrarSugerencias = true,
}: SugerenciasContrasenaProps) {
    const grupo = useId();
    const [ver, setVer] = useState(false);
    const [aleatoria, setAleatoria] = useState(() => (esPasswordAleatoria(value) ? value : generarPassword()));

    const clasica = sugerenciaClasica();
    const cedula = sugerenciaCi(ci);
    const nombre = sugerenciaNombre(nombres, apellidos);

    const valores: Record<OpcionContrasena, string | null> = {
        aleatoria,
        clasica,
        ci: cedula,
        nombre,
    };

    const [opcion, setOpcion] = useState<OpcionContrasena | null>(() => opcionDeValor(value, valores));

    const opciones: RadioCardOption[] = [
        {
            value: 'aleatoria',
            label: 'Aleatoria',
            description: 'Letra mayúscula + 5 números + símbolo',
            preview: aleatoria,
        },
        {
            value: 'clasica',
            label: 'Clásica (1 al 7)',
            description: 'Secuencia numérica simple',
            preview: clasica,
        },
        {
            value: 'ci',
            label: 'Cédula de identidad',
            description: 'CI de la persona vinculada',
            preview: cedula ?? 'Sin CI',
            disabled: cedula === null || cedula.length < MINIMO_PASSWORD,
            disabledReason: cedula === null
                ? 'La persona no tiene CI registrada.'
                : `La CI debe tener al menos ${MINIMO_PASSWORD} caracteres.`,
        },
        {
            value: 'nombre',
            label: 'Nombre + año',
            description: 'Inicial del nombre + primer apellido + año',
            preview: nombre ?? 'Sin datos',
            disabled: nombre === null || nombre.length < MINIMO_PASSWORD,
            disabledReason: 'La persona no tiene nombres y apellidos registrados.',
        },
    ];

    const elegir = (seleccion: string) => {
        const elegida = seleccion as OpcionContrasena;
        const nueva = valores[elegida];

        if (!nueva) {
            return;
        }

        setOpcion(elegida);
        onChange(nueva);
    };

    const regenerar = () => {
        const nueva = generarPassword();

        setAleatoria(nueva);
        setOpcion('aleatoria');
        onChange(nueva);
    };

    const escribir = (valor: string) => {
        setOpcion(null);
        onChange(valor);
    };

    return (
        <div className="space-y-4">
            {mostrarSugerencias && (
                <RadioCardGroup
                    name={`sugerencia-contrasena-${grupo}`}
                    label="Sugerencias"
                    options={opciones}
                    value={opcion}
                    onChange={elegir}
                />
            )}

            <Input
                label={label}
                labelAdornment={labelAdornment}
                type={ver ? 'text' : 'password'}
                value={value}
                onChange={(evento) => escribir(evento.target.value)}
                error={error}
                required={required}
                autoComplete="new-password"
                rightPaddingClassName="pr-16"
                rightElement={
                    <div className="flex items-center gap-0.5">
                        <button
                            type="button"
                            onClick={regenerar}
                            className="inline-flex h-6 w-6 items-center justify-center rounded text-excel-muted transition-colors hover:bg-excel-surface-2 hover:text-excel-text focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            tabIndex={-1}
                            title="Generar contraseña aleatoria"
                            aria-label="Generar contraseña aleatoria"
                        >
                            <Icon name="refresh" size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setVer(!ver)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded text-excel-muted transition-colors hover:bg-excel-surface-2 hover:text-excel-text focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            tabIndex={-1}
                            title={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            <Icon name={ver ? 'eye-off' : 'eye'} size={16} strokeWidth={1.5} />
                        </button>
                    </div>
                }
            />
        </div>
    );
}
