export type ApiError = { error: string };

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
        // If auth is enabled server-side, the API will return 401.
        // Redirect the browser to start the OIDC flow.
        if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
        }
    }

    if (!res.ok) {
        const body = await readJson<ApiError>(res).catch(() => ({ error: res.statusText }));
        throw new Error(body.error || res.statusText);
    }

    return readJson<T>(res);
}

export type Timestamp = string | null;

export type UserAPIKey = {
    short_key?: string;
    key?: string;
};

export type User = {
    id: string;
    external_id?: string;
    email?: string;
    username?: string;
    profile_image_url?: string;
    api_keys?: UserAPIKey[];
    last_active?: Timestamp;
    created_at?: Timestamp;
    updated_at?: Timestamp;
};

export type AccountAudit = {
    id?: string;
    type?: string;
    message?: string;
    created_at?: Timestamp;
};

export type AccountIntegration = {
    id?: string;
    name?: string;
    type?: number;
    url?: string;
    event_types?: string[];
    created_at?: Timestamp;
    updated_at?: Timestamp;
};

export type AccountInactivityState = {
    inactive?: boolean;
    date_inactive?: Timestamp;
    delete_date?: Timestamp;
};

export type Account = {
    id: string;
    account_name?: string;
    join_code?: string;
    audit?: AccountAudit[];
    integrations?: AccountIntegration[];
    inactivity_state?: AccountInactivityState;
    created_at?: Timestamp;
    updated_at?: Timestamp;
};

export type AgentStatus = {
    online?: boolean;
    installed?: boolean;
    running?: boolean;
    cpu?: number;
    ram?: number;
    installed_sf_version?: number;
    latest_sf_version?: number;
    last_comm_date?: Timestamp;
};

export type Agent = {
    id: string;
    agent_name?: string;
    api_key?: string;
    latest_agent_version?: string;
    status?: AgentStatus;
    created_at?: Timestamp;
    updated_at?: Timestamp;
};

export type ListUsersResponse = { users: User[]; total: number };
export type ListAccountsResponse = { accounts: Account[]; total: number };
export type ListAgentsResponse = { agents: Agent[]; total: number };
export type ListUserAccountsResponse = { accounts: Account[]; active_account_id?: string };

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

export function listUserAccounts(params: { user_id: string }) {
    const qs = new URLSearchParams();
    qs.set("user_id", params.user_id);
    return request<ListUserAccountsResponse>(`/api/users/accounts?${qs.toString()}`);
}

export function addUserToAccount(body: { user_id: string; account_id: string; set_active?: boolean }) {
    return request(`/api/users/accounts/add`, { method: "POST", body: JSON.stringify(body) });
}

export function removeUserFromAccount(body: { user_id: string; account_id: string }) {
    return request(`/api/users/accounts/remove`, { method: "POST", body: JSON.stringify(body) });
}

export function setUserActiveAccount(body: { user_id: string; account_id: string }) {
    return request(`/api/users/accounts/set-active`, { method: "POST", body: JSON.stringify(body) });
}
