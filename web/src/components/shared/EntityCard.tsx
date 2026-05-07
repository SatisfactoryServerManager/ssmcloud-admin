"use client";

import { useState } from "react";
import Icon from "@mdi/react";
import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EntityCardProps {
    title: string;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    details?: React.ReactNode;
    defaultExpanded?: boolean;
}

export function EntityCard({ title, subtitle, actions, details, defaultExpanded = false }: EntityCardProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <Card>
            <CardContent className="py-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{title}</p>
                        {subtitle && <div className="mt-0.5 text-sm text-muted-foreground">{subtitle}</div>}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        {actions}
                        {details && (
                            <Button variant="outline" size="icon" className="h-8 w-8" title={expanded ? "Hide details" : "Show details"} onClick={() => setExpanded((v) => !v)}>
                                <Icon path={expanded ? mdiChevronUp : mdiChevronDown} size={0.75} />
                            </Button>
                        )}
                    </div>
                </div>

                {expanded && details && <div className="mt-3 border-t pt-3">{details}</div>}
            </CardContent>
        </Card>
    );
}
