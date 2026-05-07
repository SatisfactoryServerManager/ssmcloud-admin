"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SearchBar } from "@/components/shared/SearchBar";
import { Pagination } from "@/components/shared/Pagination";
import { EntityCard } from "@/components/shared/EntityCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DetailGrid, DetailItem } from "@/components/shared/DetailGrid";
import { StatusIcon } from "@/components/shared/StatusIcon";
import { EditAgentDialog, AgentActions } from "@/components/agents/EditAgentDialog";
import type { Agent } from "@/types/api";
import { listAgents, deleteAgent } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editAgent, setEditAgent] = useState<Agent | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const fetch = useCallback(async (s: string, p: number, ps: number) => {
        setLoading(true);
        setError(null);
        try {
            const r = await listAgents({ search: s, page: p, page_size: ps });
            setAgents(r.agents ?? []);
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
            await deleteAgent({ agent_id: deleteId });
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
                <h1 className="text-2xl font-semibold">Agents</h1>

                {error && <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>}

                <SearchBar placeholder="Search by name or API key…" total={total} onSearch={handleSearch} defaultPageSize={50} />

                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                ) : (
                    <div className="space-y-2">
                        {agents.map((a) => (
                            <EntityCard
                                key={a.id}
                                title={a.agent_name || "(no name)"}
                                subtitle={
                                    <span className="flex flex-wrap items-center gap-4">
                                        <StatusIcon value={a.status?.online} label="Online" />
                                        <StatusIcon value={a.status?.installed} label="Installed" />
                                        <StatusIcon value={a.status?.running} label="Running" />
                                    </span>
                                }
                                actions={<AgentActions agent={a} onEdit={setEditAgent} onDelete={setDeleteId} />}
                                details={
                                    <DetailGrid>
                                        <DetailItem label="ID">
                                            <code className="text-xs">{a.id}</code>
                                        </DetailItem>
                                        <DetailItem label="API Key">
                                            <code className="text-xs">{a.api_key || "—"}</code>
                                        </DetailItem>
                                        <DetailItem label="CPU">{a.status?.cpu ?? "—"}</DetailItem>
                                        <DetailItem label="RAM">{a.status?.ram ?? "—"}</DetailItem>
                                        <DetailItem label="Agent Version">{a.latest_agent_version || "—"}</DetailItem>
                                        <DetailItem label="SF Version">{a.status?.installed_sf_version ?? "—"}</DetailItem>
                                        <DetailItem label="Latest SF Version">{a.status?.latest_sf_version ?? "—"}</DetailItem>
                                        <DetailItem label="Last Comm">{formatDate(a.status?.last_comm_date)}</DetailItem>
                                        <DetailItem label="Created">{formatDate(a.created_at)}</DetailItem>
                                        <DetailItem label="Updated">{formatDate(a.updated_at)}</DetailItem>
                                    </DetailGrid>
                                }
                            />
                        ))}

                        {agents.length === 0 && <p className="text-sm text-muted-foreground">No agents found.</p>}
                    </div>
                )}

                <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
            </div>

            <EditAgentDialog agent={editAgent} open={!!editAgent} onClose={() => setEditAgent(null)} onSaved={() => fetch(search, page, pageSize)} />

            <ConfirmDialog
                open={!!deleteId}
                title="Delete Agent"
                description="This will permanently delete the agent. This cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                loading={deleteLoading}
            />
        </AppShell>
    );
}
