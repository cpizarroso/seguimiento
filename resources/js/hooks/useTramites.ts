import { usePage } from '@inertiajs/react';
import type { Tramite } from '@/types/generated/Tramite';
import { tramiteService } from '@/services/tramiteService';

export function useTramites() {
    const { tramites, filters } = usePage().props as unknown as {
        tramites: { data: Tramite[]; current_page: number; last_page: number };
        filters: { search?: string; estado?: string; funcionario_id?: string };
    };

    return {
        tramites: tramites.data,
        paginator: {
            currentPage: tramites.current_page,
            lastPage: tramites.last_page,
        },
        filters,
        setFilters: (newFilters: typeof filters) => tramiteService.list(newFilters),
        create: (data: Record<string, unknown>) => tramiteService.store(data),
        remove: (id: number) => tramiteService.destroy(id),
    };
}
