const StudentDashboard = {
    name: 'StudentDashboard',
    data() { return { drives: [], search: '', loading: true }; },
    async created() { await this.load(); },
    methods: {
        async load() {
            this.loading = true;
            try {
                const res = await axios.get('/api/student/drives', { headers: this.$root.authHeader(), params: { search: this.search } });
                this.drives = res.data;
            } catch(e) { console.error(e); }
            this.loading = false;
        },
        async applyToDrive(id) {
            try {
                await axios.post('/api/student/drives/' + id + '/apply', {}, { headers: this.$root.authHeader() });
                this.$root.showToast('Applied successfully!', 'success');
                await this.load();
            } catch(e) { this.$root.showToast(e.response?.data?.error || 'Error', 'danger'); }
        },
        badgeClass(s) { return 'badge-status badge-' + s; },
        fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '-'; },
        isDeadlineSoon(d) {
            if (!d) return false;
            const diff = new Date(d) - new Date();
            return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
        }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header d-flex justify-content-between align-items-start flex-wrap">
            <div><h3><i class="bi bi-briefcase me-2"></i>Placement Drives</h3><p>Browse and apply to placement drives</p></div>
            <div class="search-box" style="width:300px">
                <i class="bi bi-search"></i>
                <input v-model="search" @input="load" class="form-control" placeholder="Search drives...">
            </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="drives.length===0" class="empty-state"><i class="bi bi-briefcase"></i><p>No approved drives available</p></div>
        <div v-else class="row g-3">
            <div class="col-md-6 col-lg-4" v-for="d in drives" :key="d.id">
                <div class="ppa-card p-4 h-100 d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="fw-bold mb-0">{{ d.job_title }}</h6>
                        <span class="badge bg-primary" v-if="d.package_lpa">{{ d.package_lpa }} LPA</span>
                    </div>
                    <p class="text-muted mb-2" style="font-size:0.85rem"><i class="bi bi-building me-1"></i>{{ d.company_name }}</p>
                    <div class="mb-2" style="font-size:0.85rem">
                        <span class="me-3" v-if="d.location"><i class="bi bi-geo-alt me-1"></i>{{ d.location }}</span>
                        <span v-if="d.drive_type"><i class="bi bi-tag me-1"></i>{{ d.drive_type }}</span>
                    </div>
                    <div class="mb-2" style="font-size:0.82rem;color:var(--ppa-text-muted)">
                        <div><strong>Branch:</strong> {{ d.eligibility_branch || 'All' }}</div>
                        <div><strong>Min CGPA:</strong> {{ d.eligibility_cgpa || 'None' }}</div>
                        <div :class="{'text-danger fw-bold': isDeadlineSoon(d.application_deadline)}">
                            <strong>Deadline:</strong> {{ fmtDate(d.application_deadline) }}
                            <span v-if="isDeadlineSoon(d.application_deadline)" class="badge bg-danger ms-1">Closing Soon</span>
                        </div>
                    </div>
                    <p v-if="d.job_description" class="mb-3" style="font-size:0.83rem;color:var(--ppa-text-muted)">{{ d.job_description.substring(0, 120) }}{{ d.job_description.length > 120 ? '...' : '' }}</p>
                    <div class="mt-auto">
                        <button v-if="d.already_applied" class="btn btn-secondary btn-sm w-100" disabled><i class="bi bi-check-circle me-1"></i>Already Applied</button>
                        <button v-else-if="!d.eligible" class="btn btn-outline-danger btn-sm w-100" disabled><i class="bi bi-exclamation-circle me-1"></i>Not Eligible</button>
                        <button v-else class="btn btn-ppa btn-sm w-100" @click="applyToDrive(d.id)"><i class="bi bi-send me-1"></i>Apply Now</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
