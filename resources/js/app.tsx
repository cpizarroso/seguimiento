import { createInertiaApp } from '@inertiajs/react';
import type { ResolvedComponent } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ThemeProvider } from './hooks/useTheme';
import './app.css';

const appName = import.meta.env.VITE_APP_NAME || 'Seguimiento de Trámites';

const pages = import.meta.glob<{ default: ResolvedComponent }>('./pages/**/*.tsx');

createInertiaApp({
    title: (title) => `${title} — ${appName}`,
    resolve: async (name) => {
        const page = await resolvePageComponent<{ default: ResolvedComponent }>(
            `./pages/${name}.tsx`,
            pages,
        );

        const component = page.default;
        const authPages = ['Auth/Login', 'Auth/Register'];

        if (!authPages.includes(name)) {
            component.layout = component.layout || DashboardLayout;
        }

        return component;
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
        color: '#107C41',
    },
});
