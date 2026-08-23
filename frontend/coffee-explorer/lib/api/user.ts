import { apiFetch } from "@/lib/api-client";

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    createdAt: string;
    favouriteBeanBag: { id: string; name: string } | null;
    stats: {
        visitCount: number;
        shopsVisitedCount: number;
    };
}

export interface UpdateProfileInput {
    name?: string;
    avatarUrl?: string;
    favouriteBeanBagId?: string;
}

export function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    return apiFetch<UserProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}
