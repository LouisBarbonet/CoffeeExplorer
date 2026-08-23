"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { removeBuddy } from "@/lib/api/buddies";
import { Button } from "@/components/ui/button";

export function RemoveBuddyButton({ userId }: { userId: string }) {
    const router = useRouter();
    const removeMutation = useMutation({
        mutationFn: () => removeBuddy(userId),
        onSuccess: () => {
            router.push("/buddies");
            router.refresh();
        },
    });

    return (
        <Button variant="outline" disabled={removeMutation.isPending} onClick={() => removeMutation.mutate()}>
            {removeMutation.isPending ? "Removing…" : "Remove buddy"}
        </Button>
    );
}
