"use client";

import { useState } from "react";
import Icon from "@mdi/react";
import { mdiMagnify } from "@mdi/js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchBarProps {
    placeholder?: string;
    total?: number;
    onSearch: (search: string, pageSize: number) => void;
    defaultPageSize?: number;
}

export function SearchBar({ placeholder = "Search…", total, onSearch, defaultPageSize = 50 }: SearchBarProps) {
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(String(defaultPageSize));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(search, Number(pageSize));
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-48">
                    <Label className="mb-1.5 block">Search</Label>
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={placeholder} />
                </div>

                <div className="w-28">
                    <Label className="mb-1.5 block">Page size</Label>
                    <Select
                        value={pageSize}
                        onValueChange={(v) => {
                            setPageSize(v);
                            onSearch(search, Number(v));
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[5, 10, 25, 50, 100].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {n}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button type="submit" className="gap-1.5">
                    <Icon path={mdiMagnify} size={0.75} />
                    Search
                </Button>
            </div>

            {total !== undefined && <p className="mt-2 text-sm text-muted-foreground">Total: {total.toLocaleString()}</p>}
        </form>
    );
}
