"use client"

import { useId, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api-client";
import { uploadPhoto } from "@/lib/api/photos";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogPopup, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StarRating } from "@/components/star-rating";
import { PassportStamp } from "@/components/brand/passport-stamp";
import { CompanionSelect } from "@/components/companion-select";
import styles from "./add-visit-dialog.module.scss";

interface AddVisitDialogProps {
    open: boolean;
    coffeeShopId: string | null;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

export function AddVisitDialog({ open, coffeeShopId, onOpenChange, onSaved }: AddVisitDialogProps) {
    const [notes, setNotes] = useState("");
    const [rating, setRating] = useState(0);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [companionIds, setCompanionIds] = useState<string[]>([]);
    const [justSaved, setJustSaved] = useState(false);
    const photoInputRef = useRef<HTMLInputElement | null>(null);
    const notesId = useId();
    const photoId = useId();

    function resetForm() {
        setNotes("");
        setRating(0);
        setPhotoFile(null);
        setCompanionIds([]);
        setJustSaved(false);
        if (photoInputRef.current) photoInputRef.current.value = "";
    }

    const createVisitMutation = useMutation({
        mutationFn: async () => {
            if (!coffeeShopId) throw new Error("Missing coffeeShopId");

            const photoUrl = photoFile ? (await uploadPhoto(photoFile)).url : undefined;

            return apiFetch("/visits", {
                method: "POST",
                body: JSON.stringify({
                    coffeeShopId,
                    notes: notes || undefined,
                    photoUrl,
                    rating: rating > 0 ? rating : undefined,
                    companionIds: companionIds.length > 0 ? companionIds : undefined,
                }),
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
                    createVisitMutation.reset();
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
                        <DialogTitle>Add a visit</DialogTitle>
                        <DialogDescription>Log that you visited this coffee shop.</DialogDescription>

                        <form
                            className="mt-4 flex flex-col gap-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                createVisitMutation.mutate();
                            }}
                        >
                            <div className="flex flex-col gap-2">
                                <Label>Rating (optional)</Label>
                                <StarRating value={rating} onChange={setRating} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor={notesId}>Notes</Label>
                                <Textarea
                                    id={notesId}
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
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
                            <CompanionSelect value={companionIds} onChange={setCompanionIds} />

                            {createVisitMutation.isError && (
                                <p className={styles.error} role="alert">
                                    {createVisitMutation.error instanceof ApiError
                                        ? createVisitMutation.error.message
                                        : "Something went wrong"}
                                </p>
                            )}

                            <div className="mt-1 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        resetForm();
                                        createVisitMutation.reset();
                                        onOpenChange(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createVisitMutation.isPending}>
                                    {createVisitMutation.isPending ? "Saving…" : "Save"}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </DialogPopup>
        </Dialog>
    );
}
