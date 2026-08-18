import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS applies its own rounded-corner ("squircle") mask automatically, so this
// stays a full-bleed square rather than pre-rounding the corners itself.
export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#F2AFC0",
                }}
            >
                <svg width="108" height="108" viewBox="0 0 24 24" fill="none" stroke="#FFFBF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2v2" />
                    <path d="M14 2v2" />
                    <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
                    <path d="M6 2v2" />
                </svg>
            </div>
        ),
        { ...size }
    );
}
