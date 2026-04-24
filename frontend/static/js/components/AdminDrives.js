const AdminDrives = {
    name: 'AdminDrives',
    data() { return { drives: [], search: '', statusFilter: '', loading: true }; },
    async created() { await this.load(); },
    methods: {
        async load() {
            this.loading = true;
            try {
                const res = await axios.get('/api/admin/drives', { headers: this.$root.authHeader(), params: { search: this.search, status: this.statusFilter } });
                this.drives = res.data;
            } catch(e) { console.error(e); }
            this.loading = false;
        },
        async approve(id, status) {
            try {
                await axios.put('/api/admin/drives/' + id + '/approve', { status }, { headers: this.$root.authHeader() });
                this.$root.showToast(status === 'approved' ? 'Drive approved!' : 'Drive closed', 'success');
                await this.load();
            } catch(e) { this.$root.showToast(e.response?.data?.error || 'Error', 'danger'); }
        },
        async deleteDrive(id) {
            if (!confirm('Delete this drive?')) return;
            try {
                await axios.delete('/api/admin/drives/' + id, { headers: this.$root.authHeader() });
                this.$root.showToast('Drive deleted', 'success');
                await this.load();
            } catch(e) { this.$root.showToast('Error', 'danger'); }
        },
        viewApps(id) { this.$router.push('/admin/applications?drive_id=' + id); },
        badgeClass(s) { return 'badge-status badge-' + s; },
        fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '-'; }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div><h3><i class="bi bi-briefcase me-2"></i>Placement Drives</h3><p>Approve and manage drives</p></div>
            <div class="d-flex gap-2">
                <select v-model="statusFilter" @change="load" class="form-select form-select-sm" style="width:140px">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="closed">Closed</option>
                </select>
                <div class="search-box"><i class="bi bi-search"></i>
                    <input v-model="search" @input="load" class="form-control form-control-sm" placeholder="Search drives..." style="padding-left:35px">
                </div>
            </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="drives.length===0" class="empty-state"><i class="bi bi-briefcase"></i><p>No drives found</p></div>
        <div v-else class="table-responsive">
            <table class="table ppa-table">
                <thead><tr><th>Job Title</th><th>Company</th><th>Package</th><th>Deadline</th><th>Status</th><th>Apps</th><th>Actions</th></tr></thead>
                <tbody>
                    <tr v-for="d in drives" :key="d.id">
                        <td><strong>{{ d.job_title }}</strong><br><small class="text-muted">{{ d.drive_type || 'Full-time' }}</small></td>
                        <td>{{ d.company_name }}</td>
                        <td>{{ d.package_lpa ? d.package_lpa + ' LPA' : '-' }}</td>
                        <td>{{ fmtDate(d.application_deadline) }}</td>
                        <td><span :class="badgeClass(d.status)">{{ d.status }}</span></td>
                        <td><span class="badge bg-primary" style="cursor:pointer" @click="viewApps(d.id)">{{ d.application_count || 0 }}</span></td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button v-if="d.status==='pending'" class="btn btn-success btn-sm" @click="approve(d.id,'approved')"><i class="bi bi-check-lg"></i></button>
                                <button v-if="d.status==='approved'" class="btn btn-secondary btn-sm" @click="approve(d.id,'closed')" title="Close"><i class="bi bi-x-circle"></i></button>
                                <button class="btn btn-outline-danger btn-sm" @click="deleteDrive(d.id)"><i class="bi bi-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `
};
