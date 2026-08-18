import styles from "./doodle-scatter.module.scss";

interface DoodleScatterProps {
    className?: string;
}

/**
 * Decorative scatter of hand-drawn coffee beans, a steam swirl, and sparkles.
 * Replaces the old TopoLines (hiking-trail) motif with something that
 * actually belongs in a coffee journal. Purely decorative -- no interaction.
 */
export function DoodleScatter({ className }: DoodleScatterProps) {
    return (
        <svg
            viewBox="0 0 400 480"
            fill="none"
            aria-hidden="true"
            className={className}
        >
            {/* Steam swirl */}
            <path
                d="M120,120 C132,102 108,86 120,68 C132,50 108,34 120,16"
                stroke="var(--latte)"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.55"
            />

            {/* Coffee beans */}
            <g transform="translate(70 200) rotate(-18)">
                <ellipse cx="0" cy="0" rx="20" ry="28" fill="var(--mocha-soft)" opacity="0.22" />
                <path d="M0,-24 Q9,0 0,24" stroke="var(--foam)" strokeWidth="3" fill="none" opacity="0.6" />
            </g>
            <g transform="translate(330 140) rotate(24)">
                <ellipse cx="0" cy="0" rx="15" ry="21" fill="var(--blush)" opacity="0.3" />
                <path d="M0,-18 Q7,0 0,18" stroke="var(--foam)" strokeWidth="2.5" fill="none" opacity="0.6" />
            </g>
            <g transform="translate(300 380) rotate(-8)">
                <ellipse cx="0" cy="0" rx="17" ry="24" fill="var(--lilac)" opacity="0.28" />
                <path d="M0,-20 Q8,0 0,20" stroke="var(--foam)" strokeWidth="3" fill="none" opacity="0.6" />
            </g>

            {/* Sparkles */}
            <path
                className={styles.sparkle}
                d="M60,60 C61,67 63,69 70,70 C63,71 61,73 60,80 C59,73 57,71 50,70 C57,69 59,67 60,60 Z"
                fill="var(--blush)"
                opacity="0.7"
            />
            <path
                className={styles.sparkleDelayed}
                d="M250,60 C251,65 253,67 258,68 C253,69 251,71 250,76 C249,71 247,69 242,68 C247,67 249,65 250,60 Z"
                fill="var(--lilac)"
                opacity="0.7"
            />
            <path
                className={styles.sparkle}
                d="M200,430 C201,436 203,438 209,439 C203,440 201,442 200,448 C199,442 197,440 191,439 C197,438 199,436 200,430 Z"
                fill="var(--blush)"
                opacity="0.6"
            />
        </svg>
    );
}
