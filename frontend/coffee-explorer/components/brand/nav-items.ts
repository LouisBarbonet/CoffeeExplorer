import { Home, Binoculars } from "lucide-react";

export const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/explore", label: "Explore", icon: Binoculars },
] as const;
