"use client";

import { useId, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogPopup, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Visit } from "@/lib/api/visit";
import { StarRating } from "@/components/star-rating";
import styles from "./edit-visit-dialog.module.scss";

interface EditVisitDialogProps {
    visit: Visit | null;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

export function EditVisitDialog({ visit, onOpenChange, onSaved }: EditVisitDialogProps) {
    const [rating, setRating] = useState(0);
    const [notes, setNotes] = useState("");
    const notesId = useId();

    // Reset the form whenever a different visit (or null, on close) comes
    // in. Adjusting state during render -- rather than in a useEffect after
    // commit -- avoids an extra cascading render and keeps the dialog's
    // mount identity (and its open/close transition) intact.
    const [syncedVisit, setSyncedVisit] = useState(visit);
    if (visit !== syncedVisit) {
        setSyncedVisit(visit);
        setNotes(visit?.notes ?? "");
        setRating(visit?.rating ?? 0);
    }

    const updateVisitMutation = useMutation({
        mutationFn: () => {
            if (!visit) throw new Error("Missing visit");
            return apiFetch(`/visits/${visit.id}`, {
                method: "PATCH",
                body: JSON.stringify({ notes: notes || undefined, rating: rating > 0 ? rating : undefined }),
            });
        },
        onSuccess: () => {
            onSaved();
        },
    });

    return (
        <Dialog
            open={visit !== null}
            onOpenChange={(next) => {
                if (!next) updateVisitMutation.reset();
                onOpenChange(next);
            }}
        >
            <DialogPopup>
                <DialogTitle>Edit visit</DialogTitle>
                <DialogDescription>Update your notes for this visit.</DialogDescription>

                <form
                    className="mt-4 flex flex-col gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        updateVisitMutation.mutate();
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

                    {updateVisitMutation.isError && (
                        <p className={styles.error} role="alert">
                            {updateVisitMutation.error instanceof ApiError
                                ? updateVisitMutation.error.message
                                : "Something went wrong"}
                        </p>
                    )}

                    <div className="mt-1 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateVisitMutation.isPending}>
                            {updateVisitMutation.isPending ? "Saving…" : "Save"}
                        </Button>
                    </div>
                </form>
            </DialogPopup>
        </Dialog>
    );
}
