import { usePage } from '@inertiajs/react';
import type { Area } from '@/types/generated/Tramite';
import { areaService } from '@/services/areaService';

export function useAreas() {
    const { areas } = usePage().props as unknown as {
        areas: { data: Area[]; current_page: number; last_page: number };
    };

    return {
        areas: areas.data,
        paginator: {
            currentPage: areas.current_page,
            lastPage: areas.last_page,
        },
        create: (data: Record<string, unknown>) => areaService.store(data),
        remove: (id: number) => areaService.destroy(id),
    };
}
