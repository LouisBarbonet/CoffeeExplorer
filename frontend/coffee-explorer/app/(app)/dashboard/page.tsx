import { serverFetch } from "@/lib/server-api";
import type { CoffeeShop } from "@/lib/api/coffee-shop";
import type { Visit } from "@/lib/api/visit";
import type { BuddyVisitedShop } from "@/lib/api/buddy-shop";
import {DashboardMap} from "@/components/dashboard-map";


export default async function DashboardPage() {

    const [visitsRes, buddyShopsRes] = await Promise.all([
        serverFetch("/visits"),
        serverFetch("/visits/buddies"),
    ]);
    const visits: Visit[] = visitsRes.ok ? await visitsRes.json() : [];
    const buddyShops: BuddyVisitedShop[] = buddyShopsRes.ok ? await buddyShopsRes.json() : [];

    // A shop can have multiple visits; the map only needs one marker per shop.
    const coffeeShops: CoffeeShop[] = Array.from(
        new Map(visits.map((visit) => [visit.coffeeShopId, visit.coffeeShop])).values()
    );

    return (
        <div className="flex flex-col gap-8">
            <DashboardMap coffeeShops={coffeeShops} buddyShops={buddyShops}/>
        </div>
    );
}
