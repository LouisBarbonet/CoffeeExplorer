"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import styles from "./app-nav.module.scss";

/** Top bar links -- desktop only (hidden below `sm`). */
export function AppNavDesktop() {
    const pathname = usePathname();

    return (
        <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "rounded-full px-4 py-1.5 text-sm",
                            styles.desktopLink,
                            active && styles.desktopLinkActive,
                        )}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}

/** Thumb-friendly floating dock -- mobile only (hidden from `sm` up). */
export function AppNavMobile() {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit items-center gap-1 px-2 py-2 sm:hidden",
                styles.dock,
            )}
        >
            {NAV_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center gap-0.5 px-4 py-1 text-[0.65rem]",
                            styles.dockLink,
                            active && styles.dockLinkActive,
                        )}
                    >
                        <motion.span
                            whileTap={{ scale: 0.85 }}
                            className={cn(
                                "flex size-9 items-center justify-center",
                                styles.dockIconWrap,
                                active && styles.dockIconWrapActive,
                            )}
                        >
                            <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                        </motion.span>
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
