"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";
import { uploadPhoto } from "@/lib/api/photos";
import { updateProfile, type UserProfile } from "@/lib/api/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./profile-form.module.scss";

interface ProfileFormProps {
    profile: UserProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
    const router = useRouter();
    const [name, setName] = useState(profile.name);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl);
    const avatarInputRef = useRef<HTMLInputElement | null>(null);
    const nameId = useId();
    const avatarId = useId();

    const saveMutation = useMutation({
        mutationFn: async () => {
            const avatarUrl = avatarFile ? (await uploadPhoto(avatarFile)).url : undefined;
            return updateProfile({
                name: name !== profile.name ? name : undefined,
                avatarUrl,
            });
        },
        onSuccess: () => {
            router.refresh();
        },
    });

    return (
        <div className="flex flex-col gap-6">
            <div className={`flex items-center gap-4 p-6 ${styles.card}`}>
                {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="" className={styles.avatar} />
                ) : (
                    <div className={styles.avatarFallback}>{profile.name.charAt(0).toUpperCase()}</div>
                )}
                <div className="flex flex-col gap-1">
                    <span className={styles.statValue}>{profile.stats.visitCount}</span>
                    <span className={styles.statLabel}>visits logged</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className={styles.statValue}>{profile.stats.shopsVisitedCount}</span>
                    <span className={styles.statLabel}>shops visited</span>
                </div>
                {profile.favouriteBeanBag && (
                    <div className="flex flex-col gap-1">
                        <span className={styles.statLabel}>Favourite beans</span>
                        <span className={styles.statValue}>{profile.favouriteBeanBag.name}</span>
                    </div>
                )}
            </div>

            <form
                className={`flex flex-col gap-4 p-6 ${styles.card}`}
                onSubmit={(e) => {
                    e.preventDefault();
                    saveMutation.mutate();
                }}
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor={nameId}>Name</Label>
                    <Input id={nameId} value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor={avatarId}>Avatar</Label>
                    <input
                        id={avatarId}
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            setAvatarFile(file);
                            setAvatarPreview(file ? URL.createObjectURL(file) : profile.avatarUrl);
                        }}
                        className={styles.fileInput}
                    />
                </div>

                {saveMutation.isError && (
                    <p className={styles.error} role="alert">
                        {saveMutation.error instanceof ApiError ? saveMutation.error.message : "Something went wrong"}
                    </p>
                )}
                {saveMutation.isSuccess && !saveMutation.isPending && (
                    <p className={styles.success}>Saved.</p>
                )}

                <div className="mt-1 flex justify-end">
                    <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? "Saving…" : "Save changes"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
