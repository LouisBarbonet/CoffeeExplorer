import { apiFetch } from "@/lib/api-client";

export type NotificationType =
    | "NEW_SHOP"
    | "NEW_VISIT"
    | "NEW_BEAN_RATING"
    | "BUDDY_REQUEST"
    | "BUDDY_ACCEPTED";

export interface Notification {
    id: string;
    type: NotificationType;
    read: boolean;
    createdAt: string;
    actor: { id: string; name: string; avatarUrl: string | null };
    coffeeShop: { id: string; name: string } | null;
    visit: { id: string; coffeeShopId: string } | null;
    beanBag: { id: string; name: string } | null;
}

export function fetchNotifications(): Promise<Notification[]> {
    return apiFetch<Notification[]>("/notifications");
}

export function fetchUnreadCount(): Promise<{ count: number }> {
    return apiFetch<{ count: number }>("/notifications/unread-count");
}

export function markNotificationRead(id: string) {
    return apiFetch(`/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
    return apiFetch("/notifications/read-all", { method: "POST" });
}
