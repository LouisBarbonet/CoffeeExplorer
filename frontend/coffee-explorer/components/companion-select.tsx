"use client";

import { useQuery } from "@tanstack/react-query";
import { listBuddies } from "@/lib/api/buddies";
import { Label } from "@/components/ui/label";
import styles from "./companion-select.module.scss";

interface CompanionSelectProps {
    value: string[];
    onChange: (companionIds: string[]) => void;
}

export function CompanionSelect({ value, onChange }: CompanionSelectProps) {
    const { data: buddies, isLoading } = useQuery({
        queryKey: ["buddies"],
        queryFn: listBuddies,
    });

    if (isLoading) return null;
    if (!buddies || buddies.length === 0) return null;

    function toggle(buddyId: string) {
        onChange(value.includes(buddyId) ? value.filter((id) => id !== buddyId) : [...value, buddyId]);
    }

    return (
        <div className="flex flex-col gap-2">
            <Label>Who did you go with?</Label>
            <div className={styles.list}>
                {buddies.map((buddy) => (
                    <label key={buddy.id} className={styles.option}>
                        <input
                            type="checkbox"
                            checked={value.includes(buddy.id)}
                            onChange={() => toggle(buddy.id)}
                        />
                        {buddy.name}
                    </label>
                ))}
            </div>
        </div>
    );
}
