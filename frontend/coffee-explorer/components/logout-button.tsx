"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
    const router = useRouter();
    const logoutMutation = useMutation({
        mutationFn: () => apiFetch("/auth/logout", { method: "POST" }),
        onSuccess: () => {
            router.push("/login");
            router.refresh();
        },
    });

    return (
        <Button variant="outline" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
            Log out
        </Button>
    );
}
