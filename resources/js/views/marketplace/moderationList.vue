<template>
    <div>
        <div class="pm-page-head">
            <div>
                <h2>{{ isAll ? 'All listings' : 'Listing moderation' }}</h2>
                <p>{{ isAll ? 'Every listing on PetMart, whatever its status. Filter, review, feature or delete.' : 'Every listing is checked here before it appears on the site.' }}</p>
            </div>
        </div>

        <data-table
            :table-heading="tableHeading"
            search-placeholder="Search title, seller name or phone…"
            :empty-icon="activeStatus === 'pending' ? 'fa-solid fa-check' : 'fa-regular fa-folder-open'"
            :empty-title="activeStatus === 'pending' ? 'All caught up' : 'No listings here'"
            :empty-text="activeStatus === 'pending' ? 'There are no listings waiting for review.' : 'Try another tab or search term.'"
        >
            <template v-if="!isAll" v-slot:page_top>
                <div class="pm-tabs" role="tablist" aria-label="Listing status">
                    <button
                        v-for="tab in tabs"
                        :key="tab.value"
                        type="button"
                        role="tab"
                        :aria-selected="activeStatus === tab.value ? 'true' : 'false'"
                        :class="{ 'is-active': activeStatus === tab.value }"
                        @click="filterStatus(tab.value)"
                    >
                        {{ tab.label }} <span class="pm-count">{{ counts[tab.value] || 0 }}</span>
                    </button>
                </div>
            </template>

            <template v-if="isAll" v-slot:filter>
                <select v-model="activeStatus" class="form-select" aria-label="Status" @change="filterStatus(activeStatus)">
                    <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }} ({{ counts[opt.value] || 0 }})</option>
                </select>
                <select v-model="formFilter.category_id" class="form-select" aria-label="Category" @change="getDataList(1)">
                    <option value="">All categories</option>
                    <optgroup v-for="root in categoryOptions" :key="root.id" :label="root.name">
                        <option :value="root.id">All {{ root.name }}</option>
                        <option v-for="child in root.children" :key="child.id" :value="child.id">{{ child.name }}</option>
                    </optgroup>
                </select>
                <select v-model="formFilter.listing_type" class="form-select" aria-label="Listing type" @change="getDataList(1)">
                    <option value="">All types</option>
                    <option v-for="(label, value) in types" :key="value" :value="value">{{ label }}</option>
                </select>
                <select v-model="formFilter.featured" class="form-select" aria-label="Featured" @change="getDataList(1)">
                    <option value="">Homepage: any</option>
                    <option value="1">Featured on homepage</option>
                    <option value="0">Not featured</option>
                </select>
                <select v-model="formFilter.sort" class="form-select" aria-label="Sort" @change="getDataList(1)">
                    <option value="">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="price_high">Price: high to low</option>
                    <option value="price_low">Price: low to high</option>
                    <option value="views">Most viewed</option>
                </select>
            </template>

            <template v-slot:data>
                <tr v-for="item in (dataList.data || [])" :key="item.id">
                    <td>
                        <div class="d-flex align-items-center gap-12">
                            <img v-if="item.images.length" :src="item.images[0]" class="pm-thumb" alt="" loading="lazy">
                            <span v-else class="pm-thumb"><i class="fa-regular fa-image"></i></span>
                            <div class="min-w-0">
                                <a href="#" class="pm-cell-title text-decoration-none" @click.prevent="view(item)">
                                    <i v-if="item.is_featured" class="fa-solid fa-star text-warning me-1" title="Featured"></i>{{ item.title }}
                                </a>
                                <span class="pm-cell-sub">{{ categoryName(item) }}<template v-if="item.location"> · {{ item.location }}</template></span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <span class="fw-600 text-dark">{{ item.seller ? item.seller.name : 'Unknown' }}</span>
                            <i v-if="item.seller && item.seller.is_verified" class="fa-solid fa-circle-check text-success" title="Verified seller"></i>
                        </div>
                        <span class="pm-cell-sub">{{ item.seller ? item.seller.phone : '' }}</span>
                    </td>
                    <td class="text-nowrap">
                        <span class="fw-600 text-dark">{{ money(item.price, item.is_free) }}</span>
                        <div><span class="pm-badge no-dot is-neutral mt-1">{{ typeLabel(item.listing_type) }}</span></div>
                    </td>
                    <td class="text-nowrap">
                        <span>{{ timeAgo(item.created_at) }}</span>
                        <div class="pm-cell-sub">{{ dateTime(item.created_at, false) }}</div>
                    </td>
                    <td><span class="pm-badge" :class="statusTone(item.status)">{{ statusLabel(item.status) }}</span></td>
                    <td>
                        <div class="pm-actions">
                            <button type="button" class="btn btn-sm btn-light" @click="view(item)" title="View details">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                            <button v-if="canApprove(item)" type="button" class="btn btn-sm btn-primary" :disabled="busyId === item.id" @click="approve(item)">
                                <i class="fa-solid fa-check"></i> Approve
                            </button>
                            <button v-if="canReject(item)" type="button" class="btn btn-sm btn-outline-danger" @click="openReject(item)">
                                <i class="fa-solid fa-xmark"></i> Reject
                            </button>
                            <button
                                v-if="item.status === 'active'"
                                type="button"
                                class="btn btn-sm"
                                :class="item.is_featured ? 'btn-outline-warning' : 'btn-light'"
                                :disabled="busyId === item.id"
                                @click="toggleFeatured(item)"
                                :title="item.is_featured ? 'Remove from featured' : 'Feature on the homepage'"
                            >
                                <i :class="item.is_featured ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
                            </button>
                            <button v-if="isAll" type="button" class="btn btn-sm btn-light btn-icon text-danger" title="Delete listing" :disabled="busyId === item.id" @click="remove(item)">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            </template>
        </data-table>

        <general-modal modal-id="listingModal" modal-size="modal-xl" :is-enable-footer="true">
            <template v-slot:title>
                <span v-if="selected">{{ selected.title }}</span>
            </template>
            <template v-slot:body>
                <div v-if="selected" class="row g-4">
                    <div class="col-lg-7">
                        <div v-if="selected.images.length" class="pm-gallery mb-3">
                            <a v-for="(src, i) in selected.images" :key="i" :href="src" target="_blank" rel="noopener">
                                <img :src="src" :alt="`Photo ${i + 1}`" loading="lazy">
                            </a>
                        </div>
                        <p class="pm-section-title">Description</p>
                        <div class="pm-quote">{{ selected.description || 'No description.' }}</div>

                        <template v-if="selected.attributes.length">
                            <p class="pm-section-title">Details</p>
                            <dl class="pm-dl">
                                <template v-for="a in selected.attributes">
                                    <dt :key="'k' + a.key">{{ indexToLabel(a.key) }}</dt>
                                    <dd :key="'v' + a.key">{{ a.value }}</dd>
                                </template>
                            </dl>
                        </template>
                    </div>
                    <div class="col-lg-5">
                        <div class="ld-side">
                            <section class="ld-summary">
                                <div class="d-flex align-items-center justify-content-between gap-2">
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="pm-badge" :class="statusTone(selected.status)">{{ statusLabel(selected.status) }}</span>
                                        <span v-if="selected.is_featured" class="pm-badge no-dot is-warning"><i class="fa-solid fa-star"></i> Featured</span>
                                    </div>
                                    <span class="ld-id">#{{ selected.id }}</span>
                                </div>
                                <div class="ld-price">{{ money(selected.price, selected.is_free) }}</div>
                                <div class="d-flex flex-wrap gap-2">
                                    <span class="ld-pill"><i class="fa-solid fa-tag"></i> {{ typeLabel(selected.listing_type) }}</span>
                                    <span v-if="!selected.is_free && selected.price" class="ld-pill">
                                        <i :class="selected.is_negotiable ? 'fa-solid fa-handshake' : 'fa-solid fa-lock'"></i>
                                        {{ selected.is_negotiable ? 'Negotiable' : 'Fixed price' }}
                                    </span>
                                </div>
                            </section>

                            <div v-if="selected.rejection_reason" class="ld-note is-danger">
                                <i class="fa-solid fa-circle-xmark"></i>
                                <div><strong>Rejection reason</strong>{{ selected.rejection_reason }}</div>
                            </div>
                            <div v-if="selected.status === 'sold'" class="ld-note is-info">
                                <i class="fa-solid fa-circle-info"></i>
                                <div><strong>Sold</strong>The seller marked this as sold. Sold listings can’t be rejected or taken down.</div>
                            </div>

                            <section class="ld-card">
                                <h4 class="ld-card-title">Listing details</h4>
                                <ul class="ld-facts">
                                    <li>
                                        <span class="ld-icon" style="--accent: var(--pm-c-sky)"><i class="fa-solid fa-layer-group"></i></span>
                                        <span class="ld-label">Category</span>
                                        <span class="ld-value">{{ categoryName(selected) }}</span>
                                    </li>
                                    <li v-if="selected.condition">
                                        <span class="ld-icon" style="--accent: var(--pm-c-violet)"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
                                        <span class="ld-label">Condition</span>
                                        <span class="ld-value">{{ capitalize(selected.condition) }}</span>
                                    </li>
                                    <li>
                                        <span class="ld-icon" style="--accent: var(--pm-c-rose)"><i class="fa-solid fa-location-dot"></i></span>
                                        <span class="ld-label">Location</span>
                                        <span class="ld-value">
                                            {{ selected.location || '—' }}
                                            <small v-if="selected.address">{{ selected.address }}</small>
                                        </span>
                                    </li>
                                    <li>
                                        <span class="ld-icon" style="--accent: var(--pm-c-amber)"><i class="fa-regular fa-calendar"></i></span>
                                        <span class="ld-label">Submitted</span>
                                        <span class="ld-value">
                                            {{ dateTime(selected.created_at) }}
                                            <small>{{ timeAgo(selected.created_at) }}</small>
                                        </span>
                                    </li>
                                    <li>
                                        <span class="ld-icon" style="--accent: var(--pm-c-teal)"><i class="fa-regular fa-eye"></i></span>
                                        <span class="ld-label">Views</span>
                                        <span class="ld-value">{{ Number(selected.views || 0).toLocaleString('en-IN') }}</span>
                                    </li>
                                </ul>
                            </section>

                            <section v-if="selected.seller" class="ld-card">
                                <h4 class="ld-card-title">Seller</h4>
                                <div class="d-flex align-items-center gap-12">
                                    <span class="pm-avatar is-lg" :class="avatarTone(selected.seller.id)">{{ nameInitials(selected.seller.name) }}</span>
                                    <div class="min-w-0 flex-grow-1">
                                        <div class="fw-600 text-dark text-truncate">
                                            {{ selected.seller.name }}
                                            <i v-if="selected.seller.is_verified" class="fa-solid fa-circle-check text-success ms-1" title="Verified seller"></i>
                                        </div>
                                        <div class="pm-cell-sub">Member since {{ dateTime(selected.seller.joined_at, false) }}</div>
                                        <span v-if="!selected.seller.status" class="pm-badge is-danger mt-1">Account deactivated</span>
                                    </div>
                                </div>
                                <div class="ld-contact">
                                    <a :href="`tel:${selected.seller.phone}`" class="btn btn-sm btn-light"><i class="fa-solid fa-phone"></i> {{ selected.seller.phone }}</a>
                                    <a v-if="selected.seller.email" :href="`mailto:${selected.seller.email}`" class="btn btn-sm btn-light text-truncate"><i class="fa-regular fa-envelope"></i> {{ selected.seller.email }}</a>
                                </div>
                            </section>

                            <section v-if="selected.history.length" class="ld-card">
                                <h4 class="ld-card-title">History</h4>
                                <ol class="ld-history">
                                    <li v-for="(h, i) in selected.history" :key="i" :class="`is-${historyTone(h.action)}`">
                                        <div class="d-flex justify-content-between gap-2">
                                            <strong>{{ indexToLabel(h.action) }}</strong>
                                            <time :datetime="h.created_at" :title="dateTime(h.created_at)">{{ timeAgo(h.created_at) }}</time>
                                        </div>
                                        <div class="pm-cell-sub">by {{ h.admin || 'a removed admin' }}</div>
                                        <p v-if="h.reason" class="ld-reason">{{ h.reason }}</p>
                                    </li>
                                </ol>
                            </section>
                        </div>
                    </div>
                </div>
            </template>
            <template v-slot:buttons>
                <template v-if="selected">
                    <a v-if="selected.status === 'active' || selected.status === 'sold'" :href="siteUrl(`/product/${selected.slug}`)" target="_blank" rel="noopener" class="btn btn-light me-auto">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> View on site
                    </a>
                    <button v-if="canReject(selected)" type="button" class="btn btn-outline-danger" @click="openReject(selected)">
                        <i class="fa-solid fa-xmark"></i> Reject
                    </button>
                    <button v-if="canApprove(selected)" type="button" class="btn btn-primary" :disabled="busyId === selected.id" @click="approve(selected)">
                        <i class="fa-solid fa-check"></i> Approve
                    </button>
                </template>
            </template>
        </general-modal>

        <form-modal modal-id="rejectModal" modal-size="modal-md" title="Reject listing" submit-text="Reject listing" :reset-form-data="false" :reset-form-data-on-close-icon="false" @submit="submitReject">
            <p class="text-muted mb-3" v-if="rejectTarget">
                <strong class="text-dark">{{ rejectTarget.title }}</strong> will be hidden from the site. The seller sees your reason and can edit and resubmit.
            </p>
            <label class="form-label" for="reject-reason">Reason <span class="req">*</span></label>
            <div class="d-flex flex-wrap gap-2 mb-2">
                <button v-for="r in quickReasons" :key="r" type="button" class="btn btn-sm btn-light" @click="rejectReason = r">{{ r }}</button>
            </div>
            <textarea id="reject-reason" v-model="rejectReason" class="form-control" rows="4" maxlength="500" placeholder="Explain what the seller needs to fix…"></textarea>
            <div class="form-text text-end">{{ rejectReason.length }}/500</div>
        </form-modal>
    </div>
