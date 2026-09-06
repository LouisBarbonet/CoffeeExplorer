"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InteractiveMap } from "@/components/interactive-map-loader";
import { AddCoffeeShopDialog } from "@/components/add-coffee-shop-dialog";
import { AddVisitDialog } from "@/components/add-visit-dialog";
import type { CoffeeShop } from "@/lib/api/coffee-shop";
import type { BuddyVisitedShop } from "@/lib/api/buddy-shop";
import { addToWishlist } from "@/lib/api/wishlist";

interface DashboardMapProps {
    coffeeShops: CoffeeShop[];
    buddyShops: BuddyVisitedShop[];
}

export function DashboardMap({ coffeeShops, buddyShops }: DashboardMapProps) {
    const router = useRouter();
    const [addMode, setAddMode] = useState(false);
    const [pendingMarker, setPendingMarker] = useState<{ lat: number; lng: number } | null>(null);
    const [isShopDialogOpen, setIsShopDialogOpen] = useState(false);
    const [activeShopId, setActiveShopId] = useState<string | null>(null);
    const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);

    function handleMapClick(lat: number, lng: number) {
        setPendingMarker({ lat, lng });
        setIsShopDialogOpen(true);
        setAddMode(false);
    }

    function handleShopDialogOpenChange(open: boolean) {
        setIsShopDialogOpen(open);
        if (!open) {
            setPendingMarker(null);
        }
    }

    function handleShopSaved() {
        setIsShopDialogOpen(false);
        setPendingMarker(null);
        router.refresh();
    }

    function handleAddVisitClick(coffeeShopId: string) {
        setActiveShopId(coffeeShopId);
        setIsVisitDialogOpen(true);
    }

    function handleVisitDialogOpenChange(open: boolean) {
        setIsVisitDialogOpen(open);
        if (!open) {
            setActiveShopId(null);
        }
    }

    function handleVisitSaved() {
        setIsVisitDialogOpen(false);
        setActiveShopId(null);
        router.refresh();
    }

    async function handleWishlistClick(coffeeShopId: string) {
        await addToWishlist(coffeeShopId);
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="relative">
                <InteractiveMap
                    coffeeShops={coffeeShops}
                    buddyShops={buddyShops}
                    addMode={addMode}
                    pendingMarker={pendingMarker}
                    onMapClick={handleMapClick}
                    onAddVisitClick={handleAddVisitClick}
                    onWishlistClick={handleWishlistClick}
                />
                {!isShopDialogOpen && !isVisitDialogOpen && (
                <Button
                    size="lg"
                    variant={addMode ? "secondary" : "default"}
                    onClick={() => setAddMode((v) => !v)}
                    className="absolute right-4 bottom-4 z-[500]"
                >
                    {addMode ? <X data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
                    {addMode ? "Cancel" : "Add a Coffee Shop"}
                </Button>
                )}
            </div>
            <AddCoffeeShopDialog
                open={isShopDialogOpen}
                coordinates={pendingMarker}
                onOpenChange={handleShopDialogOpenChange}
                onSaved={handleShopSaved}
            />
            <AddVisitDialog
                open={isVisitDialogOpen}
                coffeeShopId={activeShopId}
                onOpenChange={handleVisitDialogOpenChange}
                onSaved={handleVisitSaved}
            />
        </div>
    );
}
