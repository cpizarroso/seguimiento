import { useState, useCallback, useRef, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toast } from '@/components/ui/Toast';
import type { ReactNode } from 'react';

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { props } = usePage();
    const flash = props.flash as { success?: string; error?: string } | undefined;

    const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string } | null>(null);
    const prevFlash = useRef(flash);

    const closeToast = useCallback(() => setToast(null), []);

    useEffect(() => {
        if (flash && flash !== prevFlash.current) {
            if (flash.success && flash.success !== prevFlash.current?.success) {
                setToast({ type: 'success', title: flash.success });
            } else if (flash.error && flash.error !== prevFlash.current?.error) {
                setToast({ type: 'error', title: flash.error });
            }
            prevFlash.current = flash;
        }
    }, [flash]);

    return (
        <div className="flex h-screen bg-patuju-white dark:bg-gray-900">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            />

            <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out ${
                sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
            }`}>
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {children}
                </main>
            </div>

            {toast && (
                <Toast
                    type={toast.type}
                    title={toast.title}
                    onClose={closeToast}
                />
            )}
        </div>
    );
}


