import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(ts: string | null | undefined): string {
    if (!ts) return "—";
    try {
        return new Date(ts).toLocaleString();
    } catch {
        return ts;
    }
}

export function formatNumber(n: number | null | undefined): string {
    if (n == null) return "—";
    return n.toLocaleString();
}
