<template>
    <div>
        <div class="pm-page-head">
            <div>
                <h2>Members</h2>
                <p>People who buy and sell on PetMart. Dashboard accounts are under Access control › Users.</p>
            </div>
        </div>

        <div class="row">
            <div class="col-6 col-xl-3">
                <stat-card label="All members" :value="counts.total || 0" icon="fa-solid fa-users" color="var(--pm-c-violet)"></stat-card>
            </div>
            <div class="col-6 col-xl-3">
                <stat-card label="Active" :value="counts.active || 0" icon="fa-solid fa-user-check" color="var(--pm-c-emerald)"></stat-card>
            </div>
            <div class="col-6 col-xl-3">
                <stat-card label="Inactive" :value="counts.inactive || 0" icon="fa-solid fa-user-slash" color="var(--pm-c-rose)"></stat-card>
            </div>
            <div class="col-6 col-xl-3">
                <stat-card label="Number verified" :value="counts.verified || 0" icon="fa-solid fa-circle-check" color="var(--pm-c-sky)"></stat-card>
            </div>
        </div>

        <data-table :table-heading="tableHeading" search-placeholder="Search name, phone or email…" empty-icon="fa-solid fa-user" empty-title="No members found">
            <template v-slot:filter>
                <select v-model="formFilter.status" class="form-select" aria-label="Status" @change="getDataList(1)">
                    <option value="">Any status</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                </select>
                <select v-model="formFilter.is_verified" class="form-select" aria-label="Number verification" @change="getDataList(1)">
                    <option value="">Any badge</option>
                    <option value="1">Number verified</option>
                    <option value="0">Number not verified</option>
                </select>
            </template>

            <template v-slot:data>
                <tr v-for="member in (dataList.data || [])" :key="member.id">
                    <td>
                        <div class="d-flex align-items-center gap-12">
                            <img v-if="member.image" :src="member.image" class="pm-avatar" alt="">
                            <span v-else class="pm-avatar" :class="avatarTone(member.id)">{{ nameInitials(member.name) }}</span>
                            <div class="min-w-0">
                                <span class="pm-cell-title">
                                    {{ member.name }}
                                    <i v-if="member.is_verified" class="fa-solid fa-circle-check text-success" title="Number verified"></i>
                                </span>
                                <span class="pm-cell-sub">{{ member.email || 'No email' }}</span>
                            </div>
                        </div>
                    </td>
                    <td class="text-nowrap">{{ member.phone }}</td>
                    <td class="text-nowrap">
                        <span class="fw-600 text-dark">{{ member.active_products_count }}</span>
                        <span class="text-muted"> live / {{ member.products_count }}</span>
                    </td>
                    <td class="text-nowrap">{{ dateTime(member.created_at, false) }}</td>
                    <td>
                        <button type="button" class="btn btn-sm p-0 border-0" :disabled="busyId === member.id" @click="toggleVerification(member)" :title="member.is_verified ? 'Remove number verification' : 'Mark number as verified'">
                            <span class="pm-badge" :class="member.is_verified ? 'is-info' : 'is-neutral'">{{ member.is_verified ? 'Number verified' : 'Not verified' }}</span>
                        </button>
                    </td>
                    <td>
                        <div class="form-check form-switch m-0" :title="member.status ? 'Active – click to deactivate' : 'Inactive – click to activate'">
                            <input class="form-check-input" type="checkbox" role="switch" :checked="member.status" :disabled="busyId === member.id" :aria-label="`${member.name} active`" @click.prevent="toggleStatus(member)">
                        </div>
                    </td>
                    <td>
                        <div class="pm-actions">
                            <button type="button" class="btn btn-sm btn-light btn-icon" title="Edit" @click="edit(member)"><i class="fa-regular fa-pen-to-square"></i></button>
                            <button type="button" class="btn btn-sm btn-outline-danger btn-icon" title="Delete" @click="remove(member)"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            </template>
        </data-table>

        <form-modal modal-size="modal-xl" title="Edit member" submit-text="Save changes" @submit="save">
            <div v-if="editing" class="me-grid">
                <aside class="me-side">
                    <div
                        class="me-photo"
                        :class="{ 'is-drag': photoDrag, 'is-busy': photoBusy }"
                        role="button"
                        tabindex="0"
                        :aria-label="form.image ? 'Change photo' : 'Upload photo'"
                        @click="pickPhoto"
                        @keydown.enter.prevent="pickPhoto"
                        @keydown.space.prevent="pickPhoto"
                        @dragover.prevent="photoDrag = true"
                        @dragleave.prevent="photoDrag = false"
                        @drop.prevent="onPhotoDrop"
                    >
                        <img v-if="photoUrl" :src="photoUrl" alt="">
                        <span v-else class="me-initials" :class="avatarTone(editing.id)">{{ nameInitials(form.name || editing.name) }}</span>
                        <span class="me-photo-overlay">
                            <i :class="photoBusy ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-camera'"></i>
                            {{ photoBusy ? 'Uploading…' : (form.image ? 'Change photo' : 'Upload photo') }}
                        </span>
                        <input ref="photoInput" type="file" class="d-none" accept="image/jpeg,image/png,image/webp" tabindex="-1" @click.stop @change="onPhotoPick">
                    </div>
                    <div class="d-flex justify-content-center gap-2 mt-2">
                        <button type="button" class="btn btn-sm btn-light" :disabled="photoBusy" @click="pickPhoto"><i class="fa-solid fa-arrow-up-from-bracket"></i> Upload</button>
                        <button v-if="form.image" type="button" class="btn btn-sm btn-outline-danger" :disabled="photoBusy" @click="form.image = ''; photoUrl = ''"><i class="fa-regular fa-trash-can"></i> Remove</button>
                    </div>
                    <span v-if="errors.image" class="error_message text-center">{{ errors.image }}</span>
                    <p class="form-text text-center mb-0 mt-1">Click or drop a photo. JPG, PNG or WebP, up to 5 MB.</p>

                    <div class="me-identity">
                        <h4>
                            {{ form.name || editing.name }}
                            <i v-if="form.is_verified" class="fa-solid fa-circle-check text-success" title="Number verified"></i>
                        </h4>
                        <p>{{ editing.phone }}</p>
                        <p>Member since {{ dateTime(editing.created_at, false) }}</p>
                    </div>

                    <div class="me-stats">
                        <div><strong>{{ editing.active_products_count }}</strong><span>Live listings</span></div>
                        <div><strong>{{ editing.products_count }}</strong><span>All listings</span></div>
                        <div>
                            <span class="pm-badge" :class="form.status ? 'is-success' : 'is-danger'">{{ form.status ? 'Active' : 'Inactive' }}</span>
                            <span>Account</span>
                        </div>
                    </div>
                </aside>

                <div class="me-main">
                    <section>
                        <h5 class="me-title">Account details</h5>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label" for="m-name">Name <span class="req">*</span></label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fa-regular fa-user"></i></span>
                                    <input id="m-name" v-model="form.name" class="form-control" maxlength="100" placeholder="Full name or shop name" :class="{ 'is-invalid': errors.name }">
                                </div>
                                <span v-if="errors.name" class="error_message">{{ errors.name }}</span>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="m-phone">Mobile number <span class="req">*</span></label>
                                <div class="input-group">
                                    <span class="input-group-text">+88</span>
                                    <input id="m-phone" v-model="form.phone" class="form-control" inputmode="tel" maxlength="20" placeholder="01XXXXXXXXX" :class="{ 'is-invalid': errors.phone }">
                                </div>
                                <span v-if="errors.phone" class="error_message">{{ errors.phone }}</span>
                                <div v-else class="form-text">The member logs in with this number.</div>
                            </div>
                            <div class="col-12">
                                <label class="form-label" for="m-email">Email <span class="text-muted fw-normal">(optional)</span></label>
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fa-regular fa-envelope"></i></span>
                                    <input id="m-email" v-model="form.email" type="email" class="form-control" maxlength="150" placeholder="name@example.com" :class="{ 'is-invalid': errors.email }">
                                </div>
                                <span v-if="errors.email" class="error_message">{{ errors.email }}</span>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h5 class="me-title">Status</h5>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="me-option" :class="{ 'is-on': form.status }" for="m-status">
                                    <span class="me-option-icon is-emerald"><i class="fa-solid fa-user-check"></i></span>
                                    <span class="flex-grow-1">
                                        <strong>Active account</strong>
                                        <small>Inactive members are signed out everywhere and cannot log in.</small>
                                    </span>
                                    <span class="form-check form-switch m-0">
                                        <input id="m-status" class="form-check-input" type="checkbox" v-model="form.status">
                                    </span>
                                </label>
                            </div>
                            <div class="col-md-6">
                                <label class="me-option" :class="{ 'is-on': form.is_verified }" for="m-verified">
                                    <span class="me-option-icon is-sky"><i class="fa-solid fa-circle-check"></i></span>
                                    <span class="flex-grow-1">
                                        <strong>Number verified</strong>
                                        <small>Turn on after confirming this mobile number belongs to them. Shows a “Number verified” badge on their listings.</small>
                                    </span>
                                    <span class="form-check form-switch m-0">
                                        <input id="m-verified" class="form-check-input" type="checkbox" v-model="form.is_verified">
                                    </span>
                                </label>
                            </div>
                        </div>
                    </section>

                    <p class="me-note"><i class="fa-solid fa-circle-info"></i> Changes take effect as soon as you save. The member is not notified.</p>
                </div>
            </div>
        </form-modal>
    </div>
