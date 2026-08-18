"use client";

import { useId, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadPhoto } from "@/lib/api/photos";
import { ApiError, apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogPopup, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PassportStamp } from "@/components/brand/passport-stamp";
import styles from "./add-coffee-shop-dialog.module.scss";

interface AddCoffeeShopDialogProps {
    open: boolean;
    coordinates: { lat: number; lng: number } | null;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

export function AddCoffeeShopDialog({ open, coordinates, onOpenChange, onSaved }: AddCoffeeShopDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [justSaved, setJustSaved] = useState(false);
    const photoInputRef = useRef<HTMLInputElement | null>(null);

    const nameId = useId();
    const descriptionId = useId();
    const addressId = useId();
    const cityId = useId();
    const countryId = useId();
    const photoId = useId();

    function resetForm() {
        setName("");
        setDescription("");
        setAddress("");
        setCity("");
        setCountry("");
        setPhotoFile(null);
        setJustSaved(false);
        if (photoInputRef.current) photoInputRef.current.value = "";
    }

    const createShopMutation = useMutation({
        mutationFn: async () => {
            if (!coordinates) throw new Error("Missing coordinates");

            const photoUrl = photoFile ? (await uploadPhoto(photoFile)).url : undefined;

            return apiFetch("/visits", {
                method: "POST",
                body: JSON.stringify({
                    newCoffeeShop: {
                        name,
                        description: description || undefined,
                        photoUrl,
                        location: {
                            address: address || undefined,
                            city: city || undefined,
                            country: country || undefined,
                            latitude: coordinates.lat,
                            longitude: coordinates.lng,
                        },
                    },
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
                    createShopMutation.reset();
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
                        <DialogTitle>Add a Coffee Shop</DialogTitle>
                        <DialogDescription>
                            {coordinates ? `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}` : ""}
                        </DialogDescription>

                        <form
                            className="mt-4 flex flex-col gap-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                createShopMutation.mutate();
                            }}
                        >
                            <div className="flex flex-col gap-2">
                                <Label htmlFor={nameId}>Name</Label>
                                <Input id={nameId} required value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor={descriptionId}>Description</Label>
                                <Input id={descriptionId} value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor={addressId}>Address</Label>
                                <Input id={addressId} value={address} onChange={(e) => setAddress(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor={cityId}>City</Label>
                                <Input id={cityId} value={city} onChange={(e) => setCity(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor={countryId}>Country</Label>
                                <Input id={countryId} value={country} onChange={(e) => setCountry(e.target.value)} />
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

                            {createShopMutation.isError && (
                                <p className={styles.error} role="alert">
                                    {createShopMutation.error instanceof ApiError
                                        ? createShopMutation.error.message
                                        : "Something went wrong"}
                                </p>
                            )}

                            <div className="mt-1 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        resetForm();
                                        createShopMutation.reset();
                                        onOpenChange(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createShopMutation.isPending}>
                                    {createShopMutation.isPending ? "Saving…" : "Save"}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </DialogPopup>
        </Dialog>
    );
}
