/**
 * Reglas de generación de contraseñas para el reseteo administrativo.
 * Son funciones puras para poder probarlas sin montar el modal.
 */

export const CLAVE_CLASICA = '1234567';

export const SIMBOLOS_PASSWORD = '!@#$%&*-_?';

export const MINIMO_PASSWORD = 5;

export type OpcionContrasena = 'aleatoria' | 'clasica' | 'ci' | 'nombre';

/**
 * Deja solo letras y números, sin tildes ni espacios.
 */
function normalizarTexto(valor: string): string {
    return valor
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '');
}

export function sugerenciaClasica(): string {
    return CLAVE_CLASICA;
}

/**
 * La cédula tal cual la registra la persona (sin recortar símbolos).
 */
export function sugerenciaCi(ci: string | null | undefined): string | null {
    const limpio = (ci ?? '').trim();

    return limpio === '' ? null : limpio;
}

/**
 * Inicial de los nombres + primer apellido + año actual con dos dígitos.
 * Ej.: Lucía Fernández Gómez (2026) => LFernandez26
 */
export function sugerenciaNombre(
    nombres: string | null | undefined,
    apellidos: string | null | undefined,
    year: number = new Date().getFullYear(),
): string | null {
    const inicial = normalizarTexto(nombres ?? '').charAt(0).toUpperCase();
    const primerApellido = normalizarTexto((apellidos ?? '').trim().split(/\s+/)[0] ?? '');

    if (inicial === '' || primerApellido === '') {
        return null;
    }

    const apellido = primerApellido.charAt(0).toUpperCase() + primerApellido.slice(1).toLowerCase();

    return `${inicial}${apellido}${String(year).slice(-2)}`;
}

/**
 * Letra mayúscula + 5 números aleatorios + símbolo aleatorio.
 * Ej.: X48213!
 */
export function generarPassword(): string {
    const letra = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const digitos = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join('');
    const simbolo = SIMBOLOS_PASSWORD.charAt(Math.floor(Math.random() * SIMBOLOS_PASSWORD.length));

    return `${letra}${digitos}${simbolo}`;
}

/**
 * Indica si el valor tiene la forma de una contraseña aleatoria generada
 * (mayúscula + 5 dígitos + símbolo). Sirve para preseleccionar la sugerencia.
 */
export function esPasswordAleatoria(valor: string): boolean {
    if (valor.length !== 7) {
        return false;
    }

    return /^[A-Z]\d{5}$/.test(valor.slice(0, 6)) && SIMBOLOS_PASSWORD.includes(valor.charAt(6));
}

export interface DatosReporteAcceso {
    nombre: string;
    cargo: string | null;
    area: string | null;
    username: string;
}

/**
 * Reporte en texto plano para entregar al usuario.
 */
export function construirReporteAcceso(datos: DatosReporteAcceso, password: string): string {
    return [
        'ACCESO AL SISTEMA DE SEGUIMIENTO',
        '----------------------------------------',
        `Nombre completo: ${datos.nombre}`,
        `Cargo: ${datos.cargo ?? '—'}`,
        `Área: ${datos.area ?? '—'}`,
        `Usuario: @${datos.username}`,
        `Contraseña: ${password}`,
        '',
        'Se recomienda actualizar la contraseña después de iniciar sesión.',
    ].join('\n');
}
