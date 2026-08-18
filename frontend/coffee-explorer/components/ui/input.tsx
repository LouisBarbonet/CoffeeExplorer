import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"
import styles from "./input.module.scss"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <InputPrimitive
            type={type}
            data-slot="input"
            className={cn(
                "h-9 w-full min-w-0 px-3 py-1.5 text-base outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm disabled:pointer-events-none disabled:cursor-not-allowed",
                styles.input,
                className
            )}
            {...props}
        />
    )
}

export { Input }
