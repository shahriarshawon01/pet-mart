<template>
    <div class="pm-notify" ref="root">
        <button
            type="button"
            class="pm-icon-btn"
            :class="{ 'is-open': open }"
            :aria-expanded="open ? 'true' : 'false'"
            aria-haspopup="true"
            :aria-label="unread ? `Notifications, ${unread} unread` : 'Notifications'"
            title="Notifications"
            @click="toggle"
        >
            <i class="fa-regular fa-bell" :class="{ 'pm-ring': ringing }"></i>
            <span v-if="unread" class="pm-notify-badge">{{ unread > 99 ? '99+' : unread }}</span>
        </button>

        <transition name="pm-pop">
            <section v-if="open" class="pm-notify-panel" role="dialog" aria-label="Notifications">
                <header class="pm-notify-head">
                    <div>
                        <h3>Notifications</h3>
                        <p>{{ unread ? `${unread} unread` : 'You’re all caught up' }}</p>
                    </div>
                    <button type="button" class="pm-notify-link" :disabled="!unread || busy" @click="markAll">
                        <i class="fa-solid fa-check-double"></i> Mark all read
                    </button>
                </header>

                <div class="pm-notify-tabs" role="tablist">
                    <button
                        v-for="tab in tabs"
                        :key="tab.value"
                        type="button"
                        role="tab"
                        :aria-selected="filter === tab.value ? 'true' : 'false'"
                        :class="{ 'is-active': filter === tab.value }"
                        @click="setFilter(tab.value)"
                    >
                        {{ tab.label }}<span v-if="tab.value === 'unread' && unread" class="pm-count">{{ unread }}</span>
                    </button>
                </div>

                <div class="pm-notify-body">
                    <template v-if="loading && !items.length">
                        <div v-for="n in 4" :key="n" class="pm-notify-skel">
                            <span></span>
                            <div><i></i><i></i></div>
                        </div>
                    </template>

                    <div v-else-if="!items.length" class="pm-notify-empty">
                        <span><i class="fa-regular fa-bell-slash"></i></span>
                        <strong>{{ filter === 'unread' ? 'No unread notifications' : 'No notifications yet' }}</strong>
                        <p>New listing requests from members will appear here.</p>
                    </div>

                    <ul v-else class="pm-notify-list">
                        <li v-for="item in items" :key="item.id" :class="{ 'is-unread': !item.is_read }">
                            <button type="button" class="pm-notify-item" @click="openItem(item)">
                                <span class="pm-notify-thumb">
                                    <img v-if="item.product.image" :src="item.product.image" alt="" loading="lazy">
                                    <i v-else class="fa-solid fa-paw"></i>
                                    <em :class="kindOf(item).tone"><i :class="kindOf(item).icon"></i></em>
                                </span>
                                <span class="pm-notify-text">
                                    <span class="pm-notify-title">
                                        <strong>{{ kindOf(item).label }}</strong>
                                        <span v-if="statusChip(item)" class="pm-notify-chip" :class="statusChip(item).tone">{{ statusChip(item).label }}</span>
                                    </span>
                                    <span class="pm-notify-msg">“{{ item.product.title }}”</span>
                                    <span class="pm-notify-meta">
                                        <span v-if="item.product.seller_name"><i class="fa-regular fa-user"></i> {{ item.product.seller_name }}</span>
                                        <span v-if="item.product.category">{{ item.product.category }}</span>
                                        <span>{{ priceLabel(item.product) }}</span>
                                    </span>
                                    <time :datetime="item.created_at" :title="dateTime(item.created_at)">{{ timeAgo(item.created_at) }}</time>
                                </span>
                            </button>
                            <div class="pm-notify-actions">
                                <button v-if="!item.is_read" type="button" title="Mark as read" aria-label="Mark as read" @click="markRead(item)">
                                    <i class="fa-solid fa-check"></i>
                                </button>
                                <button type="button" title="Remove" aria-label="Remove notification" @click="remove(item)">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        </li>
                    </ul>

                    <button v-if="hasMore" type="button" class="pm-notify-more" :disabled="loading" @click="load(page + 1)">
                        <i v-if="loading" class="fa-solid fa-circle-notch fa-spin"></i>
                        {{ loading ? 'Loading…' : 'Load older notifications' }}
                    </button>
                </div>

                <footer class="pm-notify-foot">
                    <router-link to="/admin/marketplace/moderation" @click.native="open = false">
                        Open moderation queue <i class="fa-solid fa-arrow-right"></i>
                    </router-link>
                </footer>
            </section>
        </transition>
    </div>
</template>

<script>
const POLL_MS = 45000;
const BASE = 'api/v1/admin/notifications';

const KINDS = {
    listing_submitted: { label: 'New listing request', icon: 'fa-solid fa-plus', tone: 'is-new' },
    listing_resubmitted: { label: 'Listing edited, needs review', icon: 'fa-solid fa-pen', tone: 'is-edit' },
};

const STATUS = {
    pending: { label: 'Pending', tone: 'is-warning' },
    active: { label: 'Approved', tone: 'is-success' },
    rejected: { label: 'Rejected', tone: 'is-danger' },
    sold: { label: 'Sold', tone: 'is-neutral' },
    expired: { label: 'Expired', tone: 'is-neutral' },
    deleted: { label: 'Deleted', tone: 'is-neutral' },
};

