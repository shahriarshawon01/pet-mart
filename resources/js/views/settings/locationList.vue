<template>
    <div>
        <div class="pm-page-head">
            <div>
                <h2>Locations</h2>
                <p>Divisions, districts and areas members choose when they post a listing or search. Hidden locations stay on old listings but cannot be chosen.</p>
            </div>
            <div class="pm-page-actions">
                <span class="pm-badge no-dot is-neutral">{{ counts.division || 0 }} divisions</span>
                <span class="pm-badge no-dot is-neutral">{{ counts.district || 0 }} districts</span>
                <span class="pm-badge no-dot is-neutral">{{ counts.area || 0 }} areas</span>
            </div>
        </div>

        <div v-if="loading && !rows.length" class="row g-3">
            <div v-for="i in 3" :key="i" class="col-lg-4"><div class="pm-card placeholder-glow p-3"><span v-for="j in 6" :key="j" class="placeholder col-12 rounded mb-2" style="height: 38px"></span></div></div>
        </div>

        <div v-else class="row g-3">
            <div v-for="col in columns" :key="col.type" class="col-lg-4">
                <section class="pm-card loc-col" :class="{ 'is-disabled': !col.parent && col.type !== 'division' }">
                    <div class="pm-card-head">
                        <div class="min-w-0">
                            <h3>{{ col.title }}</h3>
                            <p class="text-truncate">{{ col.subtitle }}</p>
                        </div>
                        <button
                            v-if="col.type === 'division' || col.parent"
                            type="button"
                            class="btn btn-sm btn-primary"
                            @click="create(col)"
                        >
                            <i class="fa-solid fa-plus"></i> Add
                        </button>
                    </div>

                    <div v-if="col.type === 'division' || col.parent" class="loc-search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input v-model="search[col.type]" type="search" class="form-control form-control-sm" :placeholder="`Search ${col.title.toLowerCase()}…`" :aria-label="`Search ${col.title}`">
                    </div>

                    <ul v-if="col.items.length" class="loc-list">
                        <li
                            v-for="loc in col.items"
                            :key="loc.id"
                            class="loc-item"
                            :class="{ 'is-selected': isSelected(loc), 'is-hidden': !loc.status }"
                        >
                            <button type="button" class="loc-main" @click="select(loc)" :disabled="loc.type === 'area'">
                                <span class="min-w-0">
                                    <span class="loc-name">{{ loc.name }}</span>
                                    <span v-if="loc.bn_name" class="loc-bn">{{ loc.bn_name }}</span>
                                </span>
                                <span class="loc-meta">
                                    <span v-if="!loc.status" class="pm-badge no-dot is-neutral" style="font-size: 11px">Hidden</span>
                                    <span v-if="loc.listings_count" class="loc-count" :title="`${loc.listings_count} listing(s)`"><i class="fa-solid fa-tag"></i> {{ loc.listings_count }}</span>
                                    <span v-if="loc.type !== 'area'" class="loc-count" :title="`${loc.children_count} sub-location(s)`">{{ loc.children_count }} <i class="fa-solid fa-chevron-right"></i></span>
                                </span>
                            </button>
                            <div class="loc-actions">
                                <button type="button" class="btn btn-sm btn-light btn-icon" :title="loc.status ? 'Hide from website' : 'Show on website'" @click="toggle(loc)">
                                    <i :class="loc.status ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-light btn-icon" title="Edit" @click="edit(loc)"><i class="fa-regular fa-pen-to-square"></i></button>
                                <button type="button" class="btn btn-sm btn-light btn-icon text-danger" title="Delete" @click="remove(loc)"><i class="fa-regular fa-trash-can"></i></button>
                            </div>
                        </li>
                    </ul>
                    <div v-else class="pm-empty py-4">
                        <div class="pm-empty-icon"><i class="fa-solid fa-map-location-dot"></i></div>
                        <p>{{ col.empty }}</p>
                    </div>
                </section>
            </div>
        </div>

        <form-modal modal-size="modal-md" :title="modalHeading" :submit-text="form.id ? 'Save changes' : 'Add'" @submit="save">
            <p v-if="form.parentName" class="text-muted mb-3">In <strong class="text-dark">{{ form.parentName }}</strong></p>
            <div v-if="similar.length" class="loc-similar" role="alert">
                <div class="loc-similar-head">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <div>
                        <strong>Is this the same place?</strong>
                        <p>A similar {{ (LABELS[form.type] || '').toLowerCase() }} already exists. Adding a second spelling splits listings and confuses buyers.</p>
                    </div>
                </div>
                <ul>
                    <li v-for="s in similar" :key="s.id">
                        <span>
                            <strong>{{ s.name }}</strong><template v-if="s.bn_name"> ({{ s.bn_name }})</template>
                            <small v-if="s.parent"> · in {{ s.parent }}</small>
                        </span>
                        <span v-if="!s.status" class="badge bg-secondary-subtle text-secondary">Hidden</span>
                    </li>
                </ul>
                <div class="loc-similar-actions">
                    <button type="button" class="btn btn-sm btn-light" @click="cancelSimilar">Change the name</button>
                    <button type="button" class="btn btn-sm btn-warning" @click="save(true)">It's different, {{ form.id ? 'save' : 'add' }} anyway</button>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-md-7">
                    <label class="form-label" for="loc-name">Name (English) <span class="req">*</span></label>
                    <input id="loc-name" v-model="form.name" class="form-control" maxlength="100" placeholder="e.g. Mirpur" :class="{ 'is-invalid': errors.name || errors.slug }" @input="clearFeedback('name')">
                    <span v-if="errors.name || errors.slug" class="error_message">{{ errors.name || errors.slug }}</span>
                </div>
                <div class="col-md-5">
                    <label class="form-label" for="loc-bn">Name (Bangla)</label>
                    <input id="loc-bn" v-model="form.bn_name" class="form-control" maxlength="100" lang="bn" placeholder="যেমন মিরপুর" :class="{ 'is-invalid': errors.bn_name }" @input="clearFeedback('bn_name')">
                    <span v-if="errors.bn_name" class="error_message">{{ errors.bn_name }}</span>
                </div>
                <div class="col-md-5">
                    <label class="form-label" for="loc-order">Order</label>
                    <input id="loc-order" v-model.number="form.sort_order" type="number" min="0" class="form-control" placeholder="0">
                    <div class="form-text">Lower numbers come first; same numbers sort A–Z.</div>
                </div>
                <div class="col-md-7 d-flex align-items-center">
                    <div class="form-check form-switch">
                        <input id="loc-status" v-model="form.status" class="form-check-input" type="checkbox">
                        <label class="form-check-label" for="loc-status">Show on website</label>
                    </div>
                </div>
            </div>
        </form-modal>
    </div>
