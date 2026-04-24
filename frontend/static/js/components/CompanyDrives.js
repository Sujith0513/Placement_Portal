const CompanyDrives = {
    name: 'CompanyDrives',
    data() {
        return {
            drives: [], loading: true, showForm: false,
            form: { job_title:'', job_description:'', eligibility_branch:'all', eligibility_cgpa:0, eligibility_year:'', application_deadline:'', package_lpa:'', location:'', drive_type:'full-time' },
            editingId: null, formError: ''
        };
    },
    async created() { await this.load(); },
    methods: {
        async load() {
            this.loading = true;
            try {
                const res = await axios.get('/api/company/drives', { headers: this.$root.authHeader() });
                this.drives = res.data;
            } catch(e) { console.error(e); }
            this.loading = false;
        },
        openCreate() {
            this.editingId = null;
            this.form = { job_title:'', job_description:'', eligibility_branch:'all', eligibility_cgpa:0, eligibility_year:'', application_deadline:'', package_lpa:'', location:'', drive_type:'full-time' };
            this.showForm = true;
            this.formError = '';
        },
        openEdit(d) {
            this.editingId = d.id;
            this.form = { ...d, application_deadline: d.application_deadline ? d.application_deadline.substring(0,16) : '' };
            this.showForm = true;
            this.formError = '';
        },
        async saveDrive() {
            this.formError = '';
            try {
                const payload = { ...this.form };
                if (payload.eligibility_cgpa) payload.eligibility_cgpa = parseFloat(payload.eligibility_cgpa);
                if (payload.eligibility_year) payload.eligibility_year = parseInt(payload.eligibility_year);
                if (payload.package_lpa) payload.package_lpa = parseFloat(payload.package_lpa);

                if (this.editingId) {
                    await axios.put('/api/company/drives/' + this.editingId, payload, { headers: this.$root.authHeader() });
                    this.$root.showToast('Drive updated', 'success');
                } else {
                    await axios.post('/api/company/drives', payload, { headers: this.$root.authHeader() });
                    this.$root.showToast('Drive created! Awaiting admin approval.', 'success');
                }
                this.showForm = false;
                await this.load();
            } catch(e) { this.formError = e.response?.data?.error || 'Error saving drive'; }
        },
        async deleteDrive(id) {
            if (!confirm('Delete this drive?')) return;
            try {
                await axios.delete('/api/company/drives/' + id, { headers: this.$root.authHeader() });
                this.$root.showToast('Drive deleted', 'success');
                await this.load();
            } catch(e) { this.$root.showToast(e.response?.data?.error || 'Error', 'danger'); }
        },
        viewApps(id) { this.$router.push('/company/applications/' + id); },
        badgeClass(s) { return 'badge-status badge-' + s; },
        fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '-'; }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header d-flex justify-content-between align-items-start">
            <div><h3><i class="bi bi-briefcase me-2"></i>My Placement Drives</h3><p>Create and manage your drives</p></div>
            <button class="btn btn-ppa" @click="openCreate"><i class="bi bi-plus-lg me-2"></i>New Drive</button>
        </div>

        <!-- Drive Form Modal -->
        <div v-if="showForm" class="ppa-card p-4 mb-4" style="border-left:4px solid var(--ppa-primary)">
            <h6 class="fw-bold mb-3">{{ editingId ? 'Edit Drive' : 'Create New Drive' }}</h6>
            <div v-if="formError" class="alert alert-danger py-2">{{ formError }}</div>
            <form @submit.prevent="saveDrive">
                <div class="row g-3">
                    <div class="col-md-6"><label class="form-label">Job Title *</label><input v-model="form.job_title" class="form-control" required></div>
                    <div class="col-md-3"><label class="form-label">Package (LPA)</label><input v-model="form.package_lpa" type="number" step="0.1" class="form-control"></div>
                    <div class="col-md-3"><label class="form-label">Type</label>
                        <select v-model="form.drive_type" class="form-select"><option value="full-time">Full-time</option><option value="internship">Internship</option><option value="contract">Contract</option></select>
                    </div>
                    <div class="col-12"><label class="form-label">Job Description</label><textarea v-model="form.job_description" class="form-control" rows="3"></textarea></div>
                    <div class="col-md-4"><label class="form-label">Eligible Branches</label><input v-model="form.eligibility_branch" class="form-control" placeholder="CSE,ECE or all"></div>
                    <div class="col-md-2"><label class="form-label">Min CGPA</label><input v-model="form.eligibility_cgpa" type="number" step="0.1" min="0" max="10" class="form-control"></div>
                    <div class="col-md-2"><label class="form-label">Year</label><input v-model="form.eligibility_year" type="number" min="1" max="4" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Location</label><input v-model="form.location" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Application Deadline</label><input v-model="form.application_deadline" type="datetime-local" class="form-control"></div>
                </div>
                <div class="mt-3">
                    <button type="submit" class="btn btn-ppa me-2">{{ editingId ? 'Update' : 'Create' }}</button>
                    <button type="button" class="btn btn-outline-secondary" @click="showForm=false">Cancel</button>
                </div>
            </form>
        </div>

        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="drives.length===0 && !showForm" class="empty-state"><i class="bi bi-briefcase"></i><p>No drives yet. Create your first placement drive!</p></div>
        <div v-else class="table-responsive">
            <table class="table ppa-table">
                <thead><tr><th>Job Title</th><th>Package</th><th>Deadline</th><th>Status</th><th>Applicants</th><th>Actions</th></tr></thead>
                <tbody>
                    <tr v-for="d in drives" :key="d.id">
                        <td><strong>{{ d.job_title }}</strong><br><small class="text-muted">{{ d.drive_type }} · {{ d.location || '-' }}</small></td>
                        <td>{{ d.package_lpa ? d.package_lpa + ' LPA' : '-' }}</td>
                        <td>{{ fmtDate(d.application_deadline) }}</td>
                        <td><span :class="badgeClass(d.status)">{{ d.status }}</span></td>
                        <td><span class="badge bg-primary clickable" @click="viewApps(d.id)">{{ d.application_count || 0 }}</span></td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary btn-sm" @click="viewApps(d.id)" title="View Applications"><i class="bi bi-people"></i></button>
                                <button class="btn btn-outline-secondary btn-sm" @click="openEdit(d)" title="Edit"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-outline-danger btn-sm" @click="deleteDrive(d.id)" title="Delete"><i class="bi bi-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `
};
