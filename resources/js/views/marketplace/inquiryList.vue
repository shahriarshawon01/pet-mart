<template>
    <div class="pm-inq">
        <div class="pm-page-head">
            <div>
                <h2>Inquiries</h2>
                <p>Private buyer–seller conversations. Every conversation you open, and every edit or delete, is logged under your name.</p>
            </div>
            <div class="pm-page-actions">
                <div class="pm-tabs" role="tablist" aria-label="Message state">
                    <button v-for="tab in tabs" :key="tab.value" type="button" role="tab"
                            :aria-selected="scope === tab.value ? 'true' : 'false'"
                            :class="{ 'is-active': scope === tab.value }"
                            @click="switchScope(tab.value)">
                        <i :class="tab.icon"></i> {{ tab.label }}
                    </button>
                </div>
            </div>
        </div>

        <div class="pm-inbox" :class="'is-step-' + step">
            <!-- 1. Sellers -->
            <section class="pm-inbox-pane" aria-label="Sellers">
                <header class="pm-inbox-head">
                    <div>
                        <h3>Sellers</h3>
                        <p>{{ sellers.total || 0 }} with {{ scope === 'deleted' ? 'deleted messages' : 'conversations' }}</p>
                    </div>
                </header>
                <form class="pm-inbox-search" role="search" @submit.prevent="loadSellers(1)">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input v-model.trim="keyword" type="search" class="form-control" placeholder="Seller name, phone or listing…" aria-label="Search sellers" @search="loadSellers(1)" />
                </form>
                <div class="pm-inbox-scroll">
                    <template v-if="loading.sellers && !sellers.data.length">
                        <div v-for="n in 6" :key="'s' + n" class="pm-inbox-skel"><span></span><div><i></i><i></i></div></div>
                    </template>
                    <div v-else-if="!sellers.data.length" class="pm-inbox-empty">
                        <i class="fa-regular fa-comments"></i>
                        <p>{{ keyword ? 'No seller matches your search.' : (scope === 'deleted' ? 'No deleted messages.' : 'No inquiries yet.') }}</p>
                    </div>
                    <button v-for="s in sellers.data" :key="s.id" type="button" class="pm-inbox-item"
                            :class="{ 'is-active': activeSeller && activeSeller.id === s.id }" @click="selectSeller(s)">
                        <img v-if="s.avatar" :src="s.avatar" alt="" class="pm-avatar is-sm" />
                        <span v-else class="pm-avatar is-sm" :class="avatarTone(s.phone)">{{ nameInitials(s.name) }}</span>
                        <span class="pm-inbox-item-body">
                            <span class="pm-inbox-row">
                                <strong>{{ s.name }}</strong>
                                <time :datetime="s.last_at" :title="dateTime(s.last_at)">{{ shortAgo(s.last_at) }}</time>
                            </span>
                            <span class="pm-inbox-row">
                                <span class="pm-inbox-sub">{{ plural(s.listings, 'listing') }} · {{ plural(s.threads, 'chat') }}</span>
                                <span v-if="s.unread" class="pm-unread" :title="s.unread + ' unread by the recipient'">{{ s.unread }}</span>
                            </span>
                        </span>
                    </button>
                    <button v-if="sellers.current_page < sellers.last_page" type="button" class="btn btn-light btn-sm w-100 mt-2"
                            :disabled="loading.sellers" @click="loadSellers(sellers.current_page + 1, true)">Load more</button>
                </div>
            </section>

            <!-- 2. Listings and buyers -->
            <section class="pm-inbox-pane" aria-label="Listings and buyers">
                <header class="pm-inbox-head">
                    <button type="button" class="btn btn-light btn-icon btn-sm pm-inbox-back" aria-label="Back to sellers" @click="step = 1"><i class="fa-solid fa-arrow-left"></i></button>
                    <template v-if="activeSeller">
                        <img v-if="activeSeller.avatar" :src="activeSeller.avatar" alt="" class="pm-avatar is-sm" />
                        <span v-else class="pm-avatar is-sm" :class="avatarTone(activeSeller.phone)">{{ nameInitials(activeSeller.name) }}</span>
                        <div class="min-w-0">
                            <h3 class="text-truncate">{{ activeSeller.name }}</h3>
                            <p>{{ activeSeller.phone }}</p>
                        </div>
                    </template>
                    <div v-else><h3>Listings</h3></div>
                </header>
                <div class="pm-inbox-scroll">
                    <div v-if="!activeSeller" class="pm-inbox-empty">
                        <i class="fa-solid fa-store"></i>
                        <p>Select a seller to see their listings and the buyers who messaged them.</p>
                    </div>
                    <template v-else-if="loading.listings && !listings.data.length">
                        <div v-for="n in 4" :key="'l' + n" class="pm-inbox-skel is-square"><span></span><div><i></i><i></i></div></div>
                    </template>
                    <div v-for="l in listings.data" :key="l.id" class="pm-inq-listing" :class="{ 'is-open': openListing === l.id }">
                        <button type="button" class="pm-inq-listing-head" :aria-expanded="openListing === l.id ? 'true' : 'false'" @click="toggleListing(l)">
                            <img v-if="l.image" :src="l.image" alt="" class="pm-inq-thumb" />
                            <span v-else class="pm-inq-thumb is-empty"><i class="fa-solid fa-paw"></i></span>
                            <span class="pm-inbox-item-body">
                                <strong class="pm-inq-title">{{ l.title }}</strong>
                                <span class="pm-inbox-row justify-content-start">
                                    <span class="pm-badge" :class="statusTone(l.status)">{{ capitalize(l.status) }}</span>
                                    <span class="pm-inbox-sub">{{ money(l.price, l.is_free) }}</span>
                                </span>
                                <span class="pm-inbox-sub">
                                    <i class="fa-regular fa-user"></i> {{ plural(l.threads, 'buyer') }} · {{ plural(l.messages, 'message') }}
                                    <span v-if="l.unread" class="pm-unread ms-1">{{ l.unread }}</span>
                                </span>
                            </span>
                            <i class="fa-solid fa-chevron-down pm-inq-chevron"></i>
                        </button>
                        <div v-if="openListing === l.id" class="pm-inq-threads">
                            <div v-if="loading.threads" class="pm-inbox-sub p-2"><span class="spinner-border spinner-border-sm"></span> Loading buyers…</div>
                            <button v-for="t in (threads[l.id] || [])" :key="t.buyer_id" type="button" class="pm-inq-thread"
                                    :class="{ 'is-active': isActiveThread(l.id, t.buyer_id) }" @click="openThread(l, t)">
                                <img v-if="t.buyer_avatar" :src="t.buyer_avatar" alt="" class="pm-avatar is-sm" />
                                <span v-else class="pm-avatar is-sm" :class="avatarTone(t.buyer_phone)">{{ nameInitials(t.buyer_name) }}</span>
                                <span class="pm-inbox-item-body">
                                    <span class="pm-inbox-row">
                                        <strong>{{ t.buyer_name }}</strong>
                                        <time :datetime="t.last_at" :title="dateTime(t.last_at)">{{ shortAgo(t.last_at) }}</time>
                                    </span>
                                    <span class="pm-inbox-row">
                                        <span class="pm-inbox-sub text-truncate"><b>{{ t.last_from === 'seller' ? 'Seller' : 'Buyer' }}:</b> {{ t.last_message }}</span>
                                        <span v-if="t.unread" class="pm-unread">{{ t.unread }}</span>
                                    </span>
                                </span>
                            </button>
                        </div>
                    </div>
                    <button v-if="activeSeller && listings.current_page < listings.last_page" type="button" class="btn btn-light btn-sm w-100 mt-2"
                            :disabled="loading.listings" @click="loadListings(listings.current_page + 1, true)">Load more listings</button>
                </div>
            </section>

            <!-- 3. Conversation -->
            <section class="pm-inbox-pane pm-inbox-chat" aria-label="Conversation">
                <div v-if="!thread && !loading.thread" class="pm-inbox-empty is-center">
                    <i class="fa-regular fa-comment-dots"></i>
                    <h4>Pick a conversation</h4>
                    <p>Choose a seller, open a listing, then select a buyer.</p>
                </div>
                <div v-else-if="loading.thread && !thread" class="pm-inbox-empty is-center"><span class="spinner-border text-success"></span></div>
                <template v-else>
                    <header class="pm-inbox-head pm-chat-head">
                        <button type="button" class="btn btn-light btn-icon btn-sm pm-inbox-back" aria-label="Back to listings" @click="step = 2"><i class="fa-solid fa-arrow-left"></i></button>
                        <img v-if="thread.product.image" :src="thread.product.image" alt="" class="pm-inq-thumb" />
                        <span v-else class="pm-inq-thumb is-empty"><i class="fa-solid fa-paw"></i></span>
                        <div class="min-w-0 flex-grow-1">
                            <h3 class="text-truncate">
                                <a v-if="thread.product.slug" :href="siteUrl('/product/' + thread.product.slug)" target="_blank" rel="noopener">{{ thread.product.title }} <i class="fa-solid fa-arrow-up-right-from-square pm-ext"></i></a>
                                <template v-else>{{ thread.product.title }}</template>
                            </h3>
                            <p class="pm-chat-people">
                                <span><span class="pm-dot is-buyer"></span>Buyer: <b>{{ thread.buyer.name }}</b> <span v-if="thread.buyer.phone">({{ thread.buyer.phone }})</span></span>
                                <span><span class="pm-dot is-seller"></span>Seller: <b>{{ thread.seller.name }}</b> <span v-if="thread.seller.phone">({{ thread.seller.phone }})</span></span>
                            </p>
                        </div>
                        <div class="pm-actions">
                            <button type="button" class="btn btn-sm btn-light btn-icon" title="Refresh" :disabled="loading.thread" @click="reloadThread"><i class="fa-solid fa-rotate"></i></button>
                            <button v-if="can('inquiry_delete') && deletedCount" type="button" class="btn btn-sm btn-outline-success" :disabled="busy" @click="restoreThread">
                                <i class="fa-solid fa-rotate-left"></i> <span class="d-none d-md-inline">Restore all</span>
                            </button>
                            <button v-if="can('inquiry_delete') && liveCount" type="button" class="btn btn-sm btn-outline-danger" :disabled="busy" @click="removeThread">
                                <i class="fa-regular fa-trash-can"></i> <span class="d-none d-md-inline">Delete chat</span>
                            </button>
                        </div>
                    </header>

                    <div ref="chatScroll" class="pm-chat-body">
                        <p v-if="thread.truncated" class="pm-chat-note">Showing the latest 500 messages.</p>
                        <template v-for="item in timeline">
                            <div v-if="item.day" :key="'d' + item.day" class="pm-chat-day"><span>{{ item.day }}</span></div>
                            <div v-else :key="item.m.id" class="pm-msg" :class="['is-' + item.m.from, { 'is-deleted': item.m.deleted_at }]">
                                <div class="pm-msg-body">
                                    <div class="pm-msg-meta">
                                        <b>{{ item.m.from === 'seller' ? thread.seller.name : thread.buyer.name }}</b>
                                        <span>{{ timeOnly(item.m.created_at) }}</span>
                                        <span v-if="item.m.from === 'buyer' || item.m.from === 'seller'" :title="item.m.is_read ? 'Read by the recipient' : 'Not read yet'">
                                            <i class="fa-solid" :class="item.m.is_read ? 'fa-check-double text-success' : 'fa-check'"></i>
                                        </span>
                                    </div>
                                    <div v-if="editingId === item.m.id" class="pm-msg-edit">
                                        <textarea v-model="editText" class="form-control" rows="3" placeholder="Edit the message text" maxlength="1000" aria-label="Edit message" @keydown.esc="cancelEdit"></textarea>
                                        <div class="d-flex justify-content-between align-items-center mt-1">
                                            <small class="text-muted">{{ editText.length }}/1000 · both users will see “Edited by PetMart”</small>
                                            <span>
                                                <button type="button" class="btn btn-sm btn-light" @click="cancelEdit">Cancel</button>
                                                <button type="button" class="btn btn-sm btn-primary" :disabled="busy || !editText.trim()" @click="saveEdit(item.m)">Save</button>
                                            </span>
                                        </div>
                                    </div>
                                    <div v-else class="pm-msg-bubble">{{ item.m.message }}</div>
                                    <div class="pm-msg-foot">
                                        <span v-if="item.m.admin_edited_at" class="pm-badge is-violet" :title="'Edited ' + dateTime(item.m.admin_edited_at)"><i class="fa-solid fa-pen"></i> Edited by admin</span>
                                        <span v-if="item.m.deleted_at" class="pm-badge is-danger" :title="'Deleted ' + dateTime(item.m.deleted_at)"><i class="fa-regular fa-eye-slash"></i> Deleted · hidden from users</span>
                                        <span v-if="editingId !== item.m.id" class="pm-msg-actions">
                                            <button v-if="can('inquiry_update') && !item.m.deleted_at" type="button" title="Edit message" @click="startEdit(item.m)"><i class="fa-regular fa-pen-to-square"></i></button>
                                            <button v-if="can('inquiry_delete') && !item.m.deleted_at" type="button" class="is-danger" title="Delete message" @click="removeMessage(item.m)"><i class="fa-regular fa-trash-can"></i></button>
                                            <button v-if="can('inquiry_delete') && item.m.deleted_at" type="button" class="is-success" title="Restore message" @click="restoreMessage(item.m)"><i class="fa-solid fa-rotate-left"></i> Restore</button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>

                    <footer class="pm-chat-foot">
                        <button type="button" class="pm-chat-foot-toggle" :aria-expanded="showActivity ? 'true' : 'false'" @click="showActivity = !showActivity">
                            <i class="fa-solid fa-clock-rotate-left"></i> Admin activity ({{ thread.activity.length }})
                            <i class="fa-solid" :class="showActivity ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                        </button>
                        <span class="pm-inbox-sub"><i class="fa-solid fa-lock"></i> Read-only for admins: you cannot send messages here.</span>
                        <ul v-if="showActivity" class="pm-chat-activity">
                            <li v-if="!thread.activity.length" class="pm-inbox-sub">No edits or deletes yet.</li>
                            <li v-for="(a, i) in thread.activity" :key="i">
                                <b>{{ a.admin }}</b> {{ actionLabel(a) }} <span class="pm-inbox-sub">· {{ dateTime(a.created_at) }}</span>
                            </li>
                        </ul>
                    </footer>
                </template>
            </section>
        </div>
    </div>
