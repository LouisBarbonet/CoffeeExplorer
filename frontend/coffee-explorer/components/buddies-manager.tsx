"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    acceptRequest,
    declineRequest,
    listBuddies,
    listIncomingRequests,
    removeBuddy,
    searchUsers,
    sendBuddyRequest,
    type BuddySummary,
    type IncomingRequest,
} from "@/lib/api/buddies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./buddies-manager.module.scss";

interface BuddiesManagerProps {
    initialIncoming: IncomingRequest[];
    initialBuddies: BuddySummary[];
}

export function BuddiesManager({ initialIncoming, initialBuddies }: BuddiesManagerProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [query, setQuery] = useState("");

    const { data: incoming } = useQuery({
        queryKey: ["buddy-requests-incoming"],
        queryFn: listIncomingRequests,
        initialData: initialIncoming,
    });
    const { data: buddies } = useQuery({
        queryKey: ["buddies"],
        queryFn: listBuddies,
        initialData: initialBuddies,
    });
    const { data: searchResults, isFetching: isSearching } = useQuery({
        queryKey: ["user-search", query],
        queryFn: () => searchUsers(query),
        enabled: query.trim().length > 0,
    });

    function refreshAll() {
        void queryClient.invalidateQueries({ queryKey: ["buddy-requests-incoming"] });
        void queryClient.invalidateQueries({ queryKey: ["buddies"] });
        void queryClient.invalidateQueries({ queryKey: ["user-search"] });
        router.refresh();
    }

    const sendMutation = useMutation({
        mutationFn: sendBuddyRequest,
        onSuccess: refreshAll,
    });
    const acceptMutation = useMutation({
        mutationFn: acceptRequest,
        onSuccess: refreshAll,
    });
    const declineMutation = useMutation({
        mutationFn: declineRequest,
        onSuccess: refreshAll,
    });
    const removeMutation = useMutation({
        mutationFn: removeBuddy,
        onSuccess: refreshAll,
    });

    return (
        <div className="flex flex-col gap-6">
            <div className={`flex flex-col gap-3 p-6 ${styles.card}`}>
                <Label htmlFor="buddy-search">Find buddies</Label>
                <Input
                    id="buddy-search"
                    placeholder="Search by name or email"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {isSearching && <p className={styles.hint}>Searching…</p>}
                {searchResults && searchResults.length === 0 && query.trim() && (
                    <p className={styles.hint}>No one found.</p>
                )}
                {searchResults && searchResults.length > 0 && (
                    <ul className="flex flex-col gap-2">
                        {searchResults.map((result) => (
                            <li key={result.id} className={styles.row}>
                                <span>{result.name}</span>
                                {result.relationshipStatus === "buddies" && (
                                    <span className={styles.badge}>Buddies</span>
                                )}
                                {result.relationshipStatus === "pending_sent" && (
                                    <span className={styles.badge}>Pending</span>
                                )}
                                {result.relationshipStatus === "pending_received" && (
                                    <span className={styles.badge}>Check requests below</span>
                                )}
                                {result.relationshipStatus === "none" && (
                                    <Button
                                        size="sm"
                                        disabled={sendMutation.isPending}
                                        onClick={() => sendMutation.mutate(result.id)}
                                    >
                                        Add buddy
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {incoming.length > 0 && (
                <div className={`flex flex-col gap-3 p-6 ${styles.card}`}>
                    <h2 className={styles.sectionTitle}>Incoming requests</h2>
                    <ul className="flex flex-col gap-2">
                        {incoming.map((req) => (
                            <li key={req.id} className={styles.row}>
                                <span>{req.requester.name}</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={declineMutation.isPending}
                                        onClick={() => declineMutation.mutate(req.id)}
                                    >
                                        Decline
                                    </Button>
                                    <Button
                                        size="sm"
                                        disabled={acceptMutation.isPending}
                                        onClick={() => acceptMutation.mutate(req.id)}
                                    >
                                        Accept
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className={`flex flex-col gap-3 p-6 ${styles.card}`}>
                <h2 className={styles.sectionTitle}>Your buddies</h2>
                {buddies.length === 0 ? (
                    <p className={styles.hint}>No buddies yet -- search above to send a request.</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {buddies.map((buddy) => (
                            <li key={buddy.id} className={styles.row}>
                                <Link href={`/buddies/${buddy.id}`} className={styles.buddyLink}>
                                    {buddy.name}
                                </Link>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={removeMutation.isPending}
                                    onClick={() => removeMutation.mutate(buddy.id)}
                                >
                                    Remove
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
