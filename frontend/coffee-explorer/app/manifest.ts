import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "CoffeeExplorer",
        short_name: "CoffeeExplorer",
        description: "Your personal coffee-shop passport -- log the cafes you visit, rate them, and stamp your journal.",
        start_url: "/",
        display: "standalone",
        background_color: "#F7EEE1",
        theme_color: "#F2AFC0",
        icons: [
            {
                src: "/icon",
                sizes: "32x32",
                type: "image/png",
            },
            {
                src: "/apple-icon",
                sizes: "180x180",
                type: "image/png",
            },
        ],
    };
}
