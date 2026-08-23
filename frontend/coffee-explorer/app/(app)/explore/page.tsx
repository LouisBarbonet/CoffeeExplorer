import { serverFetch } from "@/lib/server-api";
import type { CoffeeShop } from "@/lib/api/coffee-shop";
import type { Visit } from "@/lib/api/visit";
import type { WishlistItem } from "@/lib/api/wishlist";
import { ExploreList } from "@/components/explore-list";
import styles from "./page.module.scss";

export default async function ExplorePage() {
    const [shopsRes, visitsRes, wishlistRes] = await Promise.all([
        serverFetch("/coffee-shops"),
        serverFetch("/visits"),
        serverFetch("/wishlist"),
    ]);

    const shops: CoffeeShop[] = shopsRes.ok ? await shopsRes.json() : [];
    const visits: Visit[] = visitsRes.ok ? await visitsRes.json() : [];
    const wishlist: WishlistItem[] = wishlistRes.ok ? await wishlistRes.json() : [];
    const visitedShopIds = Array.from(new Set(visits.map((v) => v.coffeeShopId)));
    const wishlistedShopIds = wishlist.map((w) => w.coffeeShopId);

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
            <div>
                <h1 className={`text-2xl font-bold tracking-tight ${styles.title}`}>Explore</h1>
                <p className={`mt-1 text-sm ${styles.subtitle}`}>
                    Every coffee shop the community has added. Log a visit to add one to your own journal.
                </p>
            </div>
            <ExploreList shops={shops} visitedShopIds={visitedShopIds} wishlistedShopIds={wishlistedShopIds} />
        </div>
    );
}
