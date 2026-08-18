"use client"

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import styles from "./dialog.module.scss";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

function DialogBackdrop({ className, ...props}: DialogPrimitive.Backdrop.Props) {
    return (
        <DialogPrimitive.Backdrop
            data-slot={"dialog-backdrop"}
            {...props}
            className={cn("fixed inset-0 z-[1000]", styles.backdrop, className)}
        />
    );
}

function DialogPopup({ className, children, ...props }: DialogPrimitive.Popup.Props) {
    return (
        <DialogPortal>
            <DialogBackdrop />
            <DialogPrimitive.Popup
                data-slot="dialog-popup"
                className={cn(
                    "fixed top-1/2 left-1/2 z-[1001] w-full max-w-sm p-6 outline-none",
                    styles.popup,
                    className
                )}
                {...props}
            >
                {children}
            </DialogPrimitive.Popup>
        </DialogPortal>
    );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn("text-lg font-bold tracking-tight", styles.title, className)}
            {...props}
        />
    );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn("text-sm", styles.description, className)}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogTrigger,
    DialogClose,
    DialogPortal,
    DialogBackdrop,
    DialogPopup,
    DialogTitle,
    DialogDescription,
};
