"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { AddBeanRatingDialog } from "@/components/add-bean-rating-dialog";
import { updateProfile } from "@/lib/api/user";
import type { BeanBag } from "@/lib/api/bean-bag";
import type { BeanRating } from "@/lib/api/bean-rating";
import styles from "./beans-list.module.scss";

interface BeansListProps {
    bags: BeanBag[];
    myRatings: BeanRating[];
    favouriteBeanBagId: string | null;
}

export function BeansList({ bags, myRatings, favouriteBeanBagId }: BeansListProps) {
    const router = useRouter();
    const ratingsByBagId = new Map(myRatings.map((r) => [r.beanBagId, r]));
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogBag, setDialogBag] = useState<BeanBag | null>(null);

    const favouriteMutation = useMutation({
        mutationFn: (beanBagId: string) => updateProfile({ favouriteBeanBagId: beanBagId }),
        onSuccess: () => router.refresh(),
    });

    function handleSaved() {
        setDialogOpen(false);
        setDialogBag(null);
        router.refresh();
    }

    return (
        <>
            <div className="flex justify-end">
                <Button
                    type="button"
                    onClick={() => {
                        setDialogBag(null);
                        setDialogOpen(true);
                    }}
                >
                    <Plus data-icon="inline-start" />
                    Add a Bean Bag
                </Button>
            </div>

            {bags.length === 0 ? (
                <p className={styles.empty}>No bean bags have been added yet.</p>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {bags.map((bag) => {
                        const myRating = ratingsByBagId.get(bag.id);
                        const isFavourite = favouriteBeanBagId === bag.id;
                        return (
                            <div key={bag.id} className={styles.card}>
                                {isFavourite && <Heart className={styles.favouriteBadge} fill="currentColor" />}
                                {bag.photos.length > 0 ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={bag.photos[0].url} alt="" className={styles.image} />
                                ) : (
                                    <div className={styles.imagePlaceholder} />
                                )}
                                <div className="flex flex-col gap-1 p-3">
                                    <span className={styles.name}>{bag.name}</span>
                                    {bag.roaster && <p className={styles.meta}>{bag.roaster}</p>}
                                    {bag.origin && <p className={styles.meta}>{bag.origin}</p>}

                                    {myRating ? (
                                        <StarRating value={myRating.rating ?? 0} />
                                    ) : (
                                        <p className={styles.meta}>Not rated yet</p>
                                    )}

                                    <div className="mt-1 flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                                setDialogBag(bag);
                                                setDialogOpen(true);
                                            }}
                                        >
                                            {myRating ? "Update rating" : "Rate it"}
                                        </Button>
                                        {myRating && !isFavourite && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                disabled={favouriteMutation.isPending}
                                                onClick={() => favouriteMutation.mutate(bag.id)}
                                            >
                                                Set as favourite
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <AddBeanRatingDialog
                open={dialogOpen}
                beanBag={dialogBag}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setDialogBag(null);
                }}
                onSaved={handleSaved}
            />
        </>
    );
}
