import type {CoffeeShop, PhotoDetails} from "./coffee-shop";
import type {BuddySummary} from "./buddies";

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
    companions: BuddySummary[];
};