</template>

<script>
const API = 'api/v1/admin/inquiries';

export default {
    name: "inquiryList",
    data() {
        return {
            tabs: [
                { value: 'active', label: 'Active', icon: 'fa-regular fa-comments' },
                { value: 'deleted', label: 'Deleted', icon: 'fa-regular fa-trash-can' },
            ],
            scope: 'active',
            keyword: '',
            step: 1,
            sellers: { data: [], current_page: 1, last_page: 1, total: 0 },
            activeSeller: null,
            listings: { data: [], current_page: 1, last_page: 1 },
            openListing: null,
            threads: {},
            active: null, // { productId, buyerId }
            thread: null,
            loading: { sellers: false, listings: false, threads: false, thread: false },
            editingId: null,
            editText: '',
            busy: false,
            showActivity: false,
        };
    },
    computed: {
        params() {
            return { scope: this.scope };
        },
        liveCount() {
            return this.thread ? this.thread.messages.filter((m) => !m.deleted_at).length : 0;
        },
        deletedCount() {
            return this.thread ? this.thread.messages.filter((m) => m.deleted_at).length : 0;
        },
        timeline() {
            if (!this.thread) return [];
            const out = [];
            let lastDay = null;
            this.thread.messages.forEach((m) => {
                const day = this.dateTime(m.created_at, false);
                if (day !== lastDay) {
                    out.push({ day });
                    lastDay = day;
                }
                out.push({ m });
            });
            return out;
        },
    },
    methods: {
        get(url, params = {}) {
            return this.adminRequest('get', url, {}, { silent: true, params: Object.assign({}, this.params, params) });
        },
        plural(n, word) {
            return `${n} ${word}${n === 1 ? '' : 's'}`;
        },
        shortAgo(iso) {
            return this.timeAgo(iso).replace(/ (minute|hour|day|week|month|year)s? ago/, (x, u) => ({ minute: 'm', hour: 'h', day: 'd', week: 'w', month: 'mo', year: 'y' })[u]);
        },
        timeOnly(iso) {
            return iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
        },
        actionLabel(a) {
            return {
                edited: 'edited a message',
                deleted: 'deleted a message',
                restored: 'restored a message',
                thread_deleted: `deleted the conversation (${a.affected} messages)`,
                thread_restored: `restored the conversation (${a.affected} messages)`,
            }[a.action] || a.action;
        },
        isActiveThread(productId, buyerId) {
            return !!this.active && this.active.productId === productId && this.active.buyerId === buyerId;
        },

        switchScope(scope) {
            if (this.scope === scope) return;
            this.scope = scope;
            this.resetFrom('seller');
            this.loadSellers(1);
        },
        resetFrom(level) {
            if (level === 'seller') {
                this.activeSeller = null;
                this.listings = { data: [], current_page: 1, last_page: 1 };
                this.step = 1;
            }
            this.openListing = null;
            this.threads = {};
            this.active = null;
            this.thread = null;
            this.cancelEdit();
        },

        loadSellers(page = 1, append = false) {
            this.loading.sellers = true;
            return this.get(`${API}/sellers`, { page, keyword: this.keyword || undefined })
                .then((res) => {
                    this.sellers = append ? Object.assign({}, res, { data: this.sellers.data.concat(res.data) }) : res;
                })
                .catch(() => {})
                .finally(() => { this.loading.sellers = false; });
        },
        selectSeller(s) {
            if (!this.activeSeller || this.activeSeller.id !== s.id) {
                this.resetFrom('listing');
                this.activeSeller = s;
                this.listings = { data: [], current_page: 1, last_page: 1 };
                this.loadListings(1);
            }
            this.step = 2;
        },
        loadListings(page = 1, append = false) {
            if (!this.activeSeller) return Promise.resolve();
            const sellerId = this.activeSeller.id;
            this.loading.listings = true;
            return this.get(`${API}/sellers/${sellerId}/listings`, { page })
                .then((res) => {
                    if (!this.activeSeller || this.activeSeller.id !== sellerId) return;
                    this.listings = append ? Object.assign({}, res, { data: this.listings.data.concat(res.data) }) : res;
                    if (res.seller) this.activeSeller = Object.assign({}, this.activeSeller, res.seller);
                    if (!append && res.data.length === 1 && !this.openListing) this.toggleListing(res.data[0]);
                })
                .catch(() => {})
                .finally(() => { this.loading.listings = false; });
        },
        toggleListing(l) {
            if (this.openListing === l.id) {
                this.openListing = null;
                return;
            }
            this.openListing = l.id;
            this.loadThreads(l.id);
        },
        loadThreads(productId) {
            this.loading.threads = true;
            return this.get(`${API}/listings/${productId}/threads`)
                .then((res) => { this.$set(this.threads, productId, res || []); })
                .catch(() => {})
                .finally(() => { this.loading.threads = false; });
        },
        openThread(listing, t) {
            this.active = { productId: listing.id, buyerId: t.buyer_id };
            this.thread = null;
            this.showActivity = false;
            this.cancelEdit();
            this.step = 3;
            this.reloadThread(true);
        },
        reloadThread(scrollToEnd = false) {
            if (!this.active) return Promise.resolve();
            const { productId, buyerId } = this.active;
            this.loading.thread = true;
            return this.adminRequest('get', `${API}/listings/${productId}/threads/${buyerId}`, {}, { silent: true })
                .then((res) => {
                    if (!this.isActiveThread(productId, buyerId)) return;
                    this.thread = res;
                    if (scrollToEnd === true) {
                        this.$nextTick(() => {
                            const el = this.$refs.chatScroll;
                            if (el) el.scrollTop = el.scrollHeight;
                        });
                    }
                })
                .catch(() => {
                    if (this.isActiveThread(productId, buyerId)) {
                        this.active = null;
                        this.step = 2;
                    }
                })
                .finally(() => { this.loading.thread = false; });
        },
        /** After a change, refresh the open conversation and the counts in the side panes. */
        refreshAll() {
            const jobs = [this.reloadThread(), this.loadSellers(1), this.loadListings(1)];
            if (this.openListing) jobs.push(this.loadThreads(this.openListing));
            return Promise.all(jobs);
        },

        startEdit(m) {
            this.editingId = m.id;
            this.editText = m.message;
        },
        cancelEdit() {
            this.editingId = null;
            this.editText = '';
        },
        saveEdit(m) {
            this.busy = true;
            this.adminRequest('put', `${API}/${m.id}`, { message: this.editText })
                .then((updated) => {
                    Object.assign(m, updated);
                    this.cancelEdit();
                    this.reloadThread();
                })
                .catch(() => {})
                .finally(() => { this.busy = false; });
        },
        removeMessage(m) {
            this.confirmBox((ok) => {
                if (!ok) return;
                this.adminRequest('delete', `${API}/${m.id}`).then(() => this.refreshAll()).catch(() => {});
            }, 'Delete this message?', 'The buyer and seller will no longer see it. You can restore it later.');
        },
        restoreMessage(m) {
            this.adminRequest('post', `${API}/${m.id}/restore`).then(() => this.refreshAll()).catch(() => {});
        },
        removeThread() {
            const { productId, buyerId } = this.active;
            this.confirmBox((ok) => {
                if (!ok) return;
                this.busy = true;
                this.adminRequest('delete', `${API}/listings/${productId}/threads/${buyerId}`)
                    .then(() => this.refreshAll())
                    .catch(() => {})
                    .finally(() => { this.busy = false; });
            }, 'Delete the whole conversation?', `All ${this.liveCount} messages will be hidden from ${this.thread.buyer.name} and ${this.thread.seller.name}. You can restore them from the Deleted tab.`);
        },
        restoreThread() {
            const { productId, buyerId } = this.active;
            this.busy = true;
            this.adminRequest('post', `${API}/listings/${productId}/threads/${buyerId}/restore`)
                .then(() => this.refreshAll())
                .catch(() => {})
                .finally(() => { this.busy = false; });
        },
    },
    mounted() {
        this.loadSellers(1);
    },
}
</script>
