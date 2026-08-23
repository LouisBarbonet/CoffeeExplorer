import { apiFetch } from "@/lib/api-client";

export type RelationshipStatus = "none" | "pending_sent" | "pending_received" | "buddies";

export interface BuddySummary {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
}

export interface SearchResult extends BuddySummary {
    relationshipStatus: RelationshipStatus;
}

export interface IncomingRequest {
    id: string;
    requester: BuddySummary;
    createdAt: string;
}

export function searchUsers(query: string): Promise<SearchResult[]> {
    return apiFetch<SearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`);
}

export function sendBuddyRequest(addresseeId: string) {
    return apiFetch("/buddies/requests", {
        method: "POST",
        body: JSON.stringify({ addresseeId }),
    });
}

export function listIncomingRequests(): Promise<IncomingRequest[]> {
    return apiFetch<IncomingRequest[]>("/buddies/requests/incoming");
}

export function acceptRequest(requestId: string) {
    return apiFetch(`/buddies/requests/${requestId}/accept`, { method: "POST" });
}

export function declineRequest(requestId: string) {
    return apiFetch(`/buddies/requests/${requestId}/decline`, { method: "POST" });
}

export function listBuddies(): Promise<BuddySummary[]> {
    return apiFetch<BuddySummary[]>("/buddies");
}

export function removeBuddy(userId: string) {
    return apiFetch(`/buddies/${userId}`, { method: "DELETE" });
}
