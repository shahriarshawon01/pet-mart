<template>
    <div class="gs">
        <div class="pm-page-head">
            <div>
                <h2>Site settings</h2>
                <p>Text, images and contact details shown on the customer website. Empty fields use the website's built-in default.</p>
            </div>
            <div class="pm-page-actions">
                <a v-if="siteUrl()" :href="siteUrl('/')" target="_blank" rel="noopener" class="btn btn-light">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> View website
                </a>
            </div>
        </div>

        <div v-if="loading" class="row g-4">
            <div class="col-lg-3"><div class="pm-card placeholder-glow p-3"><span v-for="i in 5" :key="i" class="placeholder col-12 rounded mb-2" style="height: 40px"></span></div></div>
            <div class="col-lg-9"><div class="pm-card placeholder-glow p-4"><span v-for="i in 4" :key="i" class="placeholder col-12 rounded mb-3" style="height: 56px"></span></div></div>
        </div>

        <div v-else-if="loadError" class="pm-card">
            <div class="pm-empty">
                <div class="pm-empty-icon" style="color: #e11d48; background: #fff1f2"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <h4>Settings could not be loaded</h4>
                <p class="mb-3">{{ loadError }}</p>
                <button type="button" class="btn btn-primary" @click="load"><i class="fa-solid fa-rotate"></i> Try again</button>
            </div>
        </div>

        <div v-else-if="!groupNames.length" class="pm-card">
            <div class="pm-empty">
                <div class="pm-empty-icon"><i class="fa-solid fa-sliders"></i></div>
                <h4>No settings yet</h4>
                <p>Run <code>php artisan db:seed --class=GeneralSettingSeeder</code> to create them.</p>
            </div>
        </div>

        <div v-else class="row g-4">
            <div class="col-lg-3">
                <nav class="pm-card gs-nav" aria-label="Setting groups">
                    <button
                        v-for="group in groupNames"
                        :key="group"
                        type="button"
                        class="gs-nav-item"
                        :class="{ 'is-active': active === group }"
                        :style="{ '--accent': meta(group).color }"
                        :aria-current="active === group ? 'true' : null"
                        @click="active = group"
                    >
                        <span class="gs-nav-icon"><i :class="meta(group).icon"></i></span>
                        <span class="min-w-0 flex-grow-1">
                            <strong>{{ meta(group).label }}</strong>
                            <small>{{ groups[group].length }} setting{{ groups[group].length === 1 ? '' : 's' }}</small>
                        </span>
                        <span v-if="groupDirty(group)" class="gs-dot" title="Unsaved changes"></span>
                        <span v-else-if="groupHasErrors(group)" class="gs-dot is-error" title="Needs attention"></span>
                    </button>
                </nav>
            </div>

            <div class="col-lg-9">
                <form @submit.prevent="save" novalidate>
                    <section class="pm-card" :key="active">
                        <div class="pm-card-head">
                            <div class="d-flex align-items-center gap-12">
                                <span class="gs-head-icon" :style="{ '--accent': meta(active).color }"><i :class="meta(active).icon"></i></span>
                                <div>
                                    <h3>{{ meta(active).label }}</h3>
                                    <p>{{ meta(active).description }}</p>
                                </div>
                            </div>
                        </div>

                        <div v-if="active === 'homepage'" class="pm-card-body pb-0">
                            <p class="pm-section-title">Live preview</p>
                            <div class="gs-hero" :style="heroImage ? { backgroundImage: `linear-gradient(90deg, rgba(9, 9, 11, .88) 0%, rgba(9, 9, 11, .55) 60%, rgba(9, 9, 11, .2) 100%), url('${heroImage}')` } : null">
                                <span class="gs-hero-badge"><i class="fa-solid fa-shield-halved"></i> {{ valueOrDefault('home_hero_badge', 'Verified pet & goods marketplace in Bangladesh') }}</span>
                                <h4 class="gs-hero-title">
                                    {{ heroTitle.lead }} <span>{{ heroTitle.last }}</span>
                                </h4>
                                <p class="gs-hero-sub">{{ valueOrDefault('home_hero_subtitle', 'Browse verified breeders, adoption posts, stud services and quality pet accessories across Bangladesh.') }}</p>
                                <span class="gs-hero-search"><i class="fa-solid fa-magnifying-glass"></i> Search pets, food, accessories…</span>
                            </div>
                        </div>

                        <div class="gs-fields">
                            <div v-for="item in groups[active]" :key="item.key" class="gs-field" :class="{ 'has-error': errors[item.key], 'is-dirty': isDirty(item) }">
                                <div class="gs-field-label">
                                    <label :for="'set-' + item.key" class="form-label mb-1">{{ item.display_name }}</label>
                                    <p v-if="help[item.key]" class="gs-help">{{ help[item.key] }}</p>
                                    <span class="gs-visibility" :class="item.is_public ? 'is-public' : ''">
                                        <i :class="item.is_public ? 'fa-regular fa-eye' : 'fa-solid fa-lock'"></i>
                                        {{ item.is_public ? 'Shown on website' : 'Admin only' }}
                                    </span>
                                </div>

                                <div class="gs-field-input">
                                    <template v-if="item.type === 'image'">
                                        <div
                                            class="gs-image"
                                            :class="{ 'is-empty': !item.image_url, 'is-drag': dragKey === item.key, 'is-busy': uploading[item.key] }"
                                            role="button"
                                            tabindex="0"
                                            :aria-label="item.image_url ? `Replace ${item.display_name}` : `Upload ${item.display_name}`"
                                            @click="openPicker(item)"
                                            @keydown.enter.prevent="openPicker(item)"
                                            @keydown.space.prevent="openPicker(item)"
                                            @dragover.prevent="dragKey = item.key"
                                            @dragleave.prevent="dragKey = null"
                                            @drop.prevent="onDrop(item, $event)"
                                        >
                                            <img v-if="item.image_url" :src="item.image_url" :alt="item.display_name">
                                            <div v-if="item.image_url && !uploading[item.key]" class="gs-image-hover">
                                                <span><i class="fa-solid fa-camera"></i> Click or drop to replace</span>
                                            </div>
                                            <div v-else class="gs-image-empty">
                                                <i class="fa-regular fa-image"></i>
                                                <strong>Click or drop an image here</strong>
                                                <span>The website shows its default design until you add one.</span>
                                            </div>
                                            <div v-if="uploading[item.key]" class="gs-image-progress">
                                                <div class="w-50">
                                                    <div class="mb-2 text-center"><i class="fa-solid fa-circle-notch fa-spin me-1"></i> Uploading {{ progress[item.key] || 0 }}%</div>
                                                    <div class="pm-progress"><span :style="{ width: (progress[item.key] || 0) + '%' }"></span></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="d-flex flex-wrap gap-2 align-items-center mt-2">
                                            <label class="btn btn-sm btn-primary mb-0" :class="{ disabled: uploading[item.key] }">
                                                <i class="fa-solid fa-arrow-up-from-bracket"></i> {{ item.image_url ? 'Replace image' : 'Upload image' }}
                                                <input :id="'set-' + item.key" type="file" class="d-none" accept="image/jpeg,image/png,image/webp" :disabled="uploading[item.key]" @change="onPick(item, $event)">
                                            </label>
                                            <a v-if="item.image_url" :href="item.image_url" target="_blank" rel="noopener" class="btn btn-sm btn-light"><i class="fa-solid fa-expand"></i> Full size</a>
                                            <button v-if="item.image_url" type="button" class="btn btn-sm btn-outline-danger" :disabled="uploading[item.key]" @click="removeImage(item)">
                                                <i class="fa-regular fa-trash-can"></i> Remove
                                            </button>
                                            <span class="form-text ms-auto">JPG, PNG or WebP · max 5 MB · at least 800 × 300 px</span>
                                        </div>
                                        <span v-if="errors[item.key]" class="error_message">{{ errors[item.key] }}</span>
                                        <p class="form-text mb-0 mt-1">Images save straight away; no need to press Save.</p>
                                    </template>

                                    <template v-else-if="item.type === 'boolean'">
                                        <div class="form-check form-switch">
                                            <input :id="'set-' + item.key" class="form-check-input" type="checkbox" :checked="isOn(item.value)" @change="item.value = $event.target.checked ? '1' : '0'">
                                            <label class="form-check-label" :for="'set-' + item.key">{{ isOn(item.value) ? 'On' : 'Off' }}</label>
                                        </div>
                                    </template>

                                    <template v-else>
                                        <div class="input-group">
                                            <span v-if="inputIcon(item)" class="input-group-text"><i :class="inputIcon(item)"></i></span>
                                            <textarea
                                                v-if="item.type === 'textarea'"
                                                :id="'set-' + item.key"
                                                v-model="item.value"
                                                rows="3"
                                                class="form-control"
                                                :class="{ 'is-invalid': errors[item.key] }"
                                                :placeholder="defaultHint(item)"
                                                :maxlength="5000"
                                                @input="$delete(errors, item.key)"
                                            ></textarea>
                                            <input
                                                v-else
                                                :id="'set-' + item.key"
                                                v-model="item.value"
                                                :type="item.type === 'email' ? 'email' : item.type === 'url' ? 'url' : 'text'"
                                                class="form-control"
                                                :class="{ 'is-invalid': errors[item.key] }"
                                                :placeholder="defaultHint(item)"
                                                maxlength="5000"
                                                @input="$delete(errors, item.key)"
                                            >
                                            <a v-if="item.type === 'url' && validUrl(item.value)" :href="item.value" target="_blank" rel="noopener" class="btn btn-light border" title="Open link"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                                        </div>
                                        <div class="d-flex justify-content-between gap-2 mt-1">
                                            <span v-if="errors[item.key]" class="error_message mt-0">{{ errors[item.key] }}</span>
                                            <span v-else class="form-text mt-0">{{ isDirty(item) ? 'Changed – not saved yet' : '' }}</span>
                                            <span v-if="limits[item.key]" class="form-text mt-0 text-nowrap" :class="{ 'text-danger': length(item) > limits[item.key] }">
                                                {{ length(item) }} / {{ limits[item.key] }}
                                            </span>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </section>

                    <transition name="gs-bar">
                        <div v-if="dirtyCount" class="gs-savebar" role="region" aria-label="Unsaved changes">
                            <span><i class="fa-solid fa-circle-info"></i> {{ dirtyCount }} unsaved change{{ dirtyCount === 1 ? '' : 's' }}</span>
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-light" :disabled="saving" @click="discard">Discard</button>
                                <button type="submit" class="btn btn-primary" :disabled="saving">
                                    <i :class="saving ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-check'"></i> Save changes
                                </button>
                            </div>
                        </div>
                    </transition>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
