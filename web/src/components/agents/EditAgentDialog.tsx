"use client";

import { useEffect, useState } from "react";
import Icon from "@mdi/react";
import { mdiPencilOutline, mdiTrashCanOutline } from "@mdi/js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Agent } from "@/types/api";
import { updateAgent } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface EditAgentDialogProps {
    agent: Agent | null;
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
}

export function EditAgentDialog({ agent, open, onClose, onSaved }: EditAgentDialogProps) {
    const [agentName, setAgentName] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!agent) return;
        setAgentName(agent.agent_name ?? "");
        setApiKey(agent.api_key ?? "");
        setError(null);
    }, [agent]);

    const handleSave = async () => {
        if (!agent) return;
        setLoading(true);
        setError(null);
        try {
            await updateAgent({
                agent_id: agent.id,
                agent_name: agentName,
                api_key: apiKey,
            });
            onSaved();
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Agent</DialogTitle>
                </DialogHeader>

                {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

                <div className="space-y-3">
                    <div>
                        <Label>Agent ID</Label>
                        <Input value={agent?.id ?? ""} readOnly className="mt-1 font-mono text-xs" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>CPU</Label>
                            <Input value={agent?.status?.cpu ?? "—"} readOnly className="mt-1" />
                        </div>
                        <div>
                            <Label>RAM</Label>
                            <Input value={agent?.status?.ram ?? "—"} readOnly className="mt-1" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Agent Version</Label>
                            <Input value={agent?.latest_agent_version ?? "—"} readOnly className="mt-1" />
                        </div>
                        <div>
                            <Label>SF Version</Label>
                            <Input value={agent?.status?.installed_sf_version ?? "—"} readOnly className="mt-1" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Last Comm</Label>
                            <Input value={formatDate(agent?.status?.last_comm_date)} readOnly className="mt-1" />
                        </div>
                        <div>
                            <Label>Created</Label>
                            <Input value={formatDate(agent?.created_at)} readOnly className="mt-1" />
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <Label htmlFor="agent-name">Agent Name</Label>
                        <Input id="agent-name" value={agentName} onChange={(e) => setAgentName(e.target.value)} className="mt-1" />
                    </div>

                    <div>
                        <Label htmlFor="api-key">API Key</Label>
                        <Input id="api-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="mt-1 font-mono" />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Saving…" : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface AgentActionsProps {
    agent: Agent;
    onEdit: (agent: Agent) => void;
    onDelete: (id: string) => void;
}

export function AgentActions({ agent, onEdit, onDelete }: AgentActionsProps) {
    return (
        <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" title="Edit" onClick={() => onEdit(agent)}>
                <Icon path={mdiPencilOutline} size={0.65} />
            </Button>
            <Button variant="destructive" size="icon" className="h-8 w-8" title="Delete" onClick={() => onDelete(agent.id)}>
                <Icon path={mdiTrashCanOutline} size={0.65} />
            </Button>
        </div>
    );
}
