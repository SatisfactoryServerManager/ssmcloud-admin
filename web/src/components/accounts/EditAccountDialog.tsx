"use client";

import { useEffect, useState } from "react";
import Icon from "@mdi/react";
import { mdiPencilOutline, mdiTrashCanOutline } from "@mdi/js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Account } from "@/types/api";
import { updateAccount } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface EditAccountDialogProps {
    account: Account | null;
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
}

export function EditAccountDialog({ account, open, onClose, onSaved }: EditAccountDialogProps) {
    const [accountName, setAccountName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!account) return;
        setAccountName(account.account_name ?? "");
        setError(null);
    }, [account]);

    const handleSave = async () => {
        if (!account) return;
        setLoading(true);
        setError(null);
        try {
            await updateAccount({ account_id: account.id, account_name: accountName });
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
                    <DialogTitle>Edit Account</DialogTitle>
                </DialogHeader>

                {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

                <div className="space-y-3">
                    <div>
                        <Label>Account ID</Label>
                        <Input value={account?.id ?? ""} readOnly className="mt-1 font-mono text-xs" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Join Code</Label>
                            <Input value={account?.join_code ?? ""} readOnly className="mt-1 font-mono" />
                        </div>
                        <div>
                            <Label>Status</Label>
                            <Input value={account?.inactivity_state?.inactive ? "Inactive" : "Active"} readOnly className="mt-1" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Audits</Label>
                            <Input value={account?.audit?.length ?? 0} readOnly className="mt-1" />
                        </div>
                        <div>
                            <Label>Integrations</Label>
                            <Input value={account?.integrations?.length ?? 0} readOnly className="mt-1" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Created</Label>
                            <Input value={formatDate(account?.created_at)} readOnly className="mt-1" />
                        </div>
                        <div>
                            <Label>Updated</Label>
                            <Input value={formatDate(account?.updated_at)} readOnly className="mt-1" />
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <Label htmlFor="account-name">Account Name</Label>
                        <Input id="account-name" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="mt-1" />
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

interface AccountActionsProps {
    account: Account;
    onEdit: (account: Account) => void;
    onDelete: (id: string) => void;
}

export function AccountActions({ account, onEdit, onDelete }: AccountActionsProps) {
    return (
        <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" title="Edit" onClick={() => onEdit(account)}>
                <Icon path={mdiPencilOutline} size={0.65} />
            </Button>
            <Button variant="destructive" size="icon" className="h-8 w-8" title="Delete" onClick={() => onDelete(account.id)}>
                <Icon path={mdiTrashCanOutline} size={0.65} />
            </Button>
        </div>
    );
}
