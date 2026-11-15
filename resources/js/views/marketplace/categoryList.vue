<template>
    <div>
        <div class="pm-page-head">
            <div>
                <h2>Categories</h2>
                <p>Two levels (e.g. Pets › Cats). Each category can have its own listing fields such as breed or age.</p>
            </div>
            <div class="pm-page-actions">
                <button type="button" class="btn btn-primary" @click="create()">
                    <i class="fa-solid fa-plus"></i> Add category
                </button>
            </div>
        </div>

        <data-table :table-heading="tableHeading" search-placeholder="Search categories…" empty-icon="fa-solid fa-layer-group" empty-title="No categories" empty-text="Add your first category to start accepting listings.">
            <template v-slot:data>
                <tr v-for="cat in (dataList.data || [])" :key="cat.id" :class="{ 'opacity-75': !cat.status }">
                    <td>
                        <div class="d-flex align-items-center gap-12" :style="{ paddingLeft: cat.depth ? '28px' : '0' }">
                            <i v-if="cat.depth" class="fa-solid fa-turn-up fa-rotate-90 text-muted" style="font-size: 11px"></i>
                            <img v-if="cat.image_url" :src="cat.image_url" class="pm-thumb" style="width: 40px; height: 40px" alt="">
                            <span v-else class="pm-thumb" style="width: 40px; height: 40px"><i :class="iconClass(cat.icon)"></i></span>
                            <div class="min-w-0">
                                <span class="pm-cell-title" :class="{ 'fw-bold': !cat.depth }">{{ cat.name }}</span>
                                <span class="pm-cell-sub">/{{ cat.slug }}</span>
                            </div>
                        </div>
                    </td>
                    <td>{{ cat.parent_name || '—' }}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-light" @click="openFields(cat)">
                            <i class="fa-solid fa-list-check"></i> {{ cat.attributes.length }} field{{ cat.attributes.length === 1 ? '' : 's' }}
                        </button>
                    </td>
                    <td>{{ cat.products_count }}</td>
                    <td>{{ cat.sort_order }}</td>
                    <td>
                        <div class="form-check form-switch m-0" :title="cat.status ? 'Shown on the site' : 'Hidden from the site'">
                            <input class="form-check-input" type="checkbox" role="switch" :checked="cat.status" :aria-label="`Show ${cat.name} on the site`" @change="toggleStatus(cat)">
                        </div>
                    </td>
                    <td>
                        <div class="pm-actions">
                            <button type="button" class="btn btn-sm btn-light btn-icon" title="Edit" @click="edit(cat)"><i class="fa-regular fa-pen-to-square"></i></button>
                            <button type="button" class="btn btn-sm btn-outline-danger btn-icon" title="Delete" @click="remove(cat)"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            </template>
        </data-table>

        <form-modal modal-size="modal-lg" :title="formType === 2 ? 'Edit category' : 'Add category'" @submit="submitForm(formObject, 'formModal')">
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label" for="cat-name">Name <span class="req">*</span></label>
                    <input id="cat-name" v-validate="'required|max:100'" name="name" type="text" v-model="formObject.name" class="form-control" placeholder="e.g. Cats & Kittens">
                </div>
                <div class="col-md-6">
                    <label class="form-label" for="cat-parent">Parent</label>
                    <select id="cat-parent" name="parent_id" v-model="formObject.parent_id" class="form-select">
                        <option :value="null">None (top level)</option>
                        <option v-for="p in parentOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label" for="cat-slug">URL slug</label>
                    <input id="cat-slug" name="slug" type="text" v-model="formObject.slug" class="form-control" placeholder="Created from the name">
                    <div class="form-text">Lowercase letters, numbers and dashes. Changing it breaks old links.</div>
                </div>
                <div class="col-md-3">
                    <label class="form-label" for="cat-icon">Icon</label>
                    <input id="cat-icon" name="icon" type="text" v-model="formObject.icon" class="form-control" placeholder="e.g. cat, dog, fish">
                </div>
                <div class="col-md-3">
                    <label class="form-label" for="cat-order">Order</label>
                    <input id="cat-order" name="sort_order" type="number" min="0" v-model.number="formObject.sort_order" class="form-control" placeholder="0">
                </div>
                <div class="col-12">
                    <label class="form-label" for="cat-desc">Description</label>
                    <textarea id="cat-desc" name="description" v-model="formObject.description" class="form-control" rows="2" maxlength="1000" placeholder="Short text shown on the category page, e.g. Kittens and adult cats for sale or adoption."></textarea>
                </div>
                <div class="col-12">
                    <label class="form-label">Image</label>
                    <image-upload v-model="formObject.image" folder="categories"></image-upload>
                </div>
                <div class="col-12">
                    <div class="form-check form-switch">
                        <input id="cat-status" class="form-check-input" type="checkbox" v-model="formObject.status">
                        <label class="form-check-label" for="cat-status">Show on the site</label>
                    </div>
                </div>
            </div>
        </form-modal>

        <general-modal modal-id="fieldsModal" modal-size="modal-lg" :is-enable-footer="true">
            <template v-slot:title>Listing fields · {{ fieldsCategory ? fieldsCategory.name : '' }}</template>
            <template v-slot:body>
                <p class="text-muted">
                    Sellers fill these in when they post in this category. Sub-categories without their own fields use their parent's.
                </p>
                <div class="table-responsive mb-3" v-if="fieldsCategory && fieldsCategory.attributes.length">
                    <table class="table pm-table align-middle mb-0">
                        <thead><tr><th>Field</th><th>Type</th><th>Required</th><th class="text-end">Actions</th></tr></thead>
                        <tbody>
                            <tr v-for="a in fieldsCategory.attributes" :key="a.id">
                                <td>
                                    <span class="fw-600 text-dark">{{ a.name }}</span>
                                    <div class="pm-cell-sub">{{ a.attribute_key }}<template v-if="a.options && a.options.length"> · {{ a.options.join(', ') | truncate(60) }}</template></div>
                                </td>
                                <td><span class="pm-badge no-dot is-info">{{ typeLabels[a.type] || a.type }}</span></td>
                                <td>{{ a.is_required ? 'Yes' : 'No' }}</td>
                                <td>
                                    <div class="pm-actions">
                                        <button type="button" class="btn btn-sm btn-light btn-icon" title="Edit" @click="editField(a)"><i class="fa-regular fa-pen-to-square"></i></button>
                                        <button type="button" class="btn btn-sm btn-outline-danger btn-icon" title="Remove" @click="removeField(a)"><i class="fa-regular fa-trash-can"></i></button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="pm-empty py-3"><p>No fields yet.</p></div>

                <div class="pm-card mb-0">
                    <div class="pm-card-head py-2"><h3 style="font-size: 14px">{{ field.id ? 'Edit field' : 'Add a field' }}</h3></div>
                    <form class="pm-card-body row g-3" @submit.prevent="saveField" novalidate>
                        <div class="col-md-6">
                            <label class="form-label" for="f-name">Label <span class="req">*</span></label>
                            <input id="f-name" v-model="field.name" class="form-control" placeholder="e.g. Vaccinated" maxlength="100">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label" for="f-key">Key</label>
                            <input id="f-key" v-model="field.attribute_key" class="form-control" placeholder="Created from the label" maxlength="80" :disabled="!!field.id">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label" for="f-type">Input type</label>
                            <select id="f-type" v-model="field.type" class="form-select">
                                <option v-for="(label, value) in typeLabels" :key="value" :value="value">{{ label }}</option>
                            </select>
                        </div>
                        <div class="col-md-6 d-flex align-items-end">
                            <div class="form-check form-switch mb-2">
                                <input id="f-req" class="form-check-input" type="checkbox" v-model="field.is_required">
                                <label class="form-check-label" for="f-req">Required</label>
                            </div>
                        </div>
                        <div class="col-12" v-if="field.type === 'text' || field.type === 'number'">
                            <label class="form-label" for="f-ph">Placeholder</label>
                            <input id="f-ph" v-model="field.placeholder" class="form-control" placeholder="e.g. Golden Retriever, Persian, Local" maxlength="150">
                            <div class="form-text">Hint shown inside the empty box on the Post a listing form.</div>
                        </div>
                        <div class="col-12" v-if="field.type === 'select'">
                            <label class="form-label" for="f-opts">Choices <span class="req">*</span></label>
                            <input id="f-opts" v-model="field.optionsText" class="form-control" placeholder="Fully vaccinated, Partly vaccinated, Not vaccinated">
                            <div class="form-text">Separate choices with commas.</div>
                        </div>
                        <div class="col-12 d-flex gap-2 justify-content-end">
                            <button v-if="field.id" type="button" class="btn btn-light" @click="resetField">Cancel edit</button>
                            <button type="submit" class="btn btn-primary" :disabled="savingField">
                                <i :class="savingField ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-check'"></i> {{ field.id ? 'Save field' : 'Add field' }}
                            </button>
                        </div>
                    </form>
                </div>
            </template>
        </general-modal>
    </div>
