"use client";

import { Bean } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import styles from "./star-rating.module.scss";

interface StarRatingProps {
    value: number;
    onChange?: (value: number) => void;
    className?: string;
}

export function StarRating({ value, onChange, className }: StarRatingProps) {
    const readOnly = !onChange;

    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {[1, 2, 3, 4, 5].map((bean) => (
                <motion.button
                    key={bean}
                    type="button"
                    disabled={readOnly}
                    onClick={() => onChange?.(bean)}
                    whileTap={readOnly ? undefined : { scale: 1.3, rotate: -10 }}
                    className={cn("disabled:cursor-default", !readOnly && "cursor-pointer")}
                    aria-label={`Rate ${bean} out of 5`}
                >
                    <Bean className={cn("size-5", styles.bean, bean <= value ? styles.filled : styles.empty)} />
                </motion.button>
            ))}
        </div>
    );
}
