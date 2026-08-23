import { Home, Binoculars, User, Users, Bookmark, Coffee } from "lucide-react";

export const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/explore", label: "Explore", icon: Binoculars },
    { href: "/buddies", label: "Buddies", icon: Users },
    { href: "/wishlist", label: "Wishlist", icon: Bookmark },
    { href: "/beans", label: "Beans", icon: Coffee },
    { href: "/profile", label: "Profile", icon: User },
] as const;
