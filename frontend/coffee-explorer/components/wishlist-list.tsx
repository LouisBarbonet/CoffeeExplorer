"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { removeFromWishlist } from "@/lib/api/wishlist";
import type { WishlistItem } from "@/lib/api/wishlist";
import styles from "./wishlist-list.module.scss";

interface WishlistListProps {
    items: WishlistItem[];
}

export function WishlistList({ items }: WishlistListProps) {
    const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
    const removeMutation = useMutation({
        mutationFn: removeFromWishlist,
        onSuccess: (_data, coffeeShopId) => {
            setRemovedIds((prev) => new Set(prev).add(coffeeShopId));
        },
    });

    const visibleItems = items.filter((item) => !removedIds.has(item.coffeeShopId));

    if (visibleItems.length === 0) {
        return <p className={styles.empty}>No coffee shops on your wishlist yet.</p>;
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visibleItems.map(({ coffeeShop: shop }) => (
                <div key={shop.id} className={styles.card}>
                    {shop.photos.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={shop.photos[0].url} alt="" className={styles.image} />
                    ) : (
                        <div className={styles.imagePlaceholder} />
                    )}
                    <div className="flex flex-col gap-1 p-3">
                        <Link href={`/coffee-shops/${shop.id}`} className={styles.name}>
                            {shop.name}
                        </Link>
                        {shop.location?.city && <p className={styles.location}>{shop.location.city}</p>}
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-1"
                            disabled={removeMutation.isPending}
                            onClick={() => removeMutation.mutate(shop.id)}
                        >
                            Remove
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
