import { serverFetch } from "@/lib/server-api";
import type { CoffeeShop } from "@/lib/api/coffee-shop";
import type { Visit } from "@/lib/api/visit";
import {DashboardMap} from "@/components/dashboard-map";


export default async function DashboardPage() {

    const visitsRes = await serverFetch("/visits");
    const visits: Visit[] = visitsRes.ok ? await visitsRes.json() : [];

    // A shop can have multiple visits; the map only needs one marker per shop.
    const coffeeShops: CoffeeShop[] = Array.from(
        new Map(visits.map((visit) => [visit.coffeeShopId, visit.coffeeShop])).values()
    );

    return (
        <div className="flex flex-col gap-8">
            <DashboardMap coffeeShops={coffeeShops}/>
        </div>
    );
}
