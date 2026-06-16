import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ThemeProvider } from './hooks/useTheme';
import type { ComponentType } from 'react';
import './app.css';

const appName = import.meta.env.VITE_APP_NAME || 'Seguimiento de Trámites';

createInertiaApp({
    title: (title) => `${title} — ${appName}`,
    resolve: async (name) => {
        const page = await resolvePageComponent<{
            default: ComponentType<Record<string, unknown>>;
            layout?: ComponentType<Record<string, unknown>>;
        }>(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        );

        const authPages = ['Auth/Login', 'Auth/Register'];

        if (!authPages.includes(name)) {
            page.default.layout = page.default.layout || DashboardLayout;
        }

        return page;
    },
    setup({ el, App, props }) {
        const app = (
            <ThemeProvider>
                <App {...props} />
            </ThemeProvider>
        );
        if (import.meta.env.SSR) {
            hydrateRoot(el, app);
        } else {
            createRoot(el).render(app);
        }
    },
    progress: {
        color: '#2D6A4F',
    },
});