export default {
    name: 'notificationBell',
    data() {
        return {
            open: false,
            filter: 'all',
            tabs: [{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }],
            items: [],
            page: 1,
            lastPage: 1,
            unread: 0,
            loading: false,
            busy: false,
            ringing: false,
            timer: null,
            primed: false,
        };
    },
    computed: {
        hasMore() {
            return this.page < this.lastPage;
        },
    },
    mounted() {
        this.poll();
        this.timer = setInterval(this.poll, POLL_MS);
        document.addEventListener('click', this.onOutside, true);
        document.addEventListener('keydown', this.onKey);
        document.addEventListener('visibilitychange', this.onVisible);
        this.$root.$on('notifications:refresh', this.poll);
    },
    beforeDestroy() {
        this.$root.$off('notifications:refresh', this.poll);
        clearInterval(this.timer);
        document.removeEventListener('click', this.onOutside, true);
        document.removeEventListener('keydown', this.onKey);
        document.removeEventListener('visibilitychange', this.onVisible);
    },
    watch: {
        '$route.fullPath'() {
            this.open = false;
        },
    },
    methods: {
        request(method, url, params = {}) {
            return this.axios({ method, url: this.urlGenerate(url), params }).then((res) => {
                const body = res.data || {};
                if (parseInt(body.status) !== 2000) throw new Error(body.message || 'Request failed');
                return body.result || {};
            });
        },
        poll() {
            if (document.hidden) return;
            this.request('get', `${BASE}/summary`)
                .then((res) => {
                    const count = res.unread_count || 0;
                    if (this.primed && count > this.unread && res.latest) this.announce(res.latest);
                    this.unread = count;
                    this.primed = true;
                })
                .catch(() => {});
        },
        announce(latest) {
            this.ringing = true;
            setTimeout(() => { this.ringing = false; }, 1200);
            this.$toastr('info', `“${latest.product.title}” is waiting for review.`, (KINDS[latest.type] || KINDS.listing_submitted).label);
            this.getConfigurations();
            if (this.open) this.load(1);
        },
        load(page = 1) {
            this.loading = true;
            return this.request('get', BASE, { filter: this.filter, page })
                .then((res) => {
                    const rows = res.data || [];
                    this.items = page === 1 ? rows : this.items.concat(rows.filter((r) => !this.items.some((i) => i.id === r.id)));
                    this.page = res.current_page || page;
                    this.lastPage = res.last_page || 1;
                    this.unread = res.unread_count || 0;
                })
                .catch(() => this.$toastr('error', 'Notifications could not be loaded.', 'Error'))
                .finally(() => { this.loading = false; });
        },
        toggle() {
            this.open = !this.open;
            if (this.open) this.load(1);
        },
        setFilter(value) {
            if (this.filter === value) return;
            this.filter = value;
            this.items = [];
            this.load(1);
        },
        markRead(item) {
            if (item.is_read) return Promise.resolve();
            item.is_read = true;
            return this.request('post', `${BASE}/${item.id}/read`)
                .then((res) => {
                    this.unread = res.unread_count || 0;
                    if (this.filter === 'unread') this.items = this.items.filter((i) => i.id !== item.id);
                })
                .catch(() => { item.is_read = false; });
        },
        markAll() {
            this.busy = true;
            this.request('post', `${BASE}/read-all`)
                .then(() => {
                    this.unread = 0;
                    this.items = this.filter === 'unread' ? [] : this.items.map((i) => Object.assign({}, i, { is_read: true }));
                })
                .catch(() => this.$toastr('error', 'Could not update notifications.', 'Error'))
                .finally(() => { this.busy = false; });
        },
        remove(item) {
            this.items = this.items.filter((i) => i.id !== item.id);
            this.request('delete', `${BASE}/${item.id}`)
                .then((res) => { this.unread = res.unread_count || 0; })
                .catch(() => this.load(1));
        },
        openItem(item) {
            this.markRead(item);
            this.open = false;
            if (!item.product.id || item.product.status === 'deleted') {
                this.$toastr('warning', 'This listing has been deleted.', 'Not available');
                return;
            }
            const target = item.product.status === 'pending' ? '/admin/marketplace/moderation' : '/admin/marketplace/listings';
            this.$router.push({ path: target, query: { listing: String(item.product.id) } }).catch(() => {});
        },
        kindOf(item) {
            return KINDS[item.type] || KINDS.listing_submitted;
        },
        statusChip(item) {
            return STATUS[item.product.status] || null;
        },
        priceLabel(p) {
            if (p.is_free || !p.price) return 'Free';
            return '৳' + Number(p.price).toLocaleString('en-IN');
        },
        onOutside(e) {
            if (this.open && this.$refs.root && !this.$refs.root.contains(e.target)) this.open = false;
        },
        onKey(e) {
            if (e.key === 'Escape' && this.open) this.open = false;
        },
        onVisible() {
            if (!document.hidden) this.poll();
        },
    },
};
</script>
