import { notFound } from "next/navigation";
import Link from "next/link";
import { serverFetch } from "@/lib/server-api";
import type { UserProfile } from "@/lib/api/user";
import { BuddyProfileCard } from "@/components/buddy-profile-card";
import { RemoveBuddyButton } from "@/components/remove-buddy-button";
import styles from "./page.module.scss";

export default async function BuddyProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const res = await serverFetch(`/users/${userId}`);
    if (!res.ok) notFound();
    const profile: UserProfile = await res.json();

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-bold tracking-tight ${styles.title}`}>{profile.name}</h1>
                    <Link href="/buddies" className={styles.backLink}>
                        &larr; Back to buddies
                    </Link>
                </div>
                <RemoveBuddyButton userId={profile.id} />
            </div>
            <BuddyProfileCard profile={profile} />
        </div>
    );
}
