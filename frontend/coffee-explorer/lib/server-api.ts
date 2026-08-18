import "server-only";
import { cookies } from "next/headers";

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL ?? "http://backend:4000";

export interface CurrentUser {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
}

/** Fetches from the backend directly (container-to-container), forwarding the incoming request's cookies. */
export async function serverFetch(path: string, init?: RequestInit): Promise<Response> {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    return fetch(`${BACKEND_INTERNAL_URL}/api${path}`, {
        ...init,
        headers: {
            ...init?.headers,
            cookie: cookieHeader,
        },
        cache: "no-store",
    });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
    const res = await serverFetch("/users/me");
    if (!res.ok) return null;
    return res.json();
}