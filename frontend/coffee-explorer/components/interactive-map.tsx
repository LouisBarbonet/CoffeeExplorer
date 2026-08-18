// @/components/dashboard-map.tsx
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CoffeeShop } from "@/lib/api/coffee-shop";
import styles from "./interactive-map.module.scss";

interface InteractiveMapProps {
    coffeeShops: CoffeeShop[];
    addMode: boolean;
    pendingMarker: { lat: number; lng: number } | null;
    onMapClick: (lat: number, lng: number) => void;
    onAddVisitClick: (coffeeShopId: string) => void;
}

// Raw path data from lucide-react's "Coffee" icon (24x24 viewBox) -- Leaflet's
// divIcon takes a plain HTML string, not a React component, so the icon
// can't be rendered via <Coffee /> here.
const COFFEE_CUP_SVG = `
    <svg class="${styles.pinIcon}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 2v2" />
        <path d="M14 2v2" />
        <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
        <path d="M6 2v2" />
    </svg>
`;

function createPinIcon(pending: boolean) {
    return L.divIcon({
        className: pending ? `${styles.pin} ${styles.pinPending}` : styles.pin,
        html: COFFEE_CUP_SVG,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
    });
}

export function InteractiveMap({ coffeeShops, addMode, pendingMarker, onMapClick, onAddVisitClick }: InteractiveMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const pendingMarkerRef = useRef<L.Marker | null>(null);

    // Kept up to date every render so the single click listener registered
    // below (once, at map creation) always sees the latest values instead of
    // closing over whatever addMode/onMapClick were at mount time.
    const addModeRef = useRef(addMode);
    useEffect(() => {
        addModeRef.current = addMode;
    }, [addMode]);

    const onMapClickRef = useRef(onMapClick);
    useEffect(() => {
        onMapClickRef.current = onMapClick;
    }, [onMapClick]);

    const onAddVisitClickRef = useRef(onAddVisitClick);
    useEffect(() => {
        onAddVisitClickRef.current = onAddVisitClick;
    }, [onAddVisitClick]);


    useEffect(() => {
        // Setup map canvas instance if missing
        if (!mapRef.current && mapContainerRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView([45.5017, -73.5673], 12); // Montreal

            L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
            }).addTo(mapRef.current);

            mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
                if (addModeRef.current) {
                    onMapClickRef.current(e.latlng.lat, e.latlng.lng);
                }
            });

            // Popups are torn down and rebuilt by Leaflet on every open/close,
            // so re-attaching this listener each time is safe -- there's no
            // stale DOM node left around to accumulate duplicate listeners on.
            mapRef.current.on("popupopen", (e: L.PopupEvent) => {
                const popupEl = e.popup.getElement();
                const button = popupEl?.querySelector<HTMLButtonElement>(".add-visit-btn");
                const shopId = button?.dataset.shopId;
                if (!button || !shopId) return;

                button.addEventListener("click", () => {
                    onAddVisitClickRef.current(shopId);
                });
            });
        }

        const map = mapRef.current;
        if (!map) return;

        const markersLayer = L.layerGroup().addTo(map);
        const pinIcon = createPinIcon(false);

        coffeeShops.forEach((shop) => {
            // Validate that the nested location object exists and holds values
            if (!shop.location?.latitude || !shop.location?.longitude) return;

            const popupEl = document.createElement("div");
            popupEl.className = styles.popup;

            if (shop.photos && shop.photos.length > 0) {
                const img = document.createElement("img");
                img.src = shop.photos[0].url;
                img.alt = shop.name;
                img.className = styles.popupImage;
                popupEl.appendChild(img);
            }

            const title = document.createElement("h3");
            title.className = styles.popupTitle;
            title.textContent = shop.name;
            popupEl.appendChild(title);

            const description = document.createElement("p");
            description.className = styles.popupDescription;
            description.textContent = shop.description || "No description available.";
            popupEl.appendChild(description);

            if (shop.location.address) {
                const address = document.createElement("p");
                address.className = styles.popupAddress;
                address.textContent = shop.location.address;
                popupEl.appendChild(address);
            }

            const actions = document.createElement("div");
            actions.className = styles.popupActions;

            const addVisitButton = document.createElement("button");
            addVisitButton.type = "button";
            addVisitButton.className = `add-visit-btn ${styles.addVisitBtn}`;
            addVisitButton.dataset.shopId = shop.id;
            addVisitButton.textContent = "+ Add Visit";
            actions.appendChild(addVisitButton);

            const historyLink = document.createElement("a");
            historyLink.href = `/coffee-shops/${shop.id}`;
            historyLink.className = styles.historyLink;
            historyLink.textContent = "View history";
            actions.appendChild(historyLink);

            popupEl.appendChild(actions);

            L.marker([shop.location.latitude, shop.location.longitude], { icon: pinIcon })
                .addTo(markersLayer)
                .bindPopup(popupEl);
        });

        return () => {
            markersLayer.remove();
        };
    }, [coffeeShops]);

    // Toggle a crosshair cursor while add-mode is active, as a visual hint
    // that the next click on the map places a marker.
    useEffect(() => {
        if (mapContainerRef.current) {
            mapContainerRef.current.style.cursor = addMode ? "crosshair" : "";
        }
    }, [addMode]);

    // Render (or clear) the single temporary marker dropped by an add-mode click.
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        pendingMarkerRef.current?.remove();
        pendingMarkerRef.current = null;

        if (pendingMarker) {
            pendingMarkerRef.current = L.marker([pendingMarker.lat, pendingMarker.lng], {
                icon: createPinIcon(true),
            }).addTo(map);
        }
    }, [pendingMarker]);

    return <div ref={mapContainerRef} className={`h-[450px] w-full ${styles.mapContainer}`} />;
}
