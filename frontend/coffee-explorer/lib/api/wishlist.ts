import { apiFetch } from "@/lib/api-client";
import type { CoffeeShop } from "./coffee-shop";

export interface WishlistItem {
    id: string;
    userId: string;
    coffeeShopId: string;
    createdAt: string;
    coffeeShop: CoffeeShop;
}

export function fetchWishlist(): Promise<WishlistItem[]> {
    return apiFetch<WishlistItem[]>("/wishlist");
}

export function addToWishlist(coffeeShopId: string): Promise<WishlistItem> {
    return apiFetch<WishlistItem>("/wishlist", {
        method: "POST",
        body: JSON.stringify({ coffeeShopId }),
    });
}

export function removeFromWishlist(coffeeShopId: string) {
    return apiFetch(`/wishlist/${coffeeShopId}`, { method: "DELETE" });
}