</template>

<script>
import DataTable from "../../components/dataTable";
import GeneralModal from "../../components/generalModal";
import FormModal from "../../components/formModal";

const TYPES = { sell: 'For sale', adopt: 'Adoption', stud_service: 'Stud service', lost: 'Lost pet', found: 'Found pet' };

export default {
    name: "moderationList",
    components: { DataTable, GeneralModal, FormModal },
    data() {
        return {
            tableHeading: ['Listing', 'Seller', 'Price', 'Submitted', 'Status', 'Actions'],
            types: TYPES,
            baseTabs: [
                { value: 'pending', label: 'Pending' },
                { value: 'active', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'sold', label: 'Sold' },
            ],
            activeStatus: 'pending',
            selected: null,
            rejectTarget: null,
            rejectReason: '',
            busyId: null,
            quickReasons: [
                'Photos are unclear or not of the actual animal/item.',
                'Price or description is misleading.',
                'Vaccination or health details are missing.',
                'This breed/item is not allowed on PetMart.',
                'Duplicate listing.',
            ],
        };
    },
    computed: {
        isAll() {
            return this.$route.meta.mode === 'all';
        },
        statusOptions() {
            return [
                { value: 'active', label: 'Approved' },
                { value: 'pending', label: 'Pending review' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'sold', label: 'Sold' },
                { value: 'all', label: 'All statuses' },
            ];
        },
        tabs() {
            return this.isAll ? [{ value: 'all', label: 'All' }, ...this.baseTabs] : this.baseTabs;
        },
        categoryOptions() {
            return (this.dataList && this.dataList.categories) || [];
        },
        counts() {
            return (this.dataList && this.dataList.counts) || {};
        },
    },
    methods: {
        filterStatus(status) {
            this.activeStatus = status;
            this.$set(this.formFilter, 'status', status);
            this.getDataList(1);
        },
        reload() {
            this.getDataList(this.currentPagination || 1);
            this.getConfigurations();
            this.$root.$emit('notifications:refresh');
        },
        remove(item) {
            this.confirmBox((ok) => {
                if (!ok) return;
                this.busyId = item.id;
                this.adminRequest('delete', `api/v1/admin/moderation/${item.id}`)
                    .then(() => this.reload())
                    .catch(() => {})
                    .finally(() => { this.busyId = null; });
            }, `Delete “${item.title}”?`, 'The listing disappears from the website and the seller’s dashboard. It is removed for good after 30 days.');
        },
        typeLabel(t) {
            return TYPES[t] || t;
        },
        historyTone(action) {
            return { approved: 'success', rejected: 'danger', taken_down: 'danger', deleted: 'danger', featured: 'warning', unfeatured: 'neutral' }[action] || 'neutral';
        },
        statusLabel(s) {
            return { active: 'Approved', pending: 'Pending', rejected: 'Rejected', sold: 'Sold', expired: 'Expired' }[s] || s;
        },
        categoryName(item) {
            if (!item.category) return '—';
            return item.category.parent ? `${item.category.parent} › ${item.category.name}` : item.category.name;
        },
        canApprove(item) {
            return ['pending', 'rejected'].includes(item.status);
        },
        canReject(item) {
            return ['pending', 'active'].includes(item.status);
        },
        view(item) {
            this.selected = item;
            this.openModal('listingModal', item.title, false, false);
        },
        approve(item) {
            this.busyId = item.id;
            this.adminRequest('post', `api/v1/admin/moderation/${item.id}/approve`)
                .then(() => {
                    this.closeModal('listingModal', false);
                    this.reload();
                })
                .catch(() => {})
                .finally(() => { this.busyId = null; });
        },
        openReject(item) {
            this.rejectTarget = item;
            this.rejectReason = '';
            const fromDetails = $('#listingModal').hasClass('show');
            this.closeModal('listingModal', false);
            setTimeout(() => this.openModal('rejectModal', 'Reject listing', false, false), fromDetails ? 300 : 0);
        },
        submitReject() {
            const reason = this.rejectReason.trim();
            if (reason.length < 5) {
                this.$toastr('error', 'Please give the seller a reason (at least 5 characters).', 'Reason needed');
                return;
            }
            this.$store.commit('httpRequest', true);
            this.adminRequest('post', `api/v1/admin/moderation/${this.rejectTarget.id}/reject`, { reason })
                .then(() => {
                    this.closeModal('rejectModal', false);
                    this.reload();
                })
                .catch(() => {})
                .finally(() => this.$store.commit('httpRequest', false));
        },
        openFromQuery() {
            const id = parseInt(this.$route.query.listing, 10);
            if (!id) return;
            this.$router.replace({ query: Object.assign({}, this.$route.query, { listing: undefined }) }).catch(() => {});
            this.adminRequest('get', `api/v1/admin/moderation/${id}`, {}, { silent: true })
                .then((item) => this.view(item))
                .catch(() => {});
        },
        toggleFeatured(item) {
            this.busyId = item.id;
            this.adminRequest('post', `api/v1/admin/moderation/${item.id}/feature`)
                .then((res) => { item.is_featured = res.is_featured; })
                .catch(() => {})
                .finally(() => { this.busyId = null; });
        },
    },
    mounted() {
        ['category_id', 'listing_type', 'featured', 'sort'].forEach((k) => this.$set(this.formFilter, k, ''));
        this.filterStatus(this.isAll ? 'active' : 'pending');
        this.openFromQuery();
    },
    watch: {
        '$route.query.listing'(value) {
            if (value) this.openFromQuery();
        },
    },
}
</script>

