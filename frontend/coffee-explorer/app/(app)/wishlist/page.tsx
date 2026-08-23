import { serverFetch } from "@/lib/server-api";
import type { WishlistItem } from "@/lib/api/wishlist";
import { WishlistList } from "@/components/wishlist-list";
import styles from "./page.module.scss";

export default async function WishlistPage() {
    const res = await serverFetch("/wishlist");
    const items: WishlistItem[] = res.ok ? await res.json() : [];

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
            <div>
                <h1 className={`text-2xl font-bold tracking-tight ${styles.title}`}>Wishlist</h1>
                <p className={`mt-1 text-sm ${styles.subtitle}`}>
                    Coffee shops you want to visit -- spotted on the map or saved from Explore.
                </p>
            </div>
            <WishlistList items={items} />
        </div>
    );
}
