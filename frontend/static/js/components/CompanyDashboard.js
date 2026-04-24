const CompanyDashboard = {
    name: 'CompanyDashboard',
    data() { return { profile: {}, drives: [], loading: true }; },
    async created() { await this.load(); },
    methods: {
        async load() {
            try {
                const [p, d] = await Promise.all([
                    axios.get('/api/company/profile', { headers: this.$root.authHeader() }),
                    axios.get('/api/company/drives', { headers: this.$root.authHeader() })
                ]);
                this.profile = p.data;
                this.drives = d.data;
            } catch(e) { console.error(e); }
            this.loading = false;
        },
        totalApps() { return this.drives.reduce((s, d) => s + (d.application_count || 0), 0); },
        badgeClass(s) { return 'badge-status badge-' + s; }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header"><h3><i class="bi bi-speedometer2 me-2"></i>Company Dashboard</h3><p>Welcome, {{ profile.company_name }}</p></div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else>
            <!-- Status Banner -->
            <div v-if="profile.approval_status==='pending'" class="alert alert-warning d-flex align-items-center mb-4">
                <i class="bi bi-hourglass-split me-2 fs-4"></i>
                <div><strong>Pending Approval</strong><br>Your company registration is awaiting admin approval. You cannot create drives until approved.</div>
            </div>
            <div v-if="profile.approval_status==='rejected'" class="alert alert-danger d-flex align-items-center mb-4">
                <i class="bi bi-x-circle me-2 fs-4"></i>
                <div><strong>Registration Rejected</strong><br>Contact the placement cell for details.</div>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-md-3"><div class="stat-card stat-gradient-1"><div class="stat-number">{{ drives.length }}</div><div class="stat-label">Total Drives</div></div></div>
                <div class="col-md-3"><div class="stat-card stat-gradient-3"><div class="stat-number">{{ drives.filter(d=>d.status==='approved').length }}</div><div class="stat-label">Active Drives</div></div></div>
                <div class="col-md-3"><div class="stat-card stat-gradient-4"><div class="stat-number">{{ totalApps() }}</div><div class="stat-label">Total Applicants</div></div></div>
                <div class="col-md-3"><div class="stat-card stat-gradient-2"><span class="badge-status" :class="badgeClass(profile.approval_status)" style="font-size:1rem">{{ profile.approval_status }}</span><div class="stat-label mt-2">Company Status</div></div></div>
            </div>

            <!-- Company Info Card -->
            <div class="ppa-card p-4 mb-4">
                <h6 class="fw-bold mb-3">Company Profile</h6>
                <div class="row">
                    <div class="col-md-6"><p><strong>Industry:</strong> {{ profile.industry || '-' }}</p><p><strong>Website:</strong> {{ profile.website || '-' }}</p></div>
                    <div class="col-md-6"><p><strong>HR Contact:</strong> {{ profile.hr_contact || '-' }}</p><p><strong>HR Email:</strong> {{ profile.hr_email || '-' }}</p></div>
                </div>
                <p v-if="profile.description"><strong>About:</strong> {{ profile.description }}</p>
                <router-link to="/company/drives" class="btn btn-ppa mt-2"><i class="bi bi-briefcase me-2"></i>Manage Drives</router-link>
            </div>
        </div>
    </div>
    `
};
