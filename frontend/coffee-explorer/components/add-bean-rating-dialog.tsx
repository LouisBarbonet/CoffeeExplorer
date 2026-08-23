"use client";

import { useId, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";
import { uploadPhoto } from "@/lib/api/photos";
import { createBeanRating } from "@/lib/api/bean-rating";
import type { BeanBag, RoastLevel } from "@/lib/api/bean-bag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogPopup, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StarRating } from "@/components/star-rating";
import { PassportStamp } from "@/components/brand/passport-stamp";
import styles from "./add-bean-rating-dialog.module.scss";

interface AddBeanRatingDialogProps {
    open: boolean;
    // A bag being re-rated, or null to create a brand-new one.
    beanBag: BeanBag | null;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

export function AddBeanRatingDialog({ open, beanBag, onOpenChange, onSaved }: AddBeanRatingDialogProps) {
    const isNew = beanBag === null;

    const [name, setName] = useState("");
    const [roaster, setRoaster] = useState("");
    const [origin, setOrigin] = useState("");
    const [roastLevel, setRoastLevel] = useState<RoastLevel | "">("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [rating, setRating] = useState(0);
    const [notes, setNotes] = useState("");
    const [justSaved, setJustSaved] = useState(false);
    const photoInputRef = useRef<HTMLInputElement | null>(null);

    const nameId = useId();
    const roasterId = useId();
    const originId = useId();
    const roastLevelId = useId();
    const photoId = useId();
    const notesId = useId();

    function resetForm() {
        setName("");
        setRoaster("");
        setOrigin("");
        setRoastLevel("");
        setPhotoFile(null);
        setRating(0);
        setNotes("");
        setJustSaved(false);
        if (photoInputRef.current) photoInputRef.current.value = "";
    }

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (isNew) {
                const photoUrl = photoFile ? (await uploadPhoto(photoFile)).url : undefined;
                return createBeanRating({
                    newBeanBag: {
                        name,
                        roaster: roaster || undefined,
                        origin: origin || undefined,
                        roastLevel: roastLevel || undefined,
                        photoUrl,
                    },
                    rating: rating > 0 ? rating : undefined,
                    notes: notes || undefined,
                });
            }
            return createBeanRating({
                beanBagId: beanBag.id,
                rating: rating > 0 ? rating : undefined,
                notes: notes || undefined,
            });
        },
        onSuccess: () => {
            setJustSaved(true);
            setTimeout(() => {
                resetForm();
                onSaved();
            }, 900);
        },
    });

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    resetForm();
                    saveMutation.reset();
                }
                onOpenChange(next);
            }}
        >
            <DialogPopup>
                {justSaved ? (
                    <div className={styles.celebration}>
                        <PassportStamp size="lg" animate />
                        <p className={styles.celebrationText}>Stamped!</p>
                    </div>
                ) : (
                    <>
                        <DialogTitle>{isNew ? "Add a Coffee Bean Bag" : `Rate ${beanBag.name}`}</DialogTitle>
                        <DialogDescription>
                            {isNew ? "Add a bag to the shared catalog and rate it." : "Update your rating for this bag."}
                        </DialogDescription>

                        <form
                            className="mt-4 flex flex-col gap-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                saveMutation.mutate();
                            }}
                        >
                            {isNew && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor={nameId}>Name</Label>
                                        <Input id={nameId} required value={name} onChange={(e) => setName(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor={roasterId}>Roaster</Label>
                                        <Input id={roasterId} value={roaster} onChange={(e) => setRoaster(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor={originId}>Origin</Label>
                                        <Input id={originId} value={origin} onChange={(e) => setOrigin(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor={roastLevelId}>Roast level</Label>
                                        <select
                                            id={roastLevelId}
                                            className={styles.select}
                                            value={roastLevel}
                                            onChange={(e) => setRoastLevel(e.target.value as RoastLevel | "")}
                                        >
                                            <option value="">Unspecified</option>
                                            <option value="LIGHT">Light</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="DARK">Dark</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor={photoId}>Photo (optional)</Label>
                                        <input
                                            id={photoId}
                                            ref={photoInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                                            className={styles.fileInput}
                                        />
                                    </div>
                                </>
                            )}
                            <div className="flex flex-col gap-2">
                                <Label>Rating</Label>
                                <StarRating value={rating} onChange={setRating} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor={notesId}>Notes</Label>
                                <Textarea id={notesId} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </div>

                            {saveMutation.isError && (
                                <p className={styles.error} role="alert">
                                    {saveMutation.error instanceof ApiError ? saveMutation.error.message : "Something went wrong"}
                                </p>
                            )}

                            <div className="mt-1 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        resetForm();
                                        saveMutation.reset();
                                        onOpenChange(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saveMutation.isPending}>
                                    {saveMutation.isPending ? "Saving…" : "Save"}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </DialogPopup>
        </Dialog>
    );
}
