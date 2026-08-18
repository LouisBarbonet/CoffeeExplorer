"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { EditVisitDialog } from "@/components/edit-visit-dialog";
import type { Visit } from "@/lib/api/visit";
import { StarRating } from "@/components/star-rating";
import styles from "./visit-list.module.scss";

interface VisitListProps {
    visits: Visit[];
}

export function VisitList({ visits }: VisitListProps) {
    const router = useRouter();
    const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const deleteMutation = useMutation({
        mutationFn: (visitId: string) => apiFetch(`/visits/${visitId}`, { method: "DELETE" }),
        onSuccess: () => {
            setDeletingId(null);
            router.refresh();
        },
        onError: () => {
            setDeletingId(null);
        },
    });

    function handleDelete(visit: Visit) {
        if (!window.confirm("Delete this visit? This can't be undone.")) return;
        setDeletingId(visit.id);
        deleteMutation.mutate(visit.id);
    }

    if (visits.length === 0) {
        return <p className={styles.empty}>No visits logged yet.</p>;
    }

    return (
        <>
            <div className="flex flex-col gap-5">
                {visits.map((visit) => (
                    <div key={visit.id} className={styles.card}>
                        <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${styles.date}`}>
                                {new Date(visit.visitedAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </p>
                            <div className="flex gap-2">
                                <Button type="button" size="sm" variant="outline" onClick={() => setEditingVisit(visit)}>
                                    Edit
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={deleteMutation.isPending && deletingId === visit.id}
                                    onClick={() => handleDelete(visit)}
                                >
                                    {deleteMutation.isPending && deletingId === visit.id ? "Deleting…" : "Delete"}
                                </Button>
                            </div>
                        </div>
                        {visit.rating && <StarRating value={visit.rating} className="mt-2" />}
                        {visit.notes && <p className={`mt-2 text-sm ${styles.notes}`}>{visit.notes}</p>}
                        {visit.photos.length > 0 && (
                            <div className={`mt-3 ${styles.photoStrip}`}>
                                {visit.photos.map((photo) => (
                                    <div key={photo.id} className={styles.polaroid}>
                                        <img src={photo.url} alt="" className={styles.polaroidImg} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <EditVisitDialog
                visit={editingVisit}
                onOpenChange={(open) => {
                    if (!open) setEditingVisit(null);
                }}
                onSaved={() => {
                    setEditingVisit(null);
                    router.refresh();
                }}
            />
        </>
    );
}
