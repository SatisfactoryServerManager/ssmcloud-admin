import type { ListUsersResponse, ListAccountsResponse, ListAgentsResponse, ListUserAccountsResponse } from "@/types/api";

async function readJson<T>(res: Response): Promise<T> {
    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        headers: {
            "content-type": "application/json",
            ...(init?.headers ?? {}),
        },
        ...init,
    });

    if (res.status === 401) {
        if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
        }
        return {} as T;
    }

    if (!res.ok) {
        const body = await readJson<{ error: string }>(res).catch(() => ({
            error: res.statusText,
        }));
        throw new Error(body.error || res.statusText);
    }

    return readJson<T>(res);
}

// ---- Users ----

export function listUsers(params: { search?: string; page?: number; page_size?: number }) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.page_size) qs.set("page_size", String(params.page_size));
    return request<ListUsersResponse>(`/api/users?${qs.toString()}`);
}

export function updateUser(body: { user_id: string; external_id?: string; email?: string; username?: string }) {
    return request(`/api/users/update`, { method: "POST", body: JSON.stringify(body) });
}

export function deleteUser(body: { user_id: string }) {
    return request(`/api/users/delete`, { method: "POST", body: JSON.stringify(body) });
}

// ---- Accounts ----

export function listAccounts(params: { search?: string; page?: number; page_size?: number }) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.page_size) qs.set("page_size", String(params.page_size));
    return request<ListAccountsResponse>(`/api/accounts?${qs.toString()}`);
}

export function updateAccount(body: { account_id: string; account_name?: string }) {
    return request(`/api/accounts/update`, { method: "POST", body: JSON.stringify(body) });
}

export function deleteAccount(body: { account_id: string }) {
    return request(`/api/accounts/delete`, { method: "POST", body: JSON.stringify(body) });
}

// ---- Agents ----

export function listAgents(params: { search?: string; page?: number; page_size?: number }) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.page_size) qs.set("page_size", String(params.page_size));
    return request<ListAgentsResponse>(`/api/agents?${qs.toString()}`);
}

export function updateAgent(body: { agent_id: string; agent_name?: string; api_key?: string }) {
    return request(`/api/agents/update`, { method: "POST", body: JSON.stringify(body) });
}

export function deleteAgent(body: { agent_id: string }) {
    return request(`/api/agents/delete`, { method: "POST", body: JSON.stringify(body) });
}

// ---- User Accounts ----

export function listUserAccounts(params: { user_id: string }) {
    const qs = new URLSearchParams({ user_id: params.user_id });
    return request<ListUserAccountsResponse>(`/api/users/accounts?${qs.toString()}`);
}

export function addUserToAccount(body: { user_id: string; account_id: string; set_active?: boolean }) {
    return request(`/api/users/accounts/add`, { method: "POST", body: JSON.stringify(body) });
}

export function removeUserFromAccount(body: { user_id: string; account_id: string }) {
    return request(`/api/users/accounts/remove`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export function setUserActiveAccount(body: { user_id: string; account_id: string }) {
    return request(`/api/users/accounts/set-active`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}
