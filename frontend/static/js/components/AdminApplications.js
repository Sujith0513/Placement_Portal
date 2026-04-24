const AdminApplications = {
    name: 'AdminApplications',
    data() { return { applications: [], driveFilter: '', studentFilter: '', statusFilter: '', loading: true }; },
    async created() {
        const q = this.$route.query;
        if (q.drive_id) this.driveFilter = q.drive_id;
        if (q.student_id) this.studentFilter = q.student_id;
        await this.load();
    },
    methods: {
        async load() {
            this.loading = true;
            try {
                const params = {};
                if (this.driveFilter) params.drive_id = this.driveFilter;
                if (this.studentFilter) params.student_id = this.studentFilter;
                if (this.statusFilter) params.status = this.statusFilter;
                const res = await axios.get('/api/admin/applications', { headers: this.$root.authHeader(), params });
                this.applications = res.data;
            } catch(e) { console.error(e); }
            this.loading = false;
        },
        clearFilters() { this.driveFilter = ''; this.studentFilter = ''; this.statusFilter = ''; this.load(); },
        badgeClass(s) { return 'badge-status badge-' + s; },
        fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '-'; }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header">
            <h3><i class="bi bi-file-earmark-text me-2"></i>All Applications</h3>
            <p>View and filter all student applications</p>
        </div>
        <div class="ppa-card p-3 mb-3">
            <div class="row g-2 align-items-end">
                <div class="col-md-3">
                    <label class="form-label small fw-bold">Drive ID</label>
                    <input v-model="driveFilter" @change="load" class="form-control form-control-sm" placeholder="Filter by drive ID">
                </div>
                <div class="col-md-3">
                    <label class="form-label small fw-bold">Student ID</label>
                    <input v-model="studentFilter" @change="load" class="form-control form-control-sm" placeholder="Filter by student ID">
                </div>
                <div class="col-md-3">
                    <label class="form-label small fw-bold">Status</label>
                    <select v-model="statusFilter" @change="load" class="form-select form-select-sm">
                        <option value="">All</option>
                        <option v-for="s in ['applied','shortlisted','interviewed','selected','rejected']" :value="s">{{ s }}</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <button class="btn btn-outline-secondary btn-sm" @click="clearFilters">Clear Filters</button>
                </div>
            </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="applications.length===0" class="empty-state"><i class="bi bi-file-earmark-text"></i><p>No applications found</p></div>
        <div v-else class="table-responsive">
            <table class="table ppa-table">
                <thead><tr><th>ID</th><th>Student</th><th>Drive</th><th>Company</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                    <tr v-for="a in applications" :key="a.id">
                        <td>{{ a.id }}</td>
                        <td><strong>{{ a.student_name }}</strong><br><small>{{ a.student_roll }} · {{ a.student_branch }}</small></td>
                        <td>{{ a.drive_title }}</td>
                        <td>{{ a.company_name }}</td>
                        <td>{{ fmtDate(a.application_date) }}</td>
                        <td><span :class="badgeClass(a.status)">{{ a.status }}</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `
};
