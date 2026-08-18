"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AddVisitDialog } from "@/components/add-visit-dialog";
import { PassportStamp } from "@/components/brand/passport-stamp";
import type { CoffeeShop } from "@/lib/api/coffee-shop";
import styles from "./explore-list.module.scss";

interface ExploreListProps {
    shops: CoffeeShop[];
    visitedShopIds: string[];
}

export function ExploreList({ shops, visitedShopIds }: ExploreListProps) {
    const router = useRouter();
    const visitedSet = new Set(visitedShopIds);
    const [activeShopId, setActiveShopId] = useState<string | null>(null);

    function handleVisitSaved() {
        setActiveShopId(null);
        router.refresh();
    }

    if (shops.length === 0) {
        return <p className={styles.empty}>No coffee shops have been added yet.</p>;
    }

    return (
        <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {shops.map((shop) => {
                    const visited = visitedSet.has(shop.id);
                    return (
                        <div key={shop.id} className={styles.card}>
                            {visited && <PassportStamp size="sm" className={styles.stamp} />}
                            {shop.photos.length > 0 ? (
                                <img src={shop.photos[0].url} alt="" className={styles.image} />
                            ) : (
                                <div className={styles.imagePlaceholder} />
                            )}
                            <div className="flex flex-col gap-1 p-3">
                                <Link href={`/coffee-shops/${shop.id}`} className={styles.name}>
                                    {shop.name}
                                </Link>
                                {shop.location?.city && (
                                    <p className={styles.location}>{shop.location.city}</p>
                                )}
                                {!visited && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="mt-1"
                                        onClick={() => setActiveShopId(shop.id)}
                                    >
                                        Log a visit
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <AddVisitDialog
                open={activeShopId !== null}
                coffeeShopId={activeShopId}
                onOpenChange={(open) => {
                    if (!open) setActiveShopId(null);
                }}
                onSaved={handleVisitSaved}
            />
        </>
    );
}
