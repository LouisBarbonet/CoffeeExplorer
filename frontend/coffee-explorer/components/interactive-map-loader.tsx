"use client";

import dynamic from "next/dynamic";

export const InteractiveMap = dynamic(
    () => import("@/components/interactive-map").then((mod) => mod.InteractiveMap),
    { ssr: false }
);