</template>

<script>
import FormModal from "../../components/formModal";

const LABELS = { division: 'Division', district: 'District', area: 'Area' };
const EMPTY = () => ({ id: null, type: 'division', parent_id: null, parentName: '', name: '', bn_name: '', sort_order: 0, status: true });

export default {
    name: "locationList",
    components: { FormModal },
    data() {
        return {
            rows: [],
            counts: {},
            loading: false,
            selectedDivision: null,
            selectedDistrict: null,
            search: { division: '', district: '', area: '' },
            form: EMPTY(),
            errors: {},
            similar: [],
            LABELS,
        };
    },
    computed: {
        byId() {
            return Object.fromEntries(this.rows.map((r) => [r.id, r]));
        },
        division() {
            return this.byId[this.selectedDivision] || null;
        },
        district() {
            return this.byId[this.selectedDistrict] || null;
        },
        columns() {
            return [
                {
                    type: 'division', title: 'Divisions', parent: null,
                    subtitle: 'Select one to see its districts',
                    items: this.filtered('division', null),
                    empty: 'No divisions yet.',
                },
                {
                    type: 'district', title: 'Districts', parent: this.division,
                    subtitle: this.division ? `In ${this.division.name}` : 'Select a division first',
                    items: this.division ? this.filtered('district', this.division.id) : [],
                    empty: this.division ? 'No districts in this division yet.' : 'Select a division on the left.',
                },
                {
                    type: 'area', title: 'Areas', parent: this.district,
                    subtitle: this.district ? `In ${this.district.name}` : 'Select a district first',
                    items: this.district ? this.filtered('area', this.district.id) : [],
                    empty: this.district ? 'No areas yet. Add neighbourhoods members can choose.' : 'Select a district.',
                },
            ];
        },
        modalHeading() {
            return `${this.form.id ? 'Edit' : 'Add'} ${LABELS[this.form.type].toLowerCase()}`;
        },
    },
    methods: {
        filtered(type, parentId) {
            const q = (this.search[type] || '').trim().toLowerCase();
            return this.rows.filter((r) => r.type === type && (r.parent_id || null) === parentId
                && (!q || r.name.toLowerCase().includes(q) || (r.bn_name || '').includes(q)));
        },
        isSelected(loc) {
            return loc.id === this.selectedDivision || loc.id === this.selectedDistrict;
        },
        select(loc) {
            if (loc.type === 'division') {
                this.selectedDivision = loc.id;
                this.selectedDistrict = null;
                this.search.district = '';
            } else if (loc.type === 'district') {
                this.selectedDistrict = loc.id;
            }
            this.search.area = '';
        },
        load() {
            this.loading = true;
            this.adminRequest('get', 'api/v1/admin/locations', {}, { silent: true })
                .then((result) => {
                    this.rows = result.data || [];
                    this.counts = result.counts || {};
                    if (!this.byId[this.selectedDivision]) {
                        const first = this.rows.find((r) => r.type === 'division');
                        this.selectedDivision = first ? first.id : null;
                        this.selectedDistrict = null;
                    }
                })
                .catch(() => {})
                .finally(() => { this.loading = false; });
        },
        create(col) {
            this.errors = {};
            this.form = { ...EMPTY(), type: col.type, parent_id: col.parent ? col.parent.id : null, parentName: col.parent ? col.parent.name : '' };
            this.similar = [];
            this.openModal('formModal', this.modalHeading, false, false);
        },
        edit(loc) {
            this.errors = {};
            const parent = this.byId[loc.parent_id];
            this.form = { ...EMPTY(), ...loc, bn_name: loc.bn_name || '', parentName: parent ? parent.name : '' };
            this.similar = [];
            this.openModal('formModal', this.modalHeading, false, false);
        },
        save(confirmSimilar = false) {
            if (!this.form.name.trim()) {
                this.errors = { name: 'Name is required.' };
                return;
            }
            const payload = { name: this.form.name.trim(), bn_name: this.form.bn_name || null, sort_order: this.form.sort_order || 0, status: this.form.status };
            if (confirmSimilar === true) payload.confirm_similar = 1;
            const request = this.form.id
                ? { method: 'put', url: `api/v1/admin/locations/${this.form.id}`, data: payload }
                : { method: 'post', url: 'api/v1/admin/locations', data: { ...payload, parent_id: this.form.parent_id } };

            this.$store.commit('httpRequest', true);
            this.axios({ ...request, url: this.urlGenerate(request.url) })
                .then((res) => {
                    const body = res.data || {};
                    if (parseInt(body.status) !== 2000) throw { response: { status: 422, data: body } };
                    this.$toastr('success', body.message || 'Saved.', 'Done');
                    this.similar = [];
                    this.closeModal('formModal', false);
                    this.load();
                })
                .catch((err) => {
                    const res = err.response || {};
                    const body = res.data || {};
                    if (res.status === 409 && Array.isArray(body.similar)) {
                        this.errors = {};
                        this.similar = body.similar;
                        this.$toastr('warning', body.message || 'A similar location already exists. Is this the same place?', 'Check the name');
                        return;
                    }
                    const bag = body.errors || {};
                    this.errors = Object.fromEntries(Object.entries(bag).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
                    this.$toastr('error', this.httpErrorMessage(err), 'Error');
                })
                .finally(() => this.$store.commit('httpRequest', false));
        },
        clearFeedback(field) {
            if (this.errors[field] || (field === 'name' && this.errors.slug)) this.errors = {};
            if (field === 'name') this.similar = [];
        },
        cancelSimilar() {
            this.similar = [];
            this.$nextTick(() => document.getElementById('loc-name')?.focus());
        },
        toggle(loc) {
            this.adminRequest('post', `api/v1/admin/locations/${loc.id}/toggle-status`)
                .then((res) => { loc.status = res.status; })
                .catch(() => {});
        },
        remove(loc) {
            this.confirmBox((ok) => {
                if (!ok) return;
                this.adminRequest('delete', `api/v1/admin/locations/${loc.id}`).then(() => this.load()).catch(() => {});
            }, `Delete ${loc.name}?`, 'Only unused locations without sub-locations can be deleted. Otherwise, hide it.');
        },
    },
    mounted() {
        this.load();
    },
}
</script>

<style scoped>
.loc-similar { border: 1px solid #fcd34d; background: #fffbeb; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; }
.loc-similar-head { display: flex; gap: 12px; }
.loc-similar-head i { color: #d97706; font-size: 18px; margin-top: 2px; }
.loc-similar-head strong { color: #92400e; font-size: 14px; }
.loc-similar-head p { margin: 2px 0 0; color: #a16207; font-size: 12.5px; }
.loc-similar ul { list-style: none; margin: 10px 0 12px 30px; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.loc-similar li { display: flex; align-items: center; justify-content: space-between; gap: 8px; background: #fff; border: 1px solid #fde68a; border-radius: 8px; padding: 7px 10px; font-size: 13px; }
.loc-similar li small { color: var(--pm-muted); }
.loc-similar-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.loc-col { display: flex; flex-direction: column; height: calc(100vh - 230px); min-height: 420px; }
.loc-col.is-disabled { opacity: 0.7; }
.loc-search { position: relative; padding: 10px 16px; border-bottom: 1px solid var(--pm-border); }
.loc-search i { position: absolute; left: 28px; top: 50%; transform: translateY(-50%); color: var(--pm-muted); font-size: 12px; }
.loc-search .form-control { padding-left: 30px; border-radius: 8px; }
.loc-list { list-style: none; margin: 0; padding: 6px; overflow-y: auto; flex: 1; }
.loc-item { display: flex; align-items: center; gap: 4px; border-radius: 10px; transition: background 0.12s; }
.loc-item:hover { background: var(--pm-bg); }
.loc-item.is-selected { background: var(--pm-brand-50); box-shadow: inset 3px 0 0 var(--pm-brand); }
.loc-item.is-hidden .loc-name { color: var(--pm-muted); text-decoration: line-through; }
.loc-main { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 10px; border: 0; background: transparent; text-align: left; }
.loc-main:disabled { cursor: default; color: inherit; }
.loc-name { display: block; font-weight: 600; font-size: 13.5px; color: var(--pm-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.loc-bn { display: block; font-size: 12px; color: var(--pm-muted); }
.loc-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.loc-count { font-size: 12px; color: var(--pm-muted); white-space: nowrap; }
.loc-count i { font-size: 10px; }
.loc-actions { display: flex; gap: 2px; padding-right: 6px; opacity: 0; transition: opacity 0.12s; }
.loc-item:hover .loc-actions, .loc-item:focus-within .loc-actions, .loc-item.is-selected .loc-actions { opacity: 1; }
@media (max-width: 991.98px) {
    .loc-col { height: auto; max-height: 420px; }
    .loc-actions { opacity: 1; }
}
</style>
