import type { NextConfig } from "next";

// output: "standalone" bakes rewrites() in at `next build` time, not at
// container startup -- so this fallback (not the runtime env var) is what
// actually matters for the prod Docker image, since the CI build never
// passes BACKEND_INTERNAL_URL. "backend" is the Docker Compose service name
// and is correct in every context that image ever runs in (local
// `--profile container` testing and the real VM alike); native host dev
// always overrides this via frontend/coffee-explorer/.env.local instead.
const backendInternalUrl = process.env.BACKEND_INTERNAL_URL ?? "http://backend:4000";

const nextConfig: NextConfig = {
    // Self-contained server.js + minimal node_modules -- required for the
    // slim prod Docker image (see frontend/coffee-explorer/Dockerfile).
    output: "standalone",
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: `${backendInternalUrl}/api/:path*`,
            },
            {
                source: "/uploads/:path*",
                destination: `${backendInternalUrl}/uploads/:path*`,
            }
        ]
    }
};

export default nextConfig;
