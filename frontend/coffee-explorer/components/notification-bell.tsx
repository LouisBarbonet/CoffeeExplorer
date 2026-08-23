"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import {
    fetchNotifications,
    fetchUnreadCount,
    markAllNotificationsRead,
    type Notification,
} from "@/lib/api/notifications";
import styles from "./notification-bell.module.scss";

function describeNotification(n: Notification): { text: string; href: string } {
    const actorName = n.actor.name;
    switch (n.type) {
        case "NEW_SHOP":
            return {
                text: `${actorName} added ${n.coffeeShop?.name ?? "a coffee shop"}`,
                href: n.coffeeShop ? `/coffee-shops/${n.coffeeShop.id}` : "/explore",
            };
        case "NEW_VISIT":
            return {
                text: `${actorName} visited ${n.coffeeShop?.name ?? "a coffee shop"}`,
                href: n.coffeeShop ? `/coffee-shops/${n.coffeeShop.id}` : "/explore",
            };
        case "NEW_BEAN_RATING":
            return { text: `${actorName} rated ${n.beanBag?.name ?? "a bean bag"}`, href: "/beans" };
        case "BUDDY_REQUEST":
            return { text: `${actorName} sent you a buddy request`, href: "/buddies" };
        case "BUDDY_ACCEPTED":
            return { text: `${actorName} accepted your buddy request`, href: `/buddies/${n.actor.id}` };
    }
}

export function NotificationBell() {
    const pathname = usePathname();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    const { data: unreadCount } = useQuery({
        queryKey: ["notifications-unread-count", pathname],
        queryFn: fetchUnreadCount,
    });

    const { data: notifications } = useQuery({
        queryKey: ["notifications"],
        queryFn: fetchNotifications,
        enabled: open,
    });

    const markAllReadMutation = useMutation({
        mutationFn: markAllNotificationsRead,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
            void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    function handleToggle() {
        const next = !open;
        setOpen(next);
        if (next && (unreadCount?.count ?? 0) > 0) {
            markAllReadMutation.mutate();
        }
    }

    return (
        <div className={styles.wrapper}>
            <button type="button" className={styles.bellButton} onClick={handleToggle} aria-label="Notifications">
                <Bell className="size-5" />
                {!!unreadCount?.count && <span className={styles.badge}>{unreadCount.count}</span>}
            </button>
            {open && (
                <div className={styles.panel}>
                    {!notifications || notifications.length === 0 ? (
                        <p className={styles.empty}>No notifications yet.</p>
                    ) : (
                        <ul className="flex flex-col gap-1">
                            {notifications.map((n) => {
                                const { text, href } = describeNotification(n);
                                return (
                                    <li key={n.id}>
                                        <Link href={href} className={styles.item} onClick={() => setOpen(false)}>
                                            {text}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
