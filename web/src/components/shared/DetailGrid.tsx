"use client";

import { cn } from "@/lib/utils";

interface DetailGridProps {
    children: React.ReactNode;
    className?: string;
}

export function DetailGrid({ children, className }: DetailGridProps) {
    return <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2", className)}>{children}</dl>;
}

interface DetailItemProps {
    label: string;
    children: React.ReactNode;
}

export function DetailItem({ label, children }: DetailItemProps) {
    return (
        <div>
            <dt className="font-medium text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 break-all">{children}</dd>
        </div>
    );
}
