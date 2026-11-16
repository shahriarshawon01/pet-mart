<template>
    <div>
        <div class="pm-page-head">
            <div>
                <h2>{{ greeting }}, {{ firstName }}</h2>
                <p>Here is what is happening on PetMart today.</p>
            </div>
            <div class="pm-page-actions">
                <button
                    type="button"
                    class="btn btn-light"
                    @click="load"
                    :disabled="loading"
                >
                    <i
                        class="fa-solid fa-rotate"
                        :class="{ 'fa-spin': loading }"
                    ></i>
                    Refresh
                </button>
                <router-link
                    to="/admin/marketplace/moderation"
                    class="btn btn-primary"
                >
                    <i class="fa-solid fa-clipboard-check"></i> Review listings
                    <span
                        v-if="cards.pending_approvals"
                        class="badge bg-white text-success ms-1"
                        >{{ cards.pending_approvals }}</span
                    >
                </router-link>
            </div>
        </div>

        <div class="row">
            <div
                class="col-sm-6 col-xl-3"
                v-for="card in statCards"
                :key="card.label"
            >
                <stat-card v-bind="card"></stat-card>
            </div>
        </div>

        <div class="row">
            <div class="col-xl-8">
                <div class="pm-card">
                    <div class="pm-card-head">
                        <div>
                            <h3>Activity</h3>
                            <p>New listings and new members, last 14 days</p>
                        </div>
                    </div>
                    <div class="pm-card-body pt-2">
                        <apexchart
                            v-if="ready"
                            type="area"
                            height="300"
                            :options="trendOptions"
                            :series="trendSeries"
                        ></apexchart>
                        <div v-else class="placeholder-glow">
                            <span
                                class="placeholder col-12 rounded"
                                style="height: 300px"
                            ></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-4">
                <div class="pm-card">
                    <div class="pm-card-head">
                        <div>
                            <h3>Listings by status</h3>
                            <p>
                                {{ cards.total_listings || 0 }} listings in
                                total
                            </p>
                        </div>
                    </div>
                    <div class="pm-card-body pt-2">
                        <apexchart
                            v-if="ready && statusTotal"
                            type="donut"
                            height="300"
                            :options="statusOptions"
                            :series="statusSeries"
                        ></apexchart>
                        <div v-else-if="ready" class="pm-empty">
                            <p>No listings yet.</p>
                        </div>
                        <div v-else class="placeholder-glow">
                            <span
                                class="placeholder col-12 rounded"
                                style="height: 300px"
                            ></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-xl-5">
                <div class="pm-card">
                    <div class="pm-card-head">
                        <div>
                            <h3>Waiting for review</h3>
                            <p>Oldest first</p>
                        </div>
                        <router-link
                            to="/admin/marketplace/moderation"
                            class="btn btn-sm btn-light"
                            >Open queue</router-link
                        >
                    </div>
                    <ul
                        class="pm-list"
                        v-if="(stats.pending_queue || []).length"
                    >
                        <li v-for="item in stats.pending_queue" :key="item.id">
                            <img
                                v-if="item.image"
                                :src="item.image"
                                class="pm-thumb"
                                alt=""
                                loading="lazy"
                            />
                            <span v-else class="pm-thumb"
                                ><i class="fa-regular fa-image"></i
                            ></span>
                            <div class="min-w-0 flex-grow-1">
                                <span class="pm-cell-title">{{
                                    item.title
                                }}</span>
                                <span class="pm-cell-sub"
                                    >{{ item.seller }} · {{ item.category }} ·
                                    {{ timeAgo(item.created_at) }}</span
                                >
                            </div>
                            <span class="fw-600 text-nowrap">{{
                                money(item.price, item.is_free)
                            }}</span>
                        </li>
                    </ul>
                    <div v-else class="pm-empty">
                        <div class="pm-empty-icon">
                            <i class="fa-solid fa-check"></i>
                        </div>
                        <h4>All caught up</h4>
                        <p>No listings are waiting for review.</p>
                    </div>
                </div>

                <div class="pm-card">
                    <div class="pm-card-head">
                        <h3>Listings per category</h3>
                    </div>
                    <div class="pm-card-body">
                        <div
                            v-for="(name, i) in stats.category_chart
                                ? stats.category_chart.labels
                                : []"
                            :key="name"
                            class="mb-3"
                        >
                            <div
                                class="d-flex justify-content-between mb-1"
                                style="font-size: 13px"
                            >
                                <span class="fw-600 text-dark">{{ name }}</span>
                                <span class="text-muted">{{
                                    stats.category_chart.series[i]
                                }}</span>
                            </div>
                            <div class="pm-progress">
                                <span
                                    :style="{
                                        width: categoryPercent(i) + '%',
                                        background: palette[i % palette.length],
                                    }"
                                ></span>
                            </div>
                        </div>
                        <p
                            v-if="
                                stats.category_chart &&
                                !stats.category_chart.labels.length
                            "
                            class="text-muted mb-0"
                        >
                            No categories yet.
                        </p>
                    </div>
                </div>
            </div>

            <div class="col-xl-7">
                <div class="pm-card">
                    <div class="pm-card-head">
                        <div>
                            <h3>Latest listings</h3>
                            <p>Most recently submitted</p>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table pm-table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Listing</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    <th class="text-end">Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="item in stats.recent_listings || []"
                                    :key="item.id"
                                >
                                    <td>
                                        <div
                                            class="d-flex align-items-center gap-12"
                                        >
                                            <img
                                                v-if="item.image"
                                                :src="item.image"
                                                class="pm-thumb"
                                                alt=""
                                                loading="lazy"
                                            />
                                            <span v-else class="pm-thumb"
                                                ><i
                                                    class="fa-regular fa-image"
                                                ></i
                                            ></span>
                                            <div class="min-w-0">
                                                <span
                                                    class="pm-cell-title"
                                                    style="max-width: 260px"
                                                    >{{ item.title }}</span
                                                >
                                                <span class="pm-cell-sub"
                                                    >{{ item.seller }} ·
                                                    {{ item.category }}</span
                                                >
                                            </div>
                                        </div>
                                    </td>
                                    <td class="fw-600 text-nowrap">
                                        {{ money(item.price, item.is_free) }}
                                    </td>
                                    <td>
                                        <span
                                            class="pm-badge"
                                            :class="statusTone(item.status)"
                                            >{{
                                                statusLabel(item.status)
                                            }}</span
                                        >
                                    </td>
                                    <td class="text-end text-muted text-nowrap">
                                        {{ timeAgo(item.created_at) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div
                            v-if="
                                ready && !(stats.recent_listings || []).length
                            "
                            class="pm-empty"
                        >
                            <p>No listings yet.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import StatCard from "../components/statCard";

const PALETTE = [
    "#e70c2a",
    "#18181b",
    "#f59e0b",
    "#0ea5e9",
    "#8b5cf6",
    "#71717a",
    "#ec4899",
    "#14b8a6",
];

export default {
    name: "dashboardPage",
    components: { StatCard },
    data() {
        return { stats: {}, loading: false, ready: false, palette: PALETTE };
    },
    computed: {
        cards() {
            return this.stats.cards || {};
        },
        firstName() {
            const name =
                (this.Config && this.Config.user && this.Config.user.name) ||
                "there";
            return name.split(" ")[0];
        },
        greeting() {
            const h = new Date().getHours();
            return h < 12
                ? "Good morning"
                : h < 17
                ? "Good afternoon"
                : "Good evening";
        },
        statCards() {
            const c = this.cards;
            return [
                {
                    label: "Pending review",
                    value: c.pending_approvals || 0,
                    icon: "fa-solid fa-hourglass-half",
                    color: "var(--pm-c-amber)",
                    hint: "Listings waiting for a moderator",
                    to: "/admin/marketplace/moderation",
                },
                {
                    label: "Approved listings",
                    value: c.active_listings || 0,
                    icon: "fa-solid fa-circle-check",
                    color: "var(--pm-c-emerald)",
                    hint: `${c.sold_listings || 0} sold so far`,
                },
                {
                    label: "Members",
                    value: c.total_users || 0,
                    icon: "fa-solid fa-users",
                    color: "var(--pm-c-violet)",
                    hint: `+${c.new_users_week || 0} this week · ${
                        c.verified_sellers || 0
                    } verified`,
                    to: "/admin/marketplace/members",
                },
                {
                    label: "Needs attention",
                    value: (c.pending_reports || 0) + (c.new_messages || 0),
                    icon: "fa-solid fa-flag",
                    color: "var(--pm-c-rose)",
                    hint: `${c.pending_reports || 0} reports · ${
                        c.new_messages || 0
                    } messages`,
                    to: "/admin/marketplace/reports",
                },
            ];
        },
        trendSeries() {
            const t = this.stats.trend_chart || { listings: [], users: [] };
            return [
                { name: "New listings", data: t.listings },
                { name: "New members", data: t.users },
            ];
        },
        trendOptions() {
            const t = this.stats.trend_chart || { labels: [] };
            return {
                chart: {
                    toolbar: { show: false },
                    fontFamily: "Inter, sans-serif",
                    zoom: { enabled: false },
                },
                colors: ["#e70c2a", "#18181b"],
                dataLabels: { enabled: false },
                stroke: { curve: "smooth", width: 2.5 },
                fill: {
                    type: "gradient",
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.28,
                        opacityTo: 0.02,
                        stops: [0, 95],
                    },
                },
                grid: {
                    borderColor: "#eef2f6",
                    strokeDashArray: 4,
                    padding: { left: 8, right: 8 },
                },
                xaxis: {
                    categories: t.labels,
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                    labels: { style: { colors: "#71717a", fontSize: "11px" } },
                },
                yaxis: {
                    min: 0,
                    forceNiceScale: true,
                    labels: {
                        style: { colors: "#71717a" },
                        formatter: (v) => Math.round(v),
                    },
                },
                legend: {
                    position: "top",
                    horizontalAlign: "right",
                    fontSize: "12px",
                    markers: { radius: 12 },
                },
                tooltip: { theme: "light" },
            };
        },
        statusSeries() {
            return (
                (this.stats.status_chart && this.stats.status_chart.series) ||
                []
            );
        },
        statusTotal() {
            return this.statusSeries.reduce((a, b) => a + b, 0);
        },
        statusOptions() {
            return {
                chart: { fontFamily: "Inter, sans-serif" },
                labels:
                    (this.stats.status_chart &&
                        this.stats.status_chart.labels) ||
                    [],
                colors: ["#10b981", "#f59e0b", "#0ea5e9", "#f43f5e"],
                legend: {
                    position: "bottom",
                    fontSize: "12px",
                    markers: { radius: 12 },
                },
                dataLabels: { enabled: false },
                stroke: { width: 3, colors: ["#fff"] },
                plotOptions: {
                    pie: {
                        donut: {
                            size: "72%",
                            labels: {
                                show: true,
                                total: {
                                    show: true,
                                    label: "Total",
                                    color: "#71717a",
                                    fontSize: "13px",
                                },
                                value: {
                                    fontSize: "24px",
                                    fontWeight: 700,
                                    color: "#18181b",
                                },
                            },
                        },
                    },
                },
            };
        },
    },
    methods: {
        load() {
            this.loading = true;
            this.adminRequest(
                "get",
                "api/v1/admin/dashboard-stats",
                {},
                { silent: true }
            )
                .then((result) => {
                    this.stats = result || {};
                    this.ready = true;
                })
                .catch(() => {})
                .finally(() => {
                    this.loading = false;
                });
        },
        statusLabel(s) {
            return (
                {
                    active: "Approved",
                    pending: "Pending",
                    rejected: "Rejected",
                    sold: "Sold",
                    expired: "Expired",
                }[s] || this.capitalize(s)
            );
        },
        categoryPercent(i) {
            const series =
                (this.stats.category_chart &&
                    this.stats.category_chart.series) ||
                [];
            const max = Math.max(1, ...series);
            return Math.round((series[i] / max) * 100);
        },
    },
    mounted() {
        this.load();
    },
};
</script>
