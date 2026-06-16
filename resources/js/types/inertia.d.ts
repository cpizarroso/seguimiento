import type { User as UserModel } from './generated/User';

declare module '@inertiajs/react' {
    interface PageProps {
        auth: {
            user: UserModel | null;
        };
        flash?: {
            success?: string;
            error?: string;
        };
        [key: string]: unknown;
    }
}