<style scoped>
.ld-side { display: flex; flex-direction: column; gap: 12px; }
.ld-summary {
    padding: 16px 18px;
    border-radius: 14px;
    background: linear-gradient(135deg, #f8fafc 0%, #ecfdf5 100%);
    border: 1px solid var(--pm-border);
}
.ld-id { font-size: 12px; font-weight: 600; color: var(--pm-muted); }
.ld-price { font-size: 26px; font-weight: 800; color: var(--pm-text); letter-spacing: -0.02em; margin: 10px 0 8px; }
.ld-pill {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; color: var(--pm-text-2);
    background: #fff; border: 1px solid var(--pm-border); border-radius: 999px; padding: 3px 10px;
}
.ld-pill i { color: var(--pm-emerald-600); font-size: 11px; }
.ld-note { display: flex; gap: 10px; padding: 12px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
.ld-note i { margin-top: 3px; }
.ld-note strong { display: block; }
.ld-note.is-danger { background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3; }
.ld-note.is-info { background: #f0f9ff; color: #075985; border: 1px solid #bae6fd; }
.ld-card { border: 1px solid var(--pm-border); border-radius: 14px; padding: 14px 16px; background: #fff; }
.ld-card-title { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--pm-muted); margin: 0 0 12px; }
.ld-facts { list-style: none; margin: 0; padding: 0; }
.ld-facts li { display: grid; grid-template-columns: 30px 92px 1fr; align-items: start; gap: 10px; padding: 8px 0; border-top: 1px dashed var(--pm-border); }
.ld-facts li:first-child { border-top: 0; padding-top: 0; }
.ld-icon {
    --accent: var(--pm-c-emerald);
    width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; font-size: 12px;
    color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent);
}
.ld-label { font-size: 13px; color: var(--pm-muted); padding-top: 6px; }
.ld-value { font-size: 13.5px; font-weight: 600; color: var(--pm-text); padding-top: 5px; word-break: break-word; }
.ld-value small { display: block; font-weight: 500; font-size: 12px; color: var(--pm-muted); margin-top: 1px; }
.ld-contact { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.ld-contact .btn { max-width: 100%; }
.ld-history { list-style: none; margin: 0; padding: 0; }
.ld-history li { position: relative; padding: 0 0 14px 20px; font-size: 13px; }
.ld-history li:last-child { padding-bottom: 0; }
.ld-history li::before { content: ''; position: absolute; left: 0; top: 5px; width: 10px; height: 10px; border-radius: 50%; background: var(--pm-c-slate); box-shadow: 0 0 0 3px #fff, 0 0 0 4px var(--pm-border); }
.ld-history li::after { content: ''; position: absolute; left: 4.5px; top: 20px; bottom: 2px; width: 1px; background: var(--pm-border); }
.ld-history li:last-child::after { display: none; }
.ld-history li.is-success::before { background: var(--pm-c-emerald); }
.ld-history li.is-danger::before { background: var(--pm-c-rose); }
.ld-history li.is-warning::before { background: var(--pm-c-amber); }
.ld-history strong { color: var(--pm-text); }
.ld-history time { font-size: 12px; color: var(--pm-muted); white-space: nowrap; }
.ld-reason { margin: 6px 0 0; padding: 8px 10px; border-radius: 8px; background: #f8fafc; color: var(--pm-text-2); font-size: 12.5px; }
</style>
