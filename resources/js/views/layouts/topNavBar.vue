<template>
    <header class="pm-topbar">
        <button type="button" class="pm-icon-btn" @click="toggleSidebar" :aria-label="'Toggle menu'" title="Toggle menu">
            <i v-if="httpRequest" class="fa-solid fa-circle-notch fa-spin"></i>
            <i v-else class="fa-solid fa-bars-staggered"></i>
        </button>

        <div class="pm-topbar-title">
            <div class="pm-crumbs" aria-label="Breadcrumb">
                <span><router-link to="/admin/dashboard">Admin</router-link></span>
                <span v-if="section">{{ section }}</span>
            </div>
            <h1>{{ pageTitle() || 'Dashboard' }}</h1>
        </div>

        <div class="pm-topbar-actions">
            <notification-bell></notification-bell>
            <a v-if="frontendUrl" :href="frontendUrl" target="_blank" rel="noopener" class="pm-icon-btn d-none d-sm-inline-grid" title="Open the customer site">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>

            <div class="dropdown">
                <button type="button" class="pm-user-btn" data-bs-toggle="dropdown" aria-expanded="false" aria-haspopup="true">
                    <img v-if="userImage" class="pm-avatar" :src="userImage" alt="">
                    <span v-else class="pm-avatar">{{ nameInitials(userName) }}</span>
                    <span class="pm-user-meta">
                        <strong>{{ userName }}</strong>
                        <small>Administrator</small>
                    </span>
                    <i class="fa-solid fa-chevron-down text-muted" style="font-size: 10px"></i>
                </button>
                <div class="dropdown-menu dropdown-menu-end">
                    <h6 class="dropdown-header">{{ userEmail || 'Signed in' }}</h6>
                    <router-link class="dropdown-item" to="/admin/profile">
                        <i class="fa-regular fa-user"></i> My profile
                    </router-link>
                    <router-link class="dropdown-item" to="/admin/general_setting">
                        <i class="fa-solid fa-sliders"></i> Site settings
                    </router-link>
                    <div class="dropdown-divider"></div>
                    <form :action="`${baseUrl}/logout`" method="post" class="m-0">
                        <input type="hidden" name="_token" :value="csrfToken">
                        <button type="submit" class="dropdown-item text-danger">
                            <i class="fa-solid fa-arrow-right-from-bracket"></i> Log out
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </header>
</template>

<script>
import NotificationBell from "../../components/notificationBell";

export default {
    name: "topNavBar",
    components: { NotificationBell },
    computed: {
        user() {
            return (this.Config && this.Config.user) || {};
        },
        userName() {
            return this.user.name || 'Admin';
        },
        userEmail() {
            return this.user.email || '';
        },
        userImage() {
            return this.user.avatar || null;
        },
        frontendUrl() {
            return window.frontendUrl || '';
        },
        csrfToken() {
            const meta = document.querySelector('meta[name="csrf-token"]');
            return meta ? meta.getAttribute('content') : '';
        },
        section() {
            const p = this.$route.path;
            if (p.startsWith('/admin/marketplace')) return 'Marketplace';
            if (/\/admin\/(users|module|role|role_permissions)/.test(p)) return 'Access control';
            if (p.startsWith('/admin/general_setting') || p.startsWith('/admin/locations')) return 'Settings';
            return '';
        },
    },
    methods: {
        toggleSidebar() {
            if (window.innerWidth < 992) {
                this.$store.commit('sidebarOpen', !this.$store.getters.sidebarOpen);
            } else {
                this.$store.commit('sidebarCollapsed', !this.$store.getters.sidebarCollapsed);
            }
        },
    },
}
</script>
