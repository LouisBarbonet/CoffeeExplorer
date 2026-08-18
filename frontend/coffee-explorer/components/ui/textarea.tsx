import * as React from "react"

import { cn } from "@/lib/utils"
import styles from "./textarea.module.scss"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn("w-full min-w-0 px-3 py-2 text-base outline-none md:text-sm", styles.textarea, className)}
            {...props}
        />
    )
}

export { Textarea }
