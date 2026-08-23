import { apiFetch } from "@/lib/api-client";
import type { BeanBag, RoastLevel } from "./bean-bag";

export type BeanRating = {
    id: string;
    userId: string;
    beanBagId: string;
    rating: number | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    beanBag: BeanBag;
};

export interface NewBeanBagInput {
    name: string;
    roaster?: string;
    origin?: string;
    roastLevel?: RoastLevel;
    photoUrl?: string;
}

export interface CreateBeanRatingInput {
    beanBagId?: string;
    newBeanBag?: NewBeanBagInput;
    rating?: number;
    notes?: string;
}

export function fetchBeanRatings(): Promise<BeanRating[]> {
    return apiFetch<BeanRating[]>("/bean-ratings");
}

export function createBeanRating(input: CreateBeanRatingInput): Promise<BeanRating> {
    return apiFetch<BeanRating>("/bean-ratings", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export function deleteBeanRating(ratingId: string) {
    return apiFetch(`/bean-ratings/${ratingId}`, { method: "DELETE" });
}
