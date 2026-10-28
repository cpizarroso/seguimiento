export interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    persona_id: number;
    activo: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}
