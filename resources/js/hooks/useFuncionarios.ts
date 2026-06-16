import { usePage } from '@inertiajs/react';
import type { Funcionario } from '@/types/generated/Funcionario';
import { funcionarioService } from '@/services/funcionarioService';

export function useFuncionarios() {
    const { funcionarios } = usePage().props as unknown as {
        funcionarios: { data: Funcionario[]; current_page: number; last_page: number };
    };

    return {
        funcionarios: funcionarios.data,
        paginator: {
            currentPage: funcionarios.current_page,
            lastPage: funcionarios.last_page,
        },
        create: (data: Record<string, unknown>) => funcionarioService.store(data),
        remove: (id: number) => funcionarioService.destroy(id),
    };
}
