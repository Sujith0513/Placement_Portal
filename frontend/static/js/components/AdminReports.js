const AdminReports = {
    name: 'AdminReports',
    data() { return { report: {}, loading: true }; },
    async created() { await this.load(); },
    methods: {
        async load() {
            try {
                const res = await axios.get('/api/admin/reports', { headers: this.$root.authHeader() });
                this.report = res.data;
                this.$nextTick(() => this.renderCharts());
            } catch(e) { console.error(e); }
            this.loading = false;
        },
        renderCharts() {
            // Drives by month chart
            if (this.report.drives_by_month && this.report.drives_by_month.length > 0) {
                const ctx1 = document.getElementById('drivesChart');
                if (ctx1) {
                    new Chart(ctx1, {
                        type: 'bar',
                        data: {
                            labels: this.report.drives_by_month.map(r => r.month),
                            datasets: [{
                                label: 'Drives',
                                data: this.report.drives_by_month.map(r => r.count),
                                backgroundColor: 'rgba(67, 97, 238, 0.7)',
                                borderRadius: 6
                            }]
                        },
                        options: { responsive: true, plugins: { legend: { display: false } } }
                    });
                }
            }
            // Branch stats chart
            if (this.report.branch_stats && this.report.branch_stats.length > 0) {
                const ctx2 = document.getElementById('branchChart');
                if (ctx2) {
                    new Chart(ctx2, {
                        type: 'doughnut',
                        data: {
                            labels: this.report.branch_stats.map(r => r.branch || 'Unknown'),
                            datasets: [{
                                data: this.report.branch_stats.map(r => r.applications),
                                backgroundColor: ['#4361ee','#7209b7','#06d6a0','#f72585','#ff6b6b','#ffd166']
                            }]
                        },
                        options: { responsive: true }
                    });
                }
            }
        }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header"><h3><i class="bi bi-bar-chart-line me-2"></i>Placement Reports</h3><p>Statistics and analytics</p></div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else>
            <div class="row g-4 mb-4">
                <div class="col-md-6">
                    <div class="ppa-card p-4">
                        <h6 class="fw-bold mb-3">Drives by Month</h6>
                        <canvas id="drivesChart" height="200"></canvas>
                        <div v-if="!report.drives_by_month||report.drives_by_month.length===0" class="text-muted text-center py-3">No data yet</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="ppa-card p-4">
                        <h6 class="fw-bold mb-3">Applications by Branch</h6>
                        <canvas id="branchChart" height="200"></canvas>
                        <div v-if="!report.branch_stats||report.branch_stats.length===0" class="text-muted text-center py-3">No data yet</div>
                    </div>
                </div>
            </div>
            <!-- Selections by Company Table -->
            <div class="ppa-card p-4">
                <h6 class="fw-bold mb-3">Selections by Company</h6>
                <div v-if="!report.selections_by_company||report.selections_by_company.length===0" class="text-muted">No selections yet</div>
                <table v-else class="table ppa-table mb-0">
                    <thead><tr><th>Company</th><th>Students Selected</th></tr></thead>
                    <tbody><tr v-for="r in report.selections_by_company" :key="r.company"><td>{{ r.company }}</td><td><span class="badge bg-success">{{ r.selected }}</span></td></tr></tbody>
                </table>
            </div>
            <!-- Branch Stats Table -->
            <div class="ppa-card p-4 mt-4" v-if="report.branch_stats && report.branch_stats.length > 0">
                <h6 class="fw-bold mb-3">Branch-wise Breakdown</h6>
                <table class="table ppa-table mb-0">
                    <thead><tr><th>Branch</th><th>Applications</th><th>Selected</th><th>Selection Rate</th></tr></thead>
                    <tbody>
                        <tr v-for="r in report.branch_stats" :key="r.branch">
                            <td>{{ r.branch || 'Unknown' }}</td><td>{{ r.applications }}</td><td>{{ r.selected }}</td>
                            <td>{{ r.applications > 0 ? ((r.selected / r.applications) * 100).toFixed(1) + '%' : '0%' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `
};
