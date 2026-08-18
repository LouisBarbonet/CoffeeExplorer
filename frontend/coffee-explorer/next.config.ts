import type { NextConfig } from "next";

const backendInternalUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:4000";

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
