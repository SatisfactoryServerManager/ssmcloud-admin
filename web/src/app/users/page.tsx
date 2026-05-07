"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SearchBar } from "@/components/shared/SearchBar";
import { Pagination } from "@/components/shared/Pagination";
import { EntityCard } from "@/components/shared/EntityCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DetailGrid, DetailItem } from "@/components/shared/DetailGrid";
import { EditUserDialog, UserActions } from "@/components/users/EditUserDialog";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/types/api";
import { listUsers, deleteUser } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editUser, setEditUser] = useState<User | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const fetch = useCallback(async (s: string, p: number, ps: number) => {
        setLoading(true);
        setError(null);
        try {
            const r = await listUsers({ search: s, page: p, page_size: ps });
            setUsers(r.users ?? []);
            setTotal(r.total ?? 0);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch(search, page, pageSize);
    }, [fetch, search, page, pageSize]);

    const handleSearch = (s: string, ps: number) => {
        setSearch(s);
        setPageSize(ps);
        setPage(1);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleteLoading(true);
        try {
            await deleteUser({ user_id: deleteId });
            setDeleteId(null);
            fetch(search, page, pageSize);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <AppShell>
            <div className="space-y-4">
                <h1 className="text-2xl font-semibold">Users</h1>

                {error && <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>}

                <SearchBar placeholder="Search by email, username or external ID…" total={total} onSearch={handleSearch} defaultPageSize={50} />

                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                ) : (
                    <div className="space-y-2">
                        {users.map((u) => (
                            <EntityCard
                                key={u.id}
                                title={u.email || "(no email)"}
                                subtitle={<span>Last active: {formatDate(u.last_active)}</span>}
                                actions={<UserActions user={u} onEdit={setEditUser} onDelete={setDeleteId} />}
                                details={
                                    <DetailGrid>
                                        <DetailItem label="ID">
                                            <code className="text-xs">{u.id}</code>
                                        </DetailItem>
                                        <DetailItem label="External ID">{u.external_id || "—"}</DetailItem>
                                        <DetailItem label="Username">{u.username || "—"}</DetailItem>
                                        <DetailItem label="API Keys">{u.api_keys?.length ?? 0}</DetailItem>
                                        <DetailItem label="Profile Image">
                                            {u.profile_image_url ? (
                                                <a href={u.profile_image_url} target="_blank" rel="noreferrer" className="text-primary underline">
                                                    open
                                                </a>
                                            ) : (
                                                "—"
                                            )}
                                        </DetailItem>
                                        <DetailItem label="Created">{formatDate(u.created_at)}</DetailItem>
                                        <DetailItem label="Updated">{formatDate(u.updated_at)}</DetailItem>
                                    </DetailGrid>
                                }
                            />
                        ))}

                        {users.length === 0 && <p className="text-sm text-muted-foreground">No users found.</p>}
                    </div>
                )}

                <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
            </div>

            <EditUserDialog user={editUser} open={!!editUser} onClose={() => setEditUser(null)} onSaved={() => fetch(search, page, pageSize)} />

            <ConfirmDialog
                open={!!deleteId}
                title="Delete User"
                description="This will permanently delete the user. This cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                loading={deleteLoading}
            />
        </AppShell>
    );
}
