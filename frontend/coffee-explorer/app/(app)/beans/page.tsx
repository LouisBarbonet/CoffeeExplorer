import { serverFetch } from "@/lib/server-api";
import type { BeanBag } from "@/lib/api/bean-bag";
import type { BeanRating } from "@/lib/api/bean-rating";
import type { UserProfile } from "@/lib/api/user";
import { BeansList } from "@/components/beans-list";
import styles from "./page.module.scss";

export default async function BeansPage() {
    const [bagsRes, ratingsRes, meRes] = await Promise.all([
        serverFetch("/bean-bags"),
        serverFetch("/bean-ratings"),
        serverFetch("/users/me"),
    ]);

    const bags: BeanBag[] = bagsRes.ok ? await bagsRes.json() : [];
    const myRatings: BeanRating[] = ratingsRes.ok ? await ratingsRes.json() : [];
    const me: UserProfile | null = meRes.ok ? await meRes.json() : null;

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
            <div>
                <h1 className={`text-2xl font-bold tracking-tight ${styles.title}`}>Bagged Coffee Beans</h1>
                <p className={`mt-1 text-sm ${styles.subtitle}`}>
                    Track and rate the bags you&apos;ve brewed at home.
                </p>
            </div>
            <BeansList bags={bags} myRatings={myRatings} favouriteBeanBagId={me?.favouriteBeanBag?.id ?? null} />
        </div>
    );
}