const GROUPS = {
    general: { label: 'General', icon: 'fa-solid fa-store', color: 'var(--pm-c-emerald)', description: 'Your marketplace name and tagline.' },
    homepage: { label: 'Homepage', icon: 'fa-solid fa-house', color: 'var(--pm-c-sky)', description: 'The banner and heading visitors see first.' },
    contact: { label: 'Contact', icon: 'fa-solid fa-headset', color: 'var(--pm-c-teal)', description: 'How members reach your support team.' },
    social: { label: 'Social media', icon: 'fa-solid fa-share-nodes', color: 'var(--pm-c-indigo)', description: 'Links to your social pages.' },
    footer: { label: 'Footer', icon: 'fa-solid fa-table-columns', color: 'var(--pm-c-amber)', description: 'Text at the bottom of every page.' },
    seo: { label: 'SEO', icon: 'fa-solid fa-magnifying-glass', color: 'var(--pm-c-violet)', description: 'How the site appears in search results.' },
};
const ORDER = ['general', 'homepage', 'contact', 'social', 'footer', 'seo'];
const MAX_BYTES = 5 * 1024 * 1024;

export default {
    name: 'generalSettingForm',
    data() {
        return {
            loading: true,
            loadError: '',
            saving: false,
            groups: {},
            original: {},
            active: '',
            errors: {},
            uploading: {},
            progress: {},
            dragKey: null,
            help: {
                site_name: 'Shown in the header and browser tab.',
                site_tagline: 'A short line describing PetMart.',
                home_hero_banner: 'Wide photo behind the homepage heading. Best at 1920 × 700 px with the subject in the centre.',
                home_hero_badge: 'Small label above the heading.',
                home_hero_title: 'Main homepage heading. The last word is highlighted in green.',
                home_hero_subtitle: 'One or two sentences under the heading.',
                contact_phone: 'Shown on the Contact page, e.g. 01712345678.',
                contact_email: 'Shown on the Contact page.',
                facebook_url: 'Full link to your Facebook page.',
                footer_about: 'Short description in the footer.',
                footer_help_title: 'Heading above the help links.',
                footer_notice_title: 'Title of the safety notice box.',
                footer_notice_text: 'Safety advice shown in the footer.',
                footer_copyright: 'Name after the © symbol.',
            },
            limits: {
                site_name: 40,
                site_tagline: 80,
                home_hero_badge: 60,
                home_hero_title: 70,
                home_hero_subtitle: 180,
                footer_about: 300,
                footer_notice_title: 50,
                footer_notice_text: 200,
            },
        };
    },
    computed: {
        groupNames() {
            return Object.keys(this.groups).sort((a, b) => {
                const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
                return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
            });
        },
        items() {
            return Object.values(this.groups).flat();
        },
        dirtyCount() {
            return this.items.filter((i) => this.isDirty(i)).length;
        },
        heroImage() {
            const item = this.items.find((i) => i.key === 'home_hero_banner');
            return item && item.image_url;
        },
        heroTitle() {
            const words = this.valueOrDefault('home_hero_title', 'Find & Sell Pets, Animals & Supplies Safely').trim().split(/\s+/);
            return { lead: words.slice(0, -1).join(' '), last: words[words.length - 1] };
        },
    },
    methods: {
        meta(group) {
            return GROUPS[group] || { label: this.indexToLabel(group), icon: 'fa-solid fa-sliders', color: 'var(--pm-c-slate)', description: '' };
        },
        normal(v) {
            return v === null || v === undefined ? '' : String(v);
        },
        isDirty(item) {
            return item.type !== 'image' && this.normal(item.value) !== this.normal(this.original[item.key]);
        },
        groupDirty(group) {
            return (this.groups[group] || []).some((i) => this.isDirty(i));
        },
        groupHasErrors(group) {
            return (this.groups[group] || []).some((i) => this.errors[i.key]);
        },
        valueOrDefault(key, fallback) {
            const item = this.items.find((i) => i.key === key);
            const v = item ? this.normal(item.value).trim() : '';
            return v || fallback;
        },
        isOn(v) {
            return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
        },
        length(item) {
            return this.normal(item.value).length;
        },
        validUrl(v) {
            return /^https?:\/\/\S+$/i.test(this.normal(v));
        },
        inputIcon(item) {
            if (item.type === 'email') return 'fa-regular fa-envelope';
            if (item.type === 'url') return 'fa-solid fa-link';
            if (/phone/.test(item.key)) return 'fa-solid fa-phone';
            return '';
        },
        defaultHint(item) {
            if (item.type === 'email') return 'support@example.com';
            if (item.type === 'url') return 'https://';
            return 'Website default';
        },
        snapshot() {
            const map = {};
            this.items.forEach((i) => { if (i.type !== 'image') map[i.key] = i.value; });
            this.original = map;
        },
        errorMessage(err, fallback) {
            return this.httpErrorMessage(err, fallback);
        },
        load() {
            this.loading = true;
            this.loadError = '';
            this.errors = {};
            this.axios.get(this.urlGenerate('api/general_setting'))
                .then((res) => {
                    if (parseInt(res.data.status) !== 2000) throw new Error(res.data.message || 'Could not load settings.');
                    this.groups = res.data.result || {};
                    this.snapshot();
                    if (!this.groups[this.active]) this.active = this.groupNames[0] || '';
                })
                .catch((err) => { this.loadError = this.errorMessage(err, 'Could not load settings.'); })
                .finally(() => { this.loading = false; });
        },
        discard() {
            this.items.forEach((i) => { if (i.type !== 'image') i.value = this.original[i.key]; });
            this.errors = {};
        },
        save() {
            const settings = {};
            this.items.forEach((i) => {
                if (this.isDirty(i)) settings[i.key] = this.normal(i.value);
            });
            if (!Object.keys(settings).length) return;

            this.saving = true;
            this.errors = {};
            this.axios.post(this.urlGenerate('api/general_setting'), { settings })
                .then((res) => {
                    const status = parseInt(res.data.status);
                    if (status === 2000) {
                        this.snapshot();
                        this.$toastr('success', res.data.message || 'Settings saved.', 'Saved');
                        return;
                    }
                    if (status === 3000) {
                        const errs = {};
                        Object.entries(res.data.result || {}).forEach(([k, v]) => { errs[k] = Array.isArray(v) ? v[0] : v; });
                        this.errors = errs;
                        Object.keys(settings).forEach((k) => { if (!errs[k]) this.original[k] = settings[k]; });
                        const firstGroup = this.groupNames.find((g) => this.groupHasErrors(g));
                        if (firstGroup) this.active = firstGroup;
                        this.$toastr('warning', res.data.message, 'Check the highlighted fields');
                        return;
                    }
                    this.$toastr('error', res.data.message || 'Settings could not be saved.', 'Error');
                })
                .catch((err) => this.$toastr('error', this.errorMessage(err, 'Settings could not be saved.'), 'Error'))
                .finally(() => { this.saving = false; });
        },
        openPicker(item) {
            if (this.uploading[item.key]) return;
            const input = document.getElementById('set-' + item.key);
            if (input) input.click();
        },
        onPick(item, event) {
            const file = event.target.files && event.target.files[0];
            event.target.value = '';
            if (file) this.uploadImage(item, file);
        },
        onDrop(item, event) {
            this.dragKey = null;
            const file = event.dataTransfer.files && event.dataTransfer.files[0];
            if (file) this.uploadImage(item, file);
        },
        uploadImage(item, file) {
            this.$delete(this.errors, item.key);
            let problem = '';
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) problem = 'Choose a JPG, PNG or WebP image.';
            else if (file.size > MAX_BYTES) problem = 'The image is larger than 5 MB.';
            if (problem) {
                this.$set(this.errors, item.key, problem);
                return;
            }

            const form = new FormData();
            form.append('image', file);
            this.$set(this.uploading, item.key, true);
            this.$set(this.progress, item.key, 0);
            this.axios.post(this.urlGenerate(`api/general_setting/${item.key}/image`), form, {
                onUploadProgress: (e) => {
                    if (e.total) this.$set(this.progress, item.key, Math.round((e.loaded / e.total) * 100));
                },
            })
                .then((res) => {
                    item.image_url = res.data.result && res.data.result.image_url;
                    this.$toastr('success', res.data.message || 'Image updated.', 'Saved');
                })
                .catch((err) => this.$set(this.errors, item.key, this.errorMessage(err, 'The image could not be uploaded.')))
                .finally(() => this.$set(this.uploading, item.key, false));
        },
        removeImage(item) {
            this.confirmBox((ok) => {
                if (!ok) return;
                this.$set(this.uploading, item.key, true);
                this.axios.delete(this.urlGenerate(`api/general_setting/${item.key}/image`))
                    .then((res) => {
                        item.image_url = null;
                        this.$toastr('success', res.data.message || 'Image removed.', 'Saved');
                    })
                    .catch((err) => this.$toastr('error', this.errorMessage(err, 'The image could not be removed.'), 'Error'))
                    .finally(() => this.$set(this.uploading, item.key, false));
            }, `Remove ${item.display_name}?`, 'The website goes back to its default design.');
        },
        warnUnsaved(e) {
            if (!this.dirtyCount) return undefined;
            e.preventDefault();
            e.returnValue = '';
            return '';
        },
    },
    beforeRouteLeave(to, from, next) {
        if (!this.dirtyCount) return next();
        this.confirmBox((ok) => next(!!ok), 'Leave without saving?', `You have ${this.dirtyCount} unsaved change(s).`);
    },
    mounted() {
        window.addEventListener('beforeunload', this.warnUnsaved);
        this.load();
    },
    beforeDestroy() {
        window.removeEventListener('beforeunload', this.warnUnsaved);
    },
};
</script>

