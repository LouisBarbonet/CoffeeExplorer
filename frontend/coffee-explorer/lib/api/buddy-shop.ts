import type { CoffeeShop } from "./coffee-shop";
import type { BuddySummary } from "./buddies";

export interface BuddyVisitedShop {
    coffeeShop: CoffeeShop;
    visitedBy: BuddySummary[];
}
