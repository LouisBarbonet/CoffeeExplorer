import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-api";
import type { UserProfile } from "@/lib/api/user";
import { ProfileForm } from "@/components/profile-form";
import styles from "./page.module.scss";

export default async function ProfilePage() {
    const res = await serverFetch("/users/me");
    if (!res.ok) redirect("/login");
    const profile: UserProfile = await res.json();

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
            <div>
                <h1 className={`text-2xl font-bold tracking-tight ${styles.title}`}>Profile</h1>
                <p className={`mt-1 text-sm ${styles.subtitle}`}>
                    Your passport details, visible to your buddies.
                </p>
            </div>
            <ProfileForm profile={profile} />
        </div>
    );
}
