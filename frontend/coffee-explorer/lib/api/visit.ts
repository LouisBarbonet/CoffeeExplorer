import type {CoffeeShop, PhotoDetails} from "./coffee-shop";

export type Visit = {
    id: string;
    userId: string;
    coffeeShopId: string;
    visitedAt: string;
    notes: string | null;
    rating: number | null;
    createdAt: string;
    coffeeShop: CoffeeShop;
    photos: PhotoDetails[];
};