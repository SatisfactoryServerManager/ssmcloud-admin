"use client";

import { Button } from "@/components/ui/button";

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
}

function pageWindow(current: number, total: number): number[] {
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
        range.push(i);
    }
    return range;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = pageWindow(page, totalPages);

    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total.toLocaleString()} total)
            </p>

            <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(1)}>
                    First
                </Button>
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                    Prev
                </Button>

                {pages.map((p) => (
                    <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => onPageChange(p)}>
                        {p}
                    </Button>
                ))}

                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                    Next
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}>
                    Last
                </Button>
            </div>
        </div>
    );
}
