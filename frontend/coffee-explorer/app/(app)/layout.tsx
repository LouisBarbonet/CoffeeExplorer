import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/server-api";
import { LogoutButton } from "@/components/logout-button";
import { NotificationBell } from "@/components/notification-bell";
import { AppNavDesktop, AppNavMobile } from "@/components/brand/app-nav";
import styles from "./layout.module.scss";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className={`sticky top-0 z-30 ${styles.header}`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className={`text-lg font-bold tracking-tight ${styles.wordmark}`}>
              Coffee<span className={styles.wordmarkAccent}>Explorer</span>
            </Link>
            <AppNavDesktop />
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link href="/profile" className={`hidden text-sm sm:inline ${styles.email}`}>{user.email}</Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-24 sm:px-6 sm:pb-10">
        {children}
      </main>

      <AppNavMobile />
    </div>
  );
}