</template>

<script>
import DataTable from "../../components/dataTable";
import FormModal from "../../components/formModal";
import StatCard from "../../components/statCard";

export default {
    name: "memberList",
    components: { DataTable, FormModal, StatCard },
    data() {
        return {
            tableHeading: ['Member', 'Phone', 'Listings', 'Joined', 'Number verified', 'Active', 'Actions'],
            busyId: null,
            editingId: null,
            editing: null,
            form: {},
            photoUrl: '',
            photoBusy: false,
            photoDrag: false,
            errors: {},
        };
    },
    computed: {
        counts() {
            return (this.dataList && this.dataList.counts) || {};
        },
    },
    methods: {
        reload() {
            this.getDataList(this.currentPagination || 1);
        },
        run(member, request) {
            this.busyId = member.id;
            request.then(() => this.reload()).catch(() => {}).finally(() => { this.busyId = null; });
        },
        toggleVerification(member) {
            this.run(member, this.adminRequest('post', `api/v1/admin/members/${member.id}/toggle-verification`));
        },
        toggleStatus(member) {
            if (!member.status) {
                this.run(member, this.adminRequest('post', `api/v1/admin/members/${member.id}/toggle-status`));
                return;
            }
            this.confirmBox((ok) => {
                if (ok) this.run(member, this.adminRequest('post', `api/v1/admin/members/${member.id}/toggle-status`));
            }, `Deactivate ${member.name}?`, 'They will be signed out everywhere and cannot log in until activated again. Their listings stay as they are.');
        },
        edit(member) {
            this.editingId = member.id;
            this.editing = member;
            this.errors = {};
            this.photoUrl = member.image || '';
            this.form = {
                image: member.image_path || '',
                name: member.name,
                phone: member.phone.replace(/^\+88/, ''),
                email: member.email || '',
                status: member.status,
                is_verified: member.is_verified,
            };
            this.openModal('formModal', 'Edit member', false, false);
        },
        pickPhoto() {
            if (!this.photoBusy) this.$refs.photoInput.click();
        },
        onPhotoPick(e) {
            const file = e.target.files && e.target.files[0];
            e.target.value = '';
            if (file) this.uploadPhoto(file);
        },
        onPhotoDrop(e) {
            this.photoDrag = false;
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) this.uploadPhoto(file);
        },
        uploadPhoto(file) {
            this.$delete(this.errors, 'image');
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                this.$set(this.errors, 'image', 'Choose a JPG, PNG or WebP photo.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                this.$set(this.errors, 'image', 'The photo must be 5 MB or smaller.');
                return;
            }
            const data = new FormData();
            data.append('image', file);
            data.append('folder', 'avatars');
            this.photoBusy = true;
            this.axios.post(this.urlGenerate('api/v1/admin/uploads/images'), data)
                .then((res) => {
                    this.form.image = res.data.result.path;
                    this.photoUrl = res.data.result.url;
                })
                .catch((err) => this.$set(this.errors, 'image', this.httpErrorMessage(err, 'The photo could not be uploaded.')))
                .finally(() => { this.photoBusy = false; });
        },
        save() {
            this.errors = {};
            this.$store.commit('httpRequest', true);
            this.adminRequest('put', `api/v1/admin/members/${this.editingId}`, { ...this.form, email: this.form.email || null, image: this.form.image || null })
                .then(() => {
                    this.closeModal('formModal', false);
                    this.reload();
                })
                .catch((err) => {
                    const bag = (err.response && err.response.data && err.response.data.errors) || {};
                    this.errors = Object.fromEntries(Object.entries(bag).map(([k, v]) => [k, v[0]]));
                })
                .finally(() => this.$store.commit('httpRequest', false));
        },
        remove(member) {
            const listings = member.products_count ? ` and their ${member.products_count} listing(s)` : '';
            this.confirmBox((ok) => {
                if (ok) this.run(member, this.adminRequest('delete', `api/v1/admin/members/${member.id}`));
            }, `Delete ${member.name}?`, `This permanently removes the account${listings}, messages and saved items. It cannot be undone. To keep the history, deactivate the member instead.`);
        },
    },
    mounted() {
        ['is_verified', 'status'].forEach((k) => this.$set(this.formFilter, k, ''));
        this.getDataList(1);
    },
}
</script>

