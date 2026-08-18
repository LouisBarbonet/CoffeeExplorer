const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// Access tokens expire after 15 min (JWT_ACCESS_EXPIRES_IN) -- easily
// outlived by a single page staying open (e.g. an hour-long recording), so a
// 401 on save is expected, not exceptional. Shared across concurrent 401s so
// they await one refresh rather than each rotating the refresh token and
// invalidating each other's attempt (see backend/src/auth/auth.service.ts).
let refreshPromise: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
    refreshPromise ??= fetch(`${API_BASE_URL}/auth/refresh`, { method: "POST" })
        .then((res) => res.ok)
        .catch(() => false)
        .finally(() => {
            refreshPromise = null;
        });
    return refreshPromise;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    // Omit Content-Type for FormData bodies -- the browser needs to set its own
    // multipart boundary, which we'd otherwise clobber with "application/json".
    const isFormData = init?.body instanceof FormData;

    const doFetch = () =>
        fetch(`${API_BASE_URL}${path}`, {
            ...init,
            headers: {
                ...(isFormData ? {} : { "Content-Type": "application/json" }),
                ...init?.headers,
            },
        });

    let res = await doFetch();

    if (res.status === 401 && !path.startsWith("/auth/")) {
        const refreshed = await refreshAccessToken();
        if (refreshed) res = await doFetch();
    }

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new ApiError(body?.message ?? `Request failed with status ${res.status}`, res.status);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
}
