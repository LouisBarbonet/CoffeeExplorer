import type { MetadataRoute } from "next";

// A personal coffee journal, not a public product -- no reason for search
// engines to index it.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            disallow: "/",
        },
    };
}
