<template>
    <div class="container py-3">
        <div class="d-flex align-items-center justify-content-between mb-3">
            <h1 class="h4 mb-0">SSMCloud Admin</h1>
            <a class="btn btn-outline-secondary btn-sm" href="/auth/logout">Logout</a>
        </div>

        <ul class="nav nav-tabs mb-3">
            <li class="nav-item">
                <a class="nav-link" :class="{ active: page === 'users' }" href="#users" @click.prevent="setPage('users')">Users</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: page === 'accounts' }" href="#accounts" @click.prevent="setPage('accounts')">Accounts</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: page === 'agents' }" href="#agents" @click.prevent="setPage('agents')">Agents</a>
            </li>
        </ul>

        <UsersPage v-if="page === 'users'" />
        <AccountsPage v-else-if="page === 'accounts'" />
        <AgentsPage v-else />
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import UsersPage from "./pages/UsersPage.vue";
import AccountsPage from "./pages/AccountsPage.vue";
import AgentsPage from "./pages/AgentsPage.vue";

type Page = "users" | "accounts" | "agents";

function parseHash(): Page {
    const h = window.location.hash.replace("#", "");
    if (h === "accounts" || h === "agents" || h === "users") return h;
    return "users";
}

const page = ref<Page>(parseHash());

function setPage(p: Page) {
    window.location.hash = p;
    page.value = p;
}

onMounted(() => {
    window.addEventListener("hashchange", () => {
        page.value = parseHash();
    });
});
</script>
