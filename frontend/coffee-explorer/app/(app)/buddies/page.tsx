import { serverFetch } from "@/lib/server-api";
import type { BuddySummary, IncomingRequest } from "@/lib/api/buddies";
import { BuddiesManager } from "@/components/buddies-manager";
import styles from "./page.module.scss";

export default async function BuddiesPage() {
    const [incomingRes, buddiesRes] = await Promise.all([
        serverFetch("/buddies/requests/incoming"),
        serverFetch("/buddies"),
    ]);

    const incoming: IncomingRequest[] = incomingRes.ok ? await incomingRes.json() : [];
    const buddies: BuddySummary[] = buddiesRes.ok ? await buddiesRes.json() : [];

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
            <div>
                <h1 className={`text-2xl font-bold tracking-tight ${styles.title}`}>Buddies</h1>
                <p className={`mt-1 text-sm ${styles.subtitle}`}>
                    Find friends, tag them on visits, and see where they&apos;ve been.
                </p>
            </div>
            <BuddiesManager initialIncoming={incoming} initialBuddies={buddies} />
        </div>
    );
}
