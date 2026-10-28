export type BadgeVariant = 'default' | 'success' | 'warning' | 'info';

export type ModoSistema = 'dev' | 'prod' | 'capacitacion';

export interface SistemaInfo {
    modo: ModoSistema;
    entorno: string;
    etiqueta: string;
    variante: BadgeVariant;
    nota: string | null;
}
