"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { motion } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import styles from "./button.module.scss"

const buttonLayout = cva(
    "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            size: {
                default: "h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
                xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
                sm: "h-8 gap-1 px-3 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
                lg: "h-11 gap-1.5 px-4 text-base has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
                icon: "size-9",
                "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
                "icon-sm": "size-8",
                "icon-lg": "size-11",
            },
        },
        defaultVariants: {
            size: "default",
        },
    }
)

const variantClass = {
    default: styles.default,
    outline: styles.outline,
    secondary: styles.secondary,
    ghost: styles.ghost,
    destructive: styles.destructive,
    link: styles.link,
} as const

type ButtonVariant = keyof typeof variantClass

function Button({
                    className,
                    variant = "default",
                    size = "default",
                    ...props
                }: ButtonPrimitive.Props & VariantProps<typeof buttonLayout> & { variant?: ButtonVariant }) {
    return (
        <ButtonPrimitive
            data-slot="button"
            render={<motion.button whileTap={{ scale: 0.95, y: 2 }} transition={{ duration: 0.1 }} />}
            className={cn(buttonLayout({ size }), styles.button, variantClass[variant], className)}
            {...props}
        />
    )
}

export { Button }
