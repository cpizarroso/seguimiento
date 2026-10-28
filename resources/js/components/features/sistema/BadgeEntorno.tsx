import { Badge } from '@/components/ui/Badge';
import { useSistema } from '@/hooks/useSistema';
import type { BadgeVariant } from '@/types/sistema';

const dotClasses: Record<BadgeVariant, string> = {
    info: 'bg-excel-blue',
    success: 'bg-excel-green',
    warning: 'bg-excel-gold',
    default: 'bg-excel-muted',
};

interface BadgeEntornoProps {
    className?: string;
}

/**
 * Indicador del modo de ejecución (Desarrollo / Producción / Capacitación).
 *
 * Solo es informativo: no cambia el comportamiento de la aplicación.
 */
export function BadgeEntorno({ className = '' }: BadgeEntornoProps) {
    const sistema = useSistema();

    if (!sistema) {
        return null;
    }

    return (
        <Badge
            variant={sistema.variante}
            className={className}
            title={sistema.detalle}
            aria-label={`Modo de la aplicación: ${sistema.etiqueta}`}
        >
            <span
                className={`mr-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotClasses[sistema.variante]}`}
                aria-hidden="true"
            />
            {sistema.etiqueta}
        </Badge>
    );
}
