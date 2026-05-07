export type Timestamp = string | null | undefined;

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
export type ListUserAccountsResponse = {
    accounts: Account[];
    active_account_id?: string;
};