<style scoped>
.me-grid { display: grid; grid-template-columns: 260px 1fr; gap: 28px; }
.me-side {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 20px;
    border-radius: 16px;
    background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
    border: 1px solid var(--pm-border);
    align-self: start;
}
.me-photo {
    position: relative;
    width: 128px;
    height: 128px;
    margin: 0 auto;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 0 0 4px #fff, 0 0 0 5px var(--pm-border), 0 10px 24px -12px rgba(9, 9, 11, 0.35);
    transition: box-shadow 0.15s;
}
.me-photo:focus-visible, .me-photo.is-drag { outline: none; box-shadow: 0 0 0 4px #fff, 0 0 0 6px var(--pm-brand); }
.me-photo.is-busy { cursor: progress; }
.me-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.me-initials {
    width: 100%; height: 100%; display: grid; place-items: center;
    font-size: 40px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, var(--pm-brand), var(--pm-c-teal));
}
.me-initials.tone-1 { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.me-initials.tone-2 { background: linear-gradient(135deg, #0ea5e9, #6366f1); }
.me-initials.tone-3 { background: linear-gradient(135deg, #f59e0b, #f97316); }
.me-initials.tone-4 { background: linear-gradient(135deg, #ec4899, #f43f5e); }
.me-initials.tone-5 { background: linear-gradient(135deg, #14b8a6, #0ea5e9); }
.me-photo-overlay {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    background: rgba(9, 9, 11, 0.55); color: #fff; font-size: 12.5px; font-weight: 600;
    opacity: 0; transition: opacity 0.15s;
}
.me-photo-overlay i { font-size: 18px; }
.me-photo:hover .me-photo-overlay, .me-photo:focus-visible .me-photo-overlay,
.me-photo.is-drag .me-photo-overlay, .me-photo.is-busy .me-photo-overlay { opacity: 1; }
.me-identity { text-align: center; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--pm-border); }
.me-identity h4 { font-size: 16px; margin: 0 0 4px; word-break: break-word; }
.me-identity p { margin: 0; font-size: 12.5px; color: var(--pm-muted); }
.me-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 16px; }
.me-stats > div {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 10px 4px; border-radius: 10px; background: #fff; border: 1px solid var(--pm-border);
    text-align: center;
}
.me-stats strong { font-size: 18px; color: var(--pm-text); line-height: 1; }
.me-stats span:last-child { font-size: 11px; color: var(--pm-muted); }
.me-stats .pm-badge { font-size: 11px; padding: 2px 8px; }
.me-main { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
.me-title {
    font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--pm-muted); margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid var(--pm-border);
}
.me-option {
    display: flex; align-items: flex-start; gap: 12px; height: 100%;
    padding: 14px; border-radius: 12px; border: 1px solid var(--pm-border); background: #fff;
    cursor: pointer; margin: 0; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.me-option:hover { border-color: #d4d4d8; }
.me-option.is-on { border-color: rgba(var(--pm-brand-rgb), 0.45); background: var(--pm-brand-50); box-shadow: 0 0 0 3px rgba(var(--pm-brand-rgb), 0.08); }
.me-option strong { display: block; font-size: 13.5px; color: var(--pm-text); }
.me-option small { display: block; font-size: 12px; color: var(--pm-muted); line-height: 1.45; margin-top: 2px; }
.me-option-icon { width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; flex-shrink: 0; font-size: 14px; }
.me-option-icon.is-emerald { color: var(--pm-brand-600); background: var(--pm-brand-50); }
.me-option-icon.is-sky { color: #0369a1; background: #f0f9ff; }
.me-note { margin: 0; font-size: 12.5px; color: var(--pm-muted); }
.me-note i { color: var(--pm-c-sky); margin-right: 4px; }
.input-group-text { background: #fafafa; border-color: #d5dde8; color: var(--pm-muted); font-size: 13px; }
@media (max-width: 991.98px) {
    .me-grid { grid-template-columns: 1fr; gap: 20px; }
}
</style>
