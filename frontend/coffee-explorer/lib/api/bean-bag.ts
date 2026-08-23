import { apiFetch } from "@/lib/api-client";
import type { PhotoDetails } from "./coffee-shop";

export type RoastLevel = "LIGHT" | "MEDIUM" | "DARK";

export type BeanBag = {
    id: string;
    name: string;
    roaster: string | null;
    origin: string | null;
    roastLevel: RoastLevel | null;
    createdAt: string;
    updatedAt: string;
    photos: PhotoDetails[];
};

export function fetchBeanBags(): Promise<BeanBag[]> {
    return apiFetch<BeanBag[]>("/bean-bags");
}
