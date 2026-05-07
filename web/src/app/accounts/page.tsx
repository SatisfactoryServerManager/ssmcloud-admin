"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SearchBar } from "@/components/shared/SearchBar";
import { Pagination } from "@/components/shared/Pagination";
import { EntityCard } from "@/components/shared/EntityCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DetailGrid, DetailItem } from "@/components/shared/DetailGrid";
import { EditAccountDialog, AccountActions } from "@/components/accounts/EditAccountDialog";
import { Badge } from "@/components/ui/badge";
import type { Account } from "@/types/api";
import { listAccounts, deleteAccount } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editAccount, setEditAccount] = useState<Account | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const fetch = useCallback(async (s: string, p: number, ps: number) => {
        setLoading(true);
        setError(null);
        try {
            const r = await listAccounts({ search: s, page: p, page_size: ps });
            setAccounts(r.accounts ?? []);
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
            await deleteAccount({ account_id: deleteId });
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
                <h1 className="text-2xl font-semibold">Accounts</h1>

                {error && <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>}

                <SearchBar placeholder="Search by name or join code…" total={total} onSearch={handleSearch} defaultPageSize={50} />

                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                ) : (
                    <div className="space-y-2">
                        {accounts.map((a) => (
                            <EntityCard
                                key={a.id}
                                title={a.account_name || "(no name)"}
                                subtitle={
                                    <span className="flex flex-wrap items-center gap-3">
                                        <span>
                                            Join code: <code className="font-mono">{a.join_code || "—"}</code>
                                        </span>
                                        {a.inactivity_state?.inactive && <Badge variant="warning">Inactive</Badge>}
                                    </span>
                                }
                                actions={<AccountActions account={a} onEdit={setEditAccount} onDelete={setDeleteId} />}
                                details={
                                    <DetailGrid>
                                        <DetailItem label="ID">
                                            <code className="text-xs">{a.id}</code>
                                        </DetailItem>
                                        <DetailItem label="Audits">{a.audit?.length ?? 0}</DetailItem>
                                        <DetailItem label="Integrations">{a.integrations?.length ?? 0}</DetailItem>
                                        <DetailItem label="Inactive since">{formatDate(a.inactivity_state?.date_inactive)}</DetailItem>
                                        <DetailItem label="Delete date">{formatDate(a.inactivity_state?.delete_date)}</DetailItem>
                                        <DetailItem label="Created">{formatDate(a.created_at)}</DetailItem>
                                        <DetailItem label="Updated">{formatDate(a.updated_at)}</DetailItem>
                                    </DetailGrid>
                                }
                            />
                        ))}

                        {accounts.length === 0 && <p className="text-sm text-muted-foreground">No accounts found.</p>}
                    </div>
                )}

                <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
            </div>

            <EditAccountDialog account={editAccount} open={!!editAccount} onClose={() => setEditAccount(null)} onSaved={() => fetch(search, page, pageSize)} />

            <ConfirmDialog
                open={!!deleteId}
                title="Delete Account"
                description="This will permanently delete the account and all its data. This cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                loading={deleteLoading}
            />
        </AppShell>
    );
}
