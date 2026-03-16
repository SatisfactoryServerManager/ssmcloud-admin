<template>
    <div>
        <h2 class="h5">Accounts</h2>

        <div v-if="error" class="alert alert-danger" style="white-space: pre-wrap">{{ error }}</div>

        <div class="card mb-3">
            <div class="card-body">
                <div class="row g-2 align-items-end">
                    <div class="col-12 col-md-8">
                        <label class="form-label">Search (name/join code)</label>
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
                <div v-for="a in accounts" :key="a.id" class="card">
                    <div class="card-body py-2">
                        <div class="d-flex align-items-start justify-content-between gap-3">
                            <div class="flex-grow-1">
                                <div class="fw-semibold">
                                    {{ a.account_name || "(no name)" }}
                                </div>
                                <div class="small text-muted">
                                    Join: <code>{{ a.join_code || "" }}</code>
                                    <span class="ms-2">Inactive: {{ a.inactivity_state?.inactive ? "yes" : "no" }}</span>
                                </div>
                            </div>

                            <div class="text-end" style="white-space: nowrap">
                                <div class="d-inline-flex gap-1">
                                    <button
                                        class="btn btn-outline-secondary btn-sm"
                                        type="button"
                                        :title="expandedId === a.id ? 'Hide details' : 'Show details'"
                                        :aria-label="expandedId === a.id ? 'Hide details' : 'Show details'"
                                        @click="toggleDetails(a.id)"
                                    >
                                        <i class="fa-solid" :class="expandedId === a.id ? 'fa-chevron-up' : 'fa-chevron-down'" aria-hidden="true"></i>
                                    </button>
                                    <button class="btn btn-outline-primary btn-sm" type="button" title="Edit" aria-label="Edit" @click="openEdit(a)">
                                        <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                                    </button>
                                    <button class="btn btn-danger btn-sm" type="button" title="Delete" aria-label="Delete" @click="onDelete(a.id)">
                                        <i class="fa-solid fa-trash" aria-hidden="true"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div v-if="expandedId === a.id" class="mt-2 border-top pt-2">
                            <div class="row g-2 small">
                                <div class="col-12 col-md-6">
                                    <div class="text-muted">ID</div>
                                    <code>{{ a.id }}</code>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="text-muted">Counts</div>
                                    <div>Audits: {{ a.audit?.length ?? 0 }}</div>
                                    <div>Integrations: {{ a.integrations?.length ?? 0 }}</div>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="text-muted">Inactivity</div>
                                    <div>Inactive: {{ a.inactivity_state?.inactive ? "yes" : "no" }}</div>
                                    <div>Date inactive: {{ fmt(a.inactivity_state?.date_inactive) || "—" }}</div>
                                    <div>Delete date: {{ fmt(a.inactivity_state?.delete_date) || "—" }}</div>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="text-muted">Timestamps</div>
                                    <div>Created: {{ fmt(a.created_at) || "—" }}</div>
                                    <div>Updated: {{ fmt(a.updated_at) || "—" }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
                <div class="text-muted small">Page {{ page }} of {{ totalPages }} ({{ total }} total)</div>
                <nav aria-label="Accounts pagination">
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
                        <h5 class="modal-title">Edit Account</h5>
                        <button type="button" class="btn-close" aria-label="Close" @click="closeEdit"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-2">
                            <label class="form-label">Account ID</label>
                            <input class="form-control" :value="editAccountId" readonly />
                        </div>
                        <div class="row g-2">
                            <div class="col-12 col-md-6">
                                <label class="form-label">Join Code</label>
                                <input class="form-control" :value="editJoinCode" readonly />
                            </div>
                            <div class="col-12 col-md-6">
                                <label class="form-label">Inactive</label>
                                <input class="form-control" :value="editInactive ? 'yes' : 'no'" readonly />
                            </div>
                        </div>
                        <div class="row g-2 mt-0">
                            <div class="col-12 col-md-6">
                                <label class="form-label">Audits</label>
                                <input class="form-control" :value="String(editAuditCount)" readonly />
                            </div>
                            <div class="col-12 col-md-6">
                                <label class="form-label">Integrations</label>
                                <input class="form-control" :value="String(editIntegrationCount)" readonly />
                            </div>
                        </div>
                        <div class="mb-2">
                            <label class="form-label">Account Name</label>
                            <input v-model="editAccountName" class="form-control" />
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
import { deleteAccount, listAccounts, updateAccount, type Account } from "../api";

const search = ref("");
const page = ref(1);
const pageSize = ref(50);
const total = ref(0);
const accounts = ref<Account[]>([]);
const error = ref("");

const expandedId = ref<string | null>(null);

const showEdit = ref(false);
const saving = ref(false);
const editAccountId = ref("");
const editAccountName = ref("");
const editJoinCode = ref("");
const editInactive = ref(false);
const editAuditCount = ref(0);
const editIntegrationCount = ref(0);

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

        const res = await listAccounts({ search: search.value, page: requestedPage, page_size: ps });
        accounts.value = res.accounts ?? [];
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
    if (!window.confirm("Delete account?")) return;
    error.value = "";
    try {
        await deleteAccount({ account_id: id });
        await refresh();
    } catch (e) {
        error.value = (e as Error).message;
    }
}

function openEdit(a: Account) {
    editAccountId.value = a.id;
    editAccountName.value = a.account_name ?? "";
    editJoinCode.value = a.join_code ?? "";
    editInactive.value = Boolean(a.inactivity_state?.inactive);
    editAuditCount.value = a.audit?.length ?? 0;
    editIntegrationCount.value = a.integrations?.length ?? 0;
    showEdit.value = true;
}

function closeEdit() {
    if (saving.value) return;
    showEdit.value = false;
}

async function saveEdit() {
    if (!editAccountId.value) return;
    error.value = "";
    saving.value = true;
    try {
        await updateAccount({ account_id: editAccountId.value, account_name: editAccountName.value || undefined });
        showEdit.value = false;
        await refresh();
    } catch (e) {
        error.value = (e as Error).message;
    } finally {
        saving.value = false;
    }
}

onMounted(() => {
    void refresh();
});
</script>
