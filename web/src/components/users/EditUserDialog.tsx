"use client";

import { useEffect, useState } from "react";
import Icon from "@mdi/react";
import { mdiPencilOutline, mdiTrashCanOutline, mdiAccountPlus, mdiAccountMinus, mdiStar, mdiStarOutline } from "@mdi/js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { User, Account } from "@/types/api";
import { updateUser, listUserAccounts, listAccounts, addUserToAccount, removeUserFromAccount, setUserActiveAccount } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface EditUserDialogProps {
    user: User | null;
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
}

export function EditUserDialog({ user, open, onClose, onSaved }: EditUserDialogProps) {
    const [externalId, setExternalId] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");

    const [userAccounts, setUserAccounts] = useState<Account[]>([]);
    const [activeAccountId, setActiveAccountId] = useState<string | undefined>();
    const [allAccounts, setAllAccounts] = useState<Account[]>([]);
    const [addAccountId, setAddAccountId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        setExternalId(user.external_id ?? "");
        setEmail(user.email ?? "");
        setUsername(user.username ?? "");
        setError(null);

        listUserAccounts({ user_id: user.id })
            .then((r) => {
                setUserAccounts(r.accounts ?? []);
                setActiveAccountId(r.active_account_id);
            })
            .catch(() => {});

        listAccounts({ page_size: 200 })
            .then((r) => setAllAccounts(r.accounts ?? []))
            .catch(() => {});
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            await updateUser({
                user_id: user.id,
                external_id: externalId,
                email,
                username,
            });
            onSaved();
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    const handleAddAccount = async () => {
        if (!user || !addAccountId) return;
        setLoading(true);
        try {
            await addUserToAccount({ user_id: user.id, account_id: addAccountId });
            const r = await listUserAccounts({ user_id: user.id });
            setUserAccounts(r.accounts ?? []);
            setActiveAccountId(r.active_account_id);
            setAddAccountId("");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAccount = async (accountId: string) => {
        if (!user) return;
        setLoading(true);
        try {
            await removeUserFromAccount({ user_id: user.id, account_id: accountId });
            const r = await listUserAccounts({ user_id: user.id });
            setUserAccounts(r.accounts ?? []);
            setActiveAccountId(r.active_account_id);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    const handleSetActive = async (accountId: string) => {
        if (!user) return;
        setLoading(true);
        try {
            await setUserActiveAccount({ user_id: user.id, account_id: accountId });
            setActiveAccountId(accountId);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    const availableToAdd = allAccounts.filter((a) => !userAccounts.find((ua) => ua.id === a.id));

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                </DialogHeader>

                {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

                <div className="space-y-3">
                    <div>
                        <Label>User ID</Label>
                        <Input value={user?.id ?? ""} readOnly className="mt-1 font-mono text-xs" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>API Keys</Label>
                            <Input value={user?.api_keys?.length ?? 0} readOnly className="mt-1" />
                        </div>
                        <div>
                            <Label>Last Active</Label>
                            <Input value={formatDate(user?.last_active)} readOnly className="mt-1" />
                        </div>
                    </div>

                    <div>
                        <Label>Profile Image URL</Label>
                        <Input value={user?.profile_image_url ?? ""} readOnly className="mt-1" />
                    </div>

                    <Separator />

                    <div>
                        <Label htmlFor="ext-id">External ID</Label>
                        <Input id="ext-id" value={externalId} onChange={(e) => setExternalId(e.target.value)} className="mt-1" />
                    </div>

                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
                    </div>

                    <div>
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" />
                    </div>

                    <Separator />

                    <div>
                        <p className="mb-2 text-sm font-medium">Accounts</p>
                        {userAccounts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No accounts.</p>
                        ) : (
                            <ul className="space-y-1.5">
                                {userAccounts.map((a) => (
                                    <li key={a.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                                        <span className="flex items-center gap-2">
                                            {a.account_name || a.id}
                                            {a.id === activeAccountId && (
                                                <Badge variant="success" className="text-xs">
                                                    Active
                                                </Badge>
                                            )}
                                        </span>
                                        <span className="flex gap-1">
                                            {a.id !== activeAccountId && (
                                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Set active" onClick={() => handleSetActive(a.id)} disabled={loading}>
                                                    <Icon path={mdiStarOutline} size={0.65} />
                                                </Button>
                                            )}
                                            {a.id === activeAccountId && (
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-yellow-500" title="Active account" disabled>
                                                    <Icon path={mdiStar} size={0.65} />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Remove" onClick={() => handleRemoveAccount(a.id)} disabled={loading}>
                                                <Icon path={mdiAccountMinus} size={0.65} />
                                            </Button>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {availableToAdd.length > 0 && (
                            <div className="mt-2 flex gap-2">
                                <select
                                    className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                    value={addAccountId}
                                    onChange={(e) => setAddAccountId(e.target.value)}
                                >
                                    <option value="">Add to account…</option>
                                    {availableToAdd.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.account_name || a.id}
                                        </option>
                                    ))}
                                </select>
                                <Button variant="outline" size="icon" disabled={!addAccountId || loading} onClick={handleAddAccount}>
                                    <Icon path={mdiAccountPlus} size={0.75} />
                                </Button>
                            </div>
                        )}
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

interface UserActionsProps {
    user: User;
    onEdit: (user: User) => void;
    onDelete: (id: string) => void;
}

export function UserActions({ user, onEdit, onDelete }: UserActionsProps) {
    return (
        <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" title="Edit" onClick={() => onEdit(user)}>
                <Icon path={mdiPencilOutline} size={0.65} />
            </Button>
            <Button variant="destructive" size="icon" className="h-8 w-8" title="Delete" onClick={() => onDelete(user.id)}>
                <Icon path={mdiTrashCanOutline} size={0.65} />
            </Button>
        </div>
    );
}
