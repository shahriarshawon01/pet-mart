<template>
    <div>
        <div class="pm-page-head">
            <div>
                <h2>My profile</h2>
                <p>Your admin account details and password.</p>
            </div>
        </div>

        <div class="row">
            <div class="col-lg-4">
                <div class="pm-card">
                    <div class="pm-card-body text-center py-4">
                        <img v-if="imageUrl" :src="imageUrl" class="pm-avatar is-lg mx-auto mb-3" style="width: 72px; height: 72px; border-radius: 18px" alt="">
                        <span v-else class="pm-avatar is-lg mx-auto mb-3" style="width: 72px; height: 72px; font-size: 24px; border-radius: 18px">{{ nameInitials(form.name) }}</span>
                        <h3 class="mb-1" style="font-size: 17px">{{ form.name || 'Admin' }}</h3>
                        <p class="text-muted mb-2">{{ form.email }}</p>
                        <span class="pm-badge is-violet">Administrator</span>
                        <dl class="pm-dl text-start mt-4 mb-0">
                            <dt>Phone</dt><dd>{{ phone || '—' }}</dd>
                        </dl>
                    </div>
                </div>
            </div>

            <div class="col-lg-8">
                <form class="pm-card" @submit.prevent="save" novalidate>
                    <div class="pm-card-head"><h3>Account details</h3></div>
                    <div class="pm-card-body row g-3">
                        <div class="col-12">
                            <label class="form-label">Profile photo <span class="text-muted fw-normal">(optional)</span></label>
                            <image-upload v-model="form.image" folder="avatars" avatar hint="Shown in the top bar and the Users list."></image-upload>
                            <span v-if="errors.image" class="error_message">{{ errors.image }}</span>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label" for="p-name">Name <span class="req">*</span></label>
                            <input id="p-name" v-model="form.name" class="form-control" placeholder="Your full name" maxlength="100" autocomplete="name" :class="{ 'is-invalid': errors.name }">
                            <span v-if="errors.name" class="error_message">{{ errors.name }}</span>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label" for="p-email">Email <span class="req">*</span></label>
                            <input id="p-email" v-model="form.email" type="email" class="form-control" placeholder="name@example.com" maxlength="150" autocomplete="email" :class="{ 'is-invalid': errors.email }">
                            <span v-if="errors.email" class="error_message">{{ errors.email }}</span>
                            <div class="form-text">You use this email to log in to the admin panel.</div>
                        </div>
                    </div>

                    <div class="pm-card-head border-top"><div><h3>Change password</h3><p>Leave blank to keep your current password.</p></div></div>
                    <div class="pm-card-body row g-3">
                        <div class="col-md-4">
                            <label class="form-label" for="p-current">Current password</label>
                            <input id="p-current" v-model="form.current_password" type="password" class="form-control" placeholder="Enter your current password" autocomplete="current-password" :class="{ 'is-invalid': errors.current_password }">
                            <span v-if="errors.current_password" class="error_message">{{ errors.current_password }}</span>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label" for="p-new">New password</label>
                            <input id="p-new" v-model="form.password" type="password" class="form-control" placeholder="At least 8 characters" autocomplete="new-password" :class="{ 'is-invalid': errors.password }">
                            <span v-if="errors.password" class="error_message">{{ errors.password }}</span>
                            <div class="form-text">At least 8 characters.</div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label" for="p-confirm">Confirm new password</label>
                            <input id="p-confirm" v-model="form.password_confirmation" type="password" class="form-control" placeholder="Re-enter the new password" autocomplete="new-password">
                        </div>
                    </div>

                    <div class="pm-table-foot justify-content-end">
                        <button type="submit" class="btn btn-primary" :disabled="saving">
                            <i :class="saving ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-check'"></i> Save changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
import ImageUpload from "../../components/imageUpload";

export default {
    name: "profile",
    components: { ImageUpload },
    data() {
        return {
            form: { image: '', name: '', email: '', current_password: '', password: '', password_confirmation: '' },
            imageUrl: '',
            phone: '',
            errors: {},
            saving: false,
        };
    },
    methods: {
        load() {
            this.adminRequest('get', 'api/profile', {}, { silent: true }).then((u) => {
                this.form.image = u.image || '';
                this.imageUrl = u.image_url || '';
                this.form.name = u.name;
                this.form.email = u.email;
                this.phone = u.phone;
            }).catch(() => {});
        },
        validate() {
            const e = {};
            if (!this.form.name.trim()) e.name = 'Name is required.';
            if (!/^\S+@\S+\.\S+$/.test(this.form.email)) e.email = 'Enter a valid email address.';
            if (this.form.password) {
                if (!this.form.current_password) e.current_password = 'Enter your current password.';
                if (this.form.password.length < 8) e.password = 'Use at least 8 characters.';
                else if (this.form.password !== this.form.password_confirmation) e.password = 'The new passwords do not match.';
            }
            this.errors = e;
            return !Object.keys(e).length;
        },
        save() {
            if (!this.validate()) return;
            this.saving = true;
            const payload = { name: this.form.name.trim(), email: this.form.email.trim(), image: this.form.image || null };
            if (this.form.password) {
                Object.assign(payload, {
                    current_password: this.form.current_password,
                    password: this.form.password,
                    password_confirmation: this.form.password_confirmation,
                });
            }
            this.adminRequest('post', 'api/profile', payload)
                .then((u) => {
                    this.imageUrl = (u && u.image_url) || '';
                    this.form.current_password = this.form.password = this.form.password_confirmation = '';
                    this.getConfigurations();
                })
                .catch((err) => {
                    const data = err.response && err.response.data;
                    const bag = (data && (data.errors || data.result)) || {};
                    this.errors = Object.fromEntries(Object.entries(bag).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
                })
                .finally(() => { this.saving = false; });
        },
    },
    mounted() {
        this.load();
    },
}
</script>
