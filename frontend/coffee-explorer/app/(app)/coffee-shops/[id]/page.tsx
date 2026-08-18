import { serverFetch } from "@/lib/server-api";
import type { CoffeeShop } from "@/lib/api/coffee-shop";
import type { Visit } from "@/lib/api/visit";
import { VisitList } from "@/components/visit-list";
import { PassportStamp } from "@/components/brand/passport-stamp";
import styles from "./page.module.scss";

export default async function CoffeeShopDetailPage({
                                                       params,
                                                   }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const [shopRes, visitsRes] = await Promise.all([
        serverFetch(`/coffee-shops/${id}`),
        serverFetch(`/visits?coffeeShopId=${id}`),
    ]);

    const shop: CoffeeShop = await shopRes.json();
    const visits: Visit[] = visitsRes.ok ? await visitsRes.json() : [];
    const visited = visits.length > 0;

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className={`text-2xl font-bold tracking-tight ${styles.title}`}>{shop.name}</h1>
                    {shop.description && <p className={`mt-1 ${styles.description}`}>{shop.description}</p>}
                    {shop.location?.address && (
                        <p className={`mt-1 text-sm ${styles.address}`}>
                            {[shop.location.address, shop.location.city, shop.location.country].filter(Boolean).join(", ")}
                        </p>
                    )}
                </div>
                {visited && <PassportStamp size="lg" />}
            </div>

            <div className="flex flex-col gap-4">
                <h2 className={`text-lg font-semibold tracking-tight ${styles.sectionTitle}`}>
                    Visit history ({visits.length})
                </h2>
                <VisitList visits={visits} />
            </div>
        </div>
    );
}
