"use client";

import Icon from "@mdi/react";
import { mdiCheck, mdiClose } from "@mdi/js";

interface StatusIconProps {
    value: boolean | undefined;
    label?: string;
}

export function StatusIcon({ value, label }: StatusIconProps) {
    return (
        <span className="inline-flex items-center gap-1">
            {label && <span>{label}:</span>}
            {value ? <Icon path={mdiCheck} size={0.7} className="text-green-600" /> : <Icon path={mdiClose} size={0.7} className="text-muted-foreground" />}
        </span>
    );
}
