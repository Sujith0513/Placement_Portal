const StudentHistory = {
    name: 'StudentHistory',
    data() { return { history: [], loading: true }; },
    async created() { await this.load(); },
    methods: {
        async load() {
            try {
                const res = await axios.get('/api/student/history', { headers: this.$root.authHeader() });
                this.history = res.data;
            } catch(e) { console.error(e); }
            this.loading = false;
        },
        badgeClass(s) { return 'badge-status badge-' + s; },
        fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '-'; }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header"><h3><i class="bi bi-clock-history me-2"></i>Placement History</h3><p>Your past placement activities</p></div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="history.length===0" class="empty-state"><i class="bi bi-clock-history"></i><p>No completed placements yet</p></div>
        <div v-else class="table-responsive">
            <table class="table ppa-table">
                <thead><tr><th>Company</th><th>Drive</th><th>Applied On</th><th>Result</th></tr></thead>
                <tbody>
                    <tr v-for="h in history" :key="h.id">
                        <td><strong>{{ h.company_name }}</strong></td>
                        <td>{{ h.drive_title }}</td>
                        <td>{{ fmtDate(h.application_date) }}</td>
                        <td><span :class="badgeClass(h.status)">{{ h.status }}</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `
};
