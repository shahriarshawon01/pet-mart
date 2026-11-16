<template>
    <div>
        <div class="pm-page-head">
            <div>
                <h2>Banners</h2>
                <p>Promotional pictures on the customer website. Home – top shows under the homepage banner, Home – middle above “How PetMart works”, Browse – top above the search results. Several banners in one position rotate as a slider.</p>
            </div>
            <div class="pm-page-actions">
                <button type="button" class="btn btn-primary" @click="create()"><i class="fa-solid fa-plus"></i> Add banner</button>
            </div>
        </div>

        <data-table :table-heading="tableHeading" :default-filter="false" :show-toolbar="false" empty-icon="fa-regular fa-image" empty-title="No banners yet" empty-text="Add a banner to promote a category, offer or announcement.">
            <template v-slot:data>
                <tr v-for="b in (dataList.data || [])" :key="b.id">
                    <td>
                        <div class="d-flex align-items-center gap-12">
                            <img v-if="b.image_url" :src="b.image_url" class="pm-thumb is-wide" alt="" loading="lazy">
                            <div class="min-w-0">
                                <span class="pm-cell-title">{{ b.title }}</span>
                                <span class="pm-cell-sub">{{ b.link || 'No link' }}</span>
                            </div>
                        </div>
                    </td>
                    <td><span class="pm-badge no-dot is-neutral">{{ positions[b.position] || b.position }}</span></td>
                    <td class="text-nowrap">
                        <span v-if="!b.starts_at && !b.ends_at" class="text-muted">Always</span>
                        <span v-else>{{ b.starts_at ? dateTime(b.starts_at, false) : 'Now' }} → {{ b.ends_at ? dateTime(b.ends_at, false) : 'No end' }}</span>
                    </td>
                    <td>{{ b.sort_order }}</td>
                    <td>
                        <span class="pm-badge" :class="b.is_running ? 'is-success' : (b.status ? 'is-warning' : 'is-neutral')">
                            {{ b.is_running ? 'Running' : (b.status ? 'Scheduled' : 'Off') }}
                        </span>
                    </td>
                    <td>
                        <div class="pm-actions">
                            <button type="button" class="btn btn-sm btn-light btn-icon" title="Edit" @click="edit(b)"><i class="fa-regular fa-pen-to-square"></i></button>
                            <button type="button" class="btn btn-sm btn-outline-danger btn-icon" title="Delete" @click="deleteInformation(null, b.id)"><i class="fa-regular fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            </template>
        </data-table>

        <form-modal modal-size="modal-lg" :title="formType === 2 ? 'Edit banner' : 'Add banner'" @submit="submitForm(formObject, 'formModal')">
            <div class="row g-3">
                <div class="col-12">
                    <label class="form-label" for="b-title">Title <span class="req">*</span></label>
                    <input id="b-title" v-validate="'required|max:255'" name="title" v-model="formObject.title" class="form-control" placeholder="e.g. Winter pet care – 20% off supplies">
                </div>
                <div class="col-12">
                    <label class="form-label">Image <span class="req">*</span></label>
                    <image-upload v-model="formObject.image" folder="banners" hint="Wide image, e.g. 1600 × 500 px. JPG, PNG or WebP up to 5 MB."></image-upload>
                </div>
                <div class="col-md-8">
                    <label class="form-label" for="b-link">Link</label>
                    <input id="b-link" name="link" v-model="formObject.link" class="form-control" placeholder="/browse?category_slug=cats or https://…">
                </div>
                <div class="col-md-4">
                    <label class="form-label" for="b-pos">Position</label>
                    <select id="b-pos" name="position" v-model="formObject.position" class="form-select">
                        <option v-for="(label, value) in positions" :key="value" :value="value">{{ label }}</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label" for="b-start">Starts</label>
                    <input id="b-start" name="starts_at" type="date" v-model="formObject.starts_at" class="form-control">
                </div>
                <div class="col-md-4">
                    <label class="form-label" for="b-end">Ends</label>
                    <input id="b-end" name="ends_at" type="date" v-model="formObject.ends_at" class="form-control">
                </div>
                <div class="col-md-4">
                    <label class="form-label" for="b-order">Order</label>
                    <input id="b-order" name="sort_order" type="number" min="0" v-model.number="formObject.sort_order" class="form-control" placeholder="0">
                </div>
                <div class="col-12">
                    <div class="form-check form-switch">
                        <input id="b-status" class="form-check-input" type="checkbox" v-model="formObject.status">
                        <label class="form-check-label" for="b-status">Active</label>
                    </div>
                </div>
            </div>
        </form-modal>
    </div>
</template>

<script>
import DataTable from "../../components/dataTable";
import FormModal from "../../components/formModal";
import ImageUpload from "../../components/imageUpload";

export default {
    name: "bannerList",
    components: { DataTable, FormModal, ImageUpload },
    data() {
        return {
            tableHeading: ['Banner', 'Position', 'Schedule', 'Order', 'Status', 'Actions'],
            positions: { home_top: 'Home – top', home_middle: 'Home – middle', browse_top: 'Browse – top' },
        };
    },
    methods: {
        create() {
            this.$store.commit('formType', 1);
            this.$store.commit('updateId', '');
            this.$store.commit('formObject', { title: '', image: '', link: '', position: 'home_top', starts_at: '', ends_at: '', sort_order: 0, status: true });
            this.openModal('formModal', 'Add banner');
        },
        edit(b) {
            this.editData({
                title: b.title, image: b.image, link: b.link || '', position: b.position,
                starts_at: b.starts_at || '', ends_at: b.ends_at || '', sort_order: b.sort_order, status: b.status,
            }, b.id);
        },
    },
    mounted() {
        this.getDataList();
    },
}
</script>