<style scoped>
.gs-nav {
    padding: 8px;
    position: sticky;
    top: calc(var(--pm-topbar-h) + 16px);
}
.gs-nav-item {
    --accent: var(--pm-c-emerald);
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    text-align: left;
    transition: background 0.15s;
}
.gs-nav-item + .gs-nav-item { margin-top: 2px; }
.gs-nav-item:hover { background: var(--pm-bg); }
.gs-nav-item.is-active { background: color-mix(in srgb, var(--accent) 10%, transparent); }
.gs-nav-item strong { display: block; font-size: 13.5px; color: var(--pm-text); font-weight: 600; }
.gs-nav-item small { display: block; font-size: 12px; color: var(--pm-muted); }
.gs-nav-icon,
.gs-head-icon {
    --accent: var(--pm-c-emerald);
    width: 34px;
    height: 34px;
    border-radius: 9px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    font-size: 14px;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
}
.gs-nav-item.is-active .gs-nav-icon { background: var(--accent); color: #fff; }
.gs-head-icon { width: 40px; height: 40px; font-size: 16px; border-radius: 11px; }
.gs-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--pm-c-amber); flex-shrink: 0; }
.gs-dot.is-error { background: #e11d48; }

.gs-fields { padding: 4px 20px 8px; }
.gs-field {
    display: grid;
    grid-template-columns: minmax(180px, 32%) 1fr;
    gap: 12px 28px;
    padding: 20px 0;
    border-top: 1px solid var(--pm-border);
}
.gs-field:first-child { border-top: 0; }
.gs-field.is-dirty .form-control { border-color: var(--pm-c-amber); background: #fffdf5; }
.gs-help { font-size: 12.5px; color: var(--pm-muted); margin: 0 0 8px; line-height: 1.45; }
.gs-visibility {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--pm-muted);
    background: var(--pm-bg);
    padding: 2px 8px;
    border-radius: 6px;
}
.gs-visibility.is-public { color: var(--pm-brand-600); background: var(--pm-brand-50); }
.input-group-text { background: #fafafa; border-color: #d5dde8; color: var(--pm-muted); border-radius: 10px 0 0 10px; }

.gs-image {
    position: relative;
    aspect-ratio: 1920 / 700;
    border-radius: 12px;
    overflow: hidden;
    background: var(--pm-ink);
    border: 1px solid var(--pm-border);
    transition: border-color 0.15s, box-shadow 0.15s;
}
.gs-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
.gs-image.is-empty { background: #fafafa; border: 1.5px dashed #d4d4d8; }
.gs-image.is-drag { border-color: var(--pm-brand); box-shadow: 0 0 0 4px rgba(var(--pm-brand-rgb), 0.15); }
.gs-image { cursor: pointer; }
.gs-image.is-busy { cursor: progress; }
.gs-image:hover, .gs-image:focus-visible { border-color: var(--pm-brand); outline: none; }
.gs-image:focus-visible { box-shadow: 0 0 0 4px rgba(var(--pm-brand-rgb), 0.2); }
.gs-image.is-empty:hover { background: var(--pm-brand-50); }
.gs-image-hover {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(9, 9, 11, 0.45);
    color: #fff;
    font-weight: 600;
    font-size: 13.5px;
    opacity: 0;
    transition: opacity 0.15s;
}
.gs-image-hover span { padding: 8px 14px; border-radius: 999px; background: rgba(9, 9, 11, 0.55); }
.gs-image:hover .gs-image-hover, .gs-image:focus-visible .gs-image-hover { opacity: 1; }
.gs-image-empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 16px;
    gap: 4px;
    color: var(--pm-muted);
    font-size: 13px;
}
.gs-image-empty i { font-size: 28px; color: #a1a1aa; margin-bottom: 4px; }
.gs-image-empty strong { color: var(--pm-text); }
.gs-image-progress {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(9, 9, 11, 0.65);
    color: #fff;
    font-weight: 600;
    font-size: 13px;
}

.gs-hero {
    border-radius: 14px;
    padding: 28px;
    color: #fff;
    background: linear-gradient(120deg, var(--pm-ink) 0%, #1e3a5f 100%);
    background-size: cover;
    background-position: center;
    min-height: 220px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
}
.gs-hero-badge {
    align-self: flex-start;
    font-size: 11.5px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(var(--pm-brand-rgb), 0.18);
    color: #6ee7b7;
    border: 1px solid rgba(110, 231, 183, 0.3);
}
.gs-hero-title { color: #fff; font-size: 24px; line-height: 1.25; margin: 0; max-width: 560px; }
.gs-hero-title span { color: var(--pm-brand); }
.gs-hero-sub { color: #d4d4d8; font-size: 13.5px; margin: 0; max-width: 520px; }
.gs-hero-search {
    align-self: flex-start;
    margin-top: 4px;
    background: #fff;
    color: #a1a1aa;
    font-size: 13px;
    padding: 9px 14px;
    border-radius: 10px;
    min-width: 260px;
}

.gs-savebar {
    position: sticky;
    bottom: 16px;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 12px 16px;
    border-radius: 14px;
    background: var(--pm-ink);
    color: #e4e4e7;
    font-size: 13.5px;
    box-shadow: 0 16px 32px -12px rgba(9, 9, 11, 0.5);
}
.gs-savebar i { color: var(--pm-c-amber); margin-right: 6px; }
.gs-savebar .btn-light { background: transparent; color: #e4e4e7; border-color: rgba(255, 255, 255, 0.35); }
.gs-savebar .btn-light:hover { background: rgba(255, 255, 255, 0.15); color: #fff; }
.gs-bar-enter-active, .gs-bar-leave-active { transition: transform 0.2s, opacity 0.2s; }
.gs-bar-enter, .gs-bar-leave-to { transform: translateY(12px); opacity: 0; }

@media (max-width: 991.98px) {
    .gs-nav { position: static; display: flex; overflow-x: auto; gap: 4px; }
    .gs-nav-item { width: auto; flex-shrink: 0; }
    .gs-nav-item + .gs-nav-item { margin-top: 0; }
    .gs-nav-item small { display: none; }
}
@media (max-width: 767.98px) {
    .gs-field { grid-template-columns: 1fr; gap: 8px; }
    .gs-hero { padding: 20px; }
    .gs-hero-title { font-size: 19px; }
}
</style>