</template>

<script>
import DataTable from "../../components/dataTable";
import FormModal from "../../components/formModal";
import GeneralModal from "../../components/generalModal";
import ImageUpload from "../../components/imageUpload";

const EMPTY_FIELD = () => ({ id: null, name: '', placeholder: '', attribute_key: '', type: 'text', is_required: false, optionsText: '' });

export default {
    name: "categoryList",
    components: { DataTable, FormModal, GeneralModal, ImageUpload },
    data() {
        return {
            tableHeading: ['Category', 'Parent', 'Listing fields', 'Listings', 'Order', 'Visible', 'Actions'],
            typeLabels: { text: 'Text', number: 'Number', select: 'Dropdown', boolean: 'Yes / No' },
            fieldsCategoryId: null,
            field: EMPTY_FIELD(),
            savingField: false,
        };
    },
    computed: {
        parentOptions() {
            const parents = (this.dataList && this.dataList.parents) || [];
            return parents.filter((p) => p.id !== this.updateId);
        },
        fieldsCategory() {
            return ((this.dataList && this.dataList.data) || []).find((c) => c.id === this.fieldsCategoryId) || null;
        },
    },
    methods: {
        iconClass(icon) {
            return icon ? `fa-solid fa-${icon}` : 'fa-solid fa-paw';
        },
        create() {
            this.$store.commit('formType', 1);
            this.$store.commit('updateId', '');
            this.$store.commit('formObject', { name: '', parent_id: null, slug: '', icon: '', description: '', image: '', sort_order: 0, status: true });
            this.openModal('formModal', 'Add category');
        },
        edit(cat) {
            this.editData({
                name: cat.name, parent_id: cat.parent_id, slug: cat.slug, icon: cat.icon || '', description: cat.description || '',
                image: cat.image || '', sort_order: cat.sort_order, status: cat.status,
            }, cat.id);
        },
        toggleStatus(cat) {
            this.adminRequest('put', `api/v1/admin/categories/${cat.id}`, {
                name: cat.name, parent_id: cat.parent_id, icon: cat.icon, description: cat.description,
                image: cat.image, sort_order: cat.sort_order, status: !cat.status,
            }).then(() => this.getDataList()).catch(() => this.getDataList());
        },
        remove(cat) {
            this.confirmBox((ok) => {
                if (!ok) return;
                this.adminRequest('delete', `api/v1/admin/categories/${cat.id}`).then(() => this.getDataList()).catch(() => {});
            }, `Delete “${cat.name}”?`, 'Only empty categories can be deleted. To keep old listings, switch the category off instead.');
        },

        openFields(cat) {
            this.fieldsCategoryId = cat.id;
            this.resetField();
            this.openModal('fieldsModal', 'Listing fields', false, false);
        },
        resetField() {
            this.field = EMPTY_FIELD();
        },
        editField(a) {
            this.field = { id: a.id, name: a.name, placeholder: a.placeholder || '', attribute_key: a.attribute_key, type: a.type, is_required: a.is_required, optionsText: (a.options || []).join(', ') };
        },
        saveField() {
            if (!this.field.name.trim()) {
                this.$toastr('error', 'Give the field a label.', 'Label needed');
                return;
            }
            const options = this.field.optionsText.split(',').map((s) => s.trim()).filter(Boolean);
            if (this.field.type === 'select' && !options.length) {
                this.$toastr('error', 'Add at least one choice for a dropdown.', 'Choices needed');
                return;
            }
            const payload = {
                name: this.field.name.trim(),
                placeholder: ['text', 'number'].includes(this.field.type) ? (this.field.placeholder || '').trim() || null : null,
                attribute_key: this.field.attribute_key || this.field.name,
                type: this.field.type,
                is_required: this.field.is_required,
                options: this.field.type === 'select' ? options : null,
            };
            const req = this.field.id
                ? this.adminRequest('put', `api/v1/admin/attributes/${this.field.id}`, payload)
                : this.adminRequest('post', `api/v1/admin/categories/${this.fieldsCategoryId}/attributes`, payload);
            this.savingField = true;
            req.then(() => {
                this.resetField();
                this.getDataList();
            }).catch(() => {}).finally(() => { this.savingField = false; });
        },
        removeField(a) {
            this.confirmBox((ok) => {
                if (!ok) return;
                this.adminRequest('delete', `api/v1/admin/attributes/${a.id}`).then(() => this.getDataList()).catch(() => {});
            }, `Remove “${a.name}”?`, 'Existing listings keep the values they already have.');
        },
    },
    mounted() {
        this.getDataList();
    },
}
</script>
