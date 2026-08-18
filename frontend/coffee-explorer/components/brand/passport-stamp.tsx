"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import styles from "./passport-stamp.module.scss";

interface PassportStampProps {
    size?: "sm" | "md" | "lg";
    /** Play the "thunk" pop-in entrance -- use only for the moment a visit is freshly logged. */
    animate?: boolean;
    className?: string;
}

/**
 * The app's signature element: a hand-stamped passport mark representing a
 * visited coffee shop. Not decoration -- it *is* the visited state, made
 * physical.
 */
export function PassportStamp({ size = "md", animate = false, className }: PassportStampProps) {
    const ringId = useId();
    const prefersReducedMotion = useReducedMotion();

    const entrance = animate && !prefersReducedMotion
        ? {
              initial: { scale: 0, rotate: -35, opacity: 0 },
              animate: { scale: 1, rotate: -8, opacity: 1 },
              transition: { type: "spring" as const, stiffness: 420, damping: 14 },
          }
        : { initial: { rotate: -8 }, animate: { rotate: -8 } };

    return (
        <motion.svg
            viewBox="0 0 100 100"
            className={cn(styles.stamp, styles[size], className)}
            aria-label="Visited"
            role="img"
            {...entrance}
        >
            <defs>
                <path id={ringId} d="M50,12 a38,38 0 1,1 -0.1,0" />
            </defs>

            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--blush)" strokeWidth="3" strokeDasharray="3 4" opacity="0.8" />
            <circle cx="50" cy="50" r="34" fill="none" stroke="var(--blush)" strokeWidth="1.5" opacity="0.9" />

            <text fontSize="7" fill="var(--blush)" fontFamily="var(--font-pixel, monospace)" letterSpacing="1">
                <textPath href={`#${ringId}`} startOffset="4%">
                    • VISITED • CAFE PASSPORT •
                </textPath>
            </text>

            <g transform="translate(50 52)" stroke="var(--blush)" strokeWidth="2.5" fill="none" strokeLinecap="round">
                <path d="M-11,-6 h18 v9 a9,9 0 0 1 -18,0 z" />
                <path d="M7,-3 q8,0 8,5.5 q0,5.5 -8,5.5" />
                <path d="M-7,-11 q1,-4 3,0" strokeWidth="2" opacity="0.8" />
                <path d="M-1,-11 q1,-4 3,0" strokeWidth="2" opacity="0.8" />
            </g>
        </motion.svg>
    );
}
