<template>
    <div>
        <h2 class="h5">Users</h2>

        <div v-if="error" class="alert alert-danger" style="white-space: pre-wrap">{{ error }}</div>

        <div class="card mb-3">
            <div class="card-body">
                <div class="row g-2 align-items-end">
                    <div class="col-12 col-md-8">
                        <label class="form-label">Search (email/username/external id)</label>
                        <input v-model="search" class="form-control" />
                    </div>
                    <div class="col-6 col-md-2">
                        <label class="form-label">Page size</label>
                        <select v-model.number="pageSize" class="form-select" @change="onPageSizeChange">
                            <option :value="5">5</option>
                            <option :value="10">10</option>
                            <option :value="25">25</option>
                            <option :value="50">50</option>
                            <option :value="100">100</option>
                        </select>
                    </div>
                    <div class="col-12 col-md-2">
                        <button class="btn btn-primary w-100" @click="onSearch">Search</button>
                    </div>
                </div>

                <div class="mt-2 text-muted">Total: {{ total }}</div>
            </div>
        </div>

        <div class="table-responsive mb-4">
            <div class="vstack gap-2">
                <div v-for="u in users" :key="u.id" class="card">
                    <div class="card-body py-2">
                        <div class="d-flex align-items-start justify-content-between gap-3">
                            <div class="flex-grow-1">
                                <div class="fw-semibold">
                                    {{ u.email || "(no email)" }}
                                </div>
                                <div class="small text-muted">Last active: {{ fmt(u.last_active) || "—" }}</div>
                            </div>

                            <div class="text-end" style="white-space: nowrap">
                                <div class="d-inline-flex gap-1">
                                    <button
                                        class="btn btn-outline-secondary btn-sm"
                                        type="button"
                                        :title="expandedId === u.id ? 'Hide details' : 'Show details'"
                                        :aria-label="expandedId === u.id ? 'Hide details' : 'Show details'"
                                        @click="toggleDetails(u.id)"
                                    >
                                        <i class="fa-solid" :class="expandedId === u.id ? 'fa-chevron-up' : 'fa-chevron-down'" aria-hidden="true"></i>
                                    </button>
                                    <button class="btn btn-outline-primary btn-sm" type="button" title="Edit" aria-label="Edit" @click="openEdit(u)">
                                        <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                                    </button>
                                    <button class="btn btn-danger btn-sm" type="button" title="Delete" aria-label="Delete" @click="onDelete(u.id)">
                                        <i class="fa-solid fa-trash" aria-hidden="true"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div v-if="expandedId === u.id" class="mt-2 border-top pt-2">
                            <div class="row g-2 small">
                                <div class="col-12 col-md-6">
                                    <div class="text-muted">ID</div>
                                    <code>{{ u.id }}</code>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="text-muted">External ID</div>
                                    <div>{{ u.external_id || "" }}</div>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="text-muted">Username</div>
                                    <div>{{ u.username || "" }}</div>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="text-muted">Profile Image</div>
                                    <a v-if="u.profile_image_url" :href="u.profile_image_url" target="_blank" rel="noreferrer">open</a>
                                    <span v-else>—</span>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="text-muted">API Keys</div>
                                    <div>{{ u.api_keys?.length ?? 0 }}</div>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="text-muted">Timestamps</div>
                                    <div>Created: {{ fmt(u.created_at) || "—" }}</div>
                                    <div>Updated: {{ fmt(u.updated_at) || "—" }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
                <div class="text-muted small">Page {{ page }} of {{ totalPages }} ({{ total }} total)</div>
                <nav aria-label="Users pagination">
                    <ul class="pagination pagination-sm mb-0">
                        <li class="page-item" :class="{ disabled: page <= 1 }">
                            <a class="page-link" href="#" @click.prevent="goToPage(1)">First</a>
                        </li>
                        <li class="page-item" :class="{ disabled: page <= 1 }">
                            <a class="page-link" href="#" @click.prevent="goToPage(page - 1)">Prev</a>
                        </li>
                        <li v-for="p in pageNumbers" :key="p" class="page-item" :class="{ active: p === page }">
                            <a class="page-link" href="#" @click.prevent="goToPage(p)">{{ p }}</a>
                        </li>
                        <li class="page-item" :class="{ disabled: page >= totalPages }">
                            <a class="page-link" href="#" @click.prevent="goToPage(page + 1)">Next</a>
                        </li>
                        <li class="page-item" :class="{ disabled: page >= totalPages }">
                            <a class="page-link" href="#" @click.prevent="goToPage(totalPages)">Last</a>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>

        <div v-if="showEdit" class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" @click.self="closeEdit">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit User</h5>
                        <button type="button" class="btn-close" aria-label="Close" @click="closeEdit"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-2">
                            <label class="form-label">User ID</label>
                            <input class="form-control" :value="editUserId" readonly />
                        </div>
                        <div class="mb-2">
                            <label class="form-label">Profile Image URL</label>
                            <input class="form-control" :value="editProfileImageUrl" readonly />
                        </div>
                        <div class="row g-2">
                            <div class="col-12 col-md-4">
                                <label class="form-label">API Keys</label>
                                <input class="form-control" :value="String(editApiKeyCount)" readonly />
                            </div>
                            <div class="col-12 col-md-8">
                                <label class="form-label">Last Active</label>
                                <input class="form-control" :value="editLastActive" readonly />
                            </div>
                        </div>
                        <div class="mb-2">
                            <label class="form-label">External ID</label>
                            <input v-model="editExternalId" class="form-control" />
                        </div>
                        <div class="mb-2">
                            <label class="form-label">Email</label>
                            <input v-model="editEmail" class="form-control" />
                        </div>
                        <div class="mb-2">
                            <label class="form-label">Username</label>
                            <input v-model="editUsername" class="form-control" />
                        </div>

                        <div class="mt-3">
                            <div class="d-flex align-items-center justify-content-between">
                                <label class="form-label mb-0">Linked Accounts</label>
                                <button class="btn btn-outline-secondary btn-sm" type="button" title="Refresh" aria-label="Refresh" :disabled="linksBusy" @click="refreshLinks">
                                    <i class="fa-solid fa-rotate" aria-hidden="true"></i>
                                </button>
                            </div>

                            <div v-if="linksError" class="alert alert-danger mt-2" style="white-space: pre-wrap">{{ linksError }}</div>

                            <div class="row g-2 align-items-end mt-1">
                                <div class="col-12 col-md-7">
                                    <label class="form-label">Account ID</label>
                                    <input v-model="linkAccountId" class="form-control" placeholder="Account ObjectID" />
                                </div>
                                <div class="col-8 col-md-3">
                                    <div class="form-check">
                                        <input id="linkSetActive" v-model="linkSetActive" class="form-check-input" type="checkbox" />
                                        <label class="form-check-label" for="linkSetActive">set active</label>
                                    </div>
                                </div>
                                <div class="col-4 col-md-2">
                                    <button class="btn btn-primary w-100" type="button" :disabled="linksBusy || !linkAccountId" @click="onLinkAccount">
                                        <i class="fa-solid fa-link" aria-hidden="true"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="mt-2">
                                <div v-if="linksLoading" class="text-muted small">Loading…</div>
                                <div v-else-if="linkedAccounts.length === 0" class="text-muted small">No linked accounts.</div>
                                <div v-else class="list-group">
                                    <div v-for="a in linkedAccounts" :key="a.id" class="list-group-item d-flex align-items-start justify-content-between gap-2">
                                        <div class="flex-grow-1">
                                            <div class="fw-semibold">
                                                {{ a.account_name || a.id }}
                                                <span v-if="activeAccountId && activeAccountId === a.id" class="badge text-bg-success ms-2">Active</span>
                                            </div>
                                            <div class="small text-muted">
                                                <code>{{ a.id }}</code>
                                            </div>
                                        </div>
                                        <div class="d-inline-flex gap-1" style="white-space: nowrap">
                                            <button
                                                class="btn btn-outline-secondary btn-sm"
                                                type="button"
                                                title="Set active"
                                                aria-label="Set active"
                                                :disabled="linksBusy || activeAccountId === a.id"
                                                @click="onSetActive(a.id)"
                                            >
                                                <i class="fa-solid fa-star" aria-hidden="true"></i>
                                            </button>
                                            <button class="btn btn-danger btn-sm" type="button" title="Unlink" aria-label="Unlink" :disabled="linksBusy" @click="onUnlink(a.id)">
                                                <i class="fa-solid fa-link-slash" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeEdit">Cancel</button>
                        <button type="button" class="btn btn-primary" :disabled="saving" @click="saveEdit">
                            {{ saving ? "Saving..." : "Save" }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="showEdit" class="modal-backdrop fade show"></div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { addUserToAccount, deleteUser, listUserAccounts, listUsers, removeUserFromAccount, setUserActiveAccount, updateUser, type Account, type User } from "../api";

const search = ref("");
const page = ref(1);
const pageSize = ref(50);
const total = ref(0);
const users = ref<User[]>([]);
const error = ref("");

const expandedId = ref<string | null>(null);

const showEdit = ref(false);
const saving = ref(false);
const editUserId = ref("");
const editProfileImageUrl = ref("");
const editApiKeyCount = ref(0);
const editLastActive = ref("");
const editExternalId = ref("");
const editEmail = ref("");
const editUsername = ref("");

const linkedAccounts = ref<Account[]>([]);
const activeAccountId = ref<string>("");
const linksLoading = ref(false);
const linksBusy = ref(false);
const linksError = ref("");
const linkAccountId = ref("");
const linkSetActive = ref(true);

const totalPages = computed(() => {
    const ps = Math.max(1, pageSize.value || 1);
    const t = Math.max(0, total.value || 0);
    const tp = Math.ceil(t / ps);
    return Math.max(1, tp);
});

const pageNumbers = computed(() => {
    const tp = totalPages.value;
    const cur = Math.min(Math.max(1, page.value || 1), tp);
    const windowSize = 5;
    let start = Math.max(1, cur - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > tp) {
        end = tp;
        start = Math.max(1, end - windowSize + 1);
    }

    const out: number[] = [];
    for (let p = start; p <= end; p++) out.push(p);
    return out;
});

function fmt(ts?: string | null) {
    if (!ts) return "";
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
}

function toggleDetails(id: string) {
    expandedId.value = expandedId.value === id ? null : id;
}

async function refresh() {
    error.value = "";
    try {
        const ps = Math.max(1, pageSize.value || 1);
        pageSize.value = ps;

        const requestedPage = Math.max(1, page.value || 1);
        page.value = requestedPage;

        const res = await listUsers({ search: search.value, page: requestedPage, page_size: ps });
        users.value = res.users ?? [];
        total.value = res.total ?? 0;

        if (page.value > totalPages.value) {
            page.value = totalPages.value;
            if (page.value !== requestedPage) {
                await refresh();
            }
        }
    } catch (e) {
        error.value = (e as Error).message;
    }
}

function onSearch() {
    page.value = 1;
    void refresh();
}

function onPageSizeChange() {
    page.value = 1;
    void refresh();
}

function goToPage(p: number) {
    const next = Math.min(Math.max(1, p), totalPages.value);
    if (next === page.value) return;
    page.value = next;
    void refresh();
}

async function onDelete(id: string) {
    if (!window.confirm("Delete user?")) return;
    error.value = "";
    try {
        await deleteUser({ user_id: id });
        await refresh();
    } catch (e) {
        error.value = (e as Error).message;
    }
}

function openEdit(u: User) {
    editUserId.value = u.id;
    editProfileImageUrl.value = u.profile_image_url ?? "";
    editApiKeyCount.value = u.api_keys?.length ?? 0;
    editLastActive.value = fmt(u.last_active);
    editExternalId.value = u.external_id ?? "";
    editEmail.value = u.email ?? "";
    editUsername.value = u.username ?? "";

    linkedAccounts.value = [];
    activeAccountId.value = "";
    linksError.value = "";
    linkAccountId.value = "";
    linkSetActive.value = true;
    showEdit.value = true;
    void refreshLinks();
}

function closeEdit() {
    if (saving.value) return;
    showEdit.value = false;
}

async function saveEdit() {
    if (!editUserId.value) return;
    error.value = "";
    saving.value = true;
    try {
        await updateUser({
            user_id: editUserId.value,
            external_id: editExternalId.value || undefined,
            email: editEmail.value || undefined,
            username: editUsername.value || undefined,
        });
        showEdit.value = false;
        await refresh();
    } catch (e) {
        error.value = (e as Error).message;
    } finally {
        saving.value = false;
    }
}

async function refreshLinks() {
    if (!editUserId.value) return;
    linksError.value = "";
    linksLoading.value = true;
    try {
        const res = await listUserAccounts({ user_id: editUserId.value });
        linkedAccounts.value = res.accounts ?? [];
        activeAccountId.value = res.active_account_id ?? "";
    } catch (e) {
        linksError.value = (e as Error).message;
    } finally {
        linksLoading.value = false;
    }
}

async function onLinkAccount() {
    if (!editUserId.value || !linkAccountId.value) return;
    linksError.value = "";
    linksBusy.value = true;
    try {
        await addUserToAccount({ user_id: editUserId.value, account_id: linkAccountId.value, set_active: linkSetActive.value });
        linkAccountId.value = "";
        await refreshLinks();
    } catch (e) {
        linksError.value = (e as Error).message;
    } finally {
        linksBusy.value = false;
    }
}

async function onUnlink(accountId: string) {
    if (!editUserId.value) return;
    if (!window.confirm("Unlink user from account?")) return;
    linksError.value = "";
    linksBusy.value = true;
    try {
        await removeUserFromAccount({ user_id: editUserId.value, account_id: accountId });
        await refreshLinks();
    } catch (e) {
        linksError.value = (e as Error).message;
    } finally {
        linksBusy.value = false;
    }
}

async function onSetActive(accountId: string) {
    if (!editUserId.value) return;
    linksError.value = "";
    linksBusy.value = true;
    try {
        await setUserActiveAccount({ user_id: editUserId.value, account_id: accountId });
        await refreshLinks();
    } catch (e) {
        linksError.value = (e as Error).message;
    } finally {
        linksBusy.value = false;
    }
}

onMounted(() => {
    void refresh();
});
</script>
