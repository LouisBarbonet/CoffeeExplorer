import type { UserProfile } from "@/lib/api/user";
import styles from "./buddy-profile-card.module.scss";

export function BuddyProfileCard({ profile }: { profile: UserProfile }) {
    return (
        <div className={`flex items-center gap-4 p-6 ${styles.card}`}>
            {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className={styles.avatar} />
            ) : (
                <div className={styles.avatarFallback}>{profile.name.charAt(0).toUpperCase()}</div>
            )}
            <div className="flex flex-col gap-1">
                <span className={styles.statValue}>{profile.stats.visitCount}</span>
                <span className={styles.statLabel}>visits logged</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className={styles.statValue}>{profile.stats.shopsVisitedCount}</span>
                <span className={styles.statLabel}>shops visited</span>
            </div>
            {profile.favouriteBeanBag && (
                <div className="flex flex-col gap-1">
                    <span className={styles.statLabel}>Favourite beans</span>
                    <span className={styles.statValue}>{profile.favouriteBeanBag.name}</span>
                </div>
            )}
        </div>
    );
}
