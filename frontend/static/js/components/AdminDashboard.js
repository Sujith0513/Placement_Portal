const AdminDashboard = {
    name: 'AdminDashboard',
    data() { return { stats: {}, loading: true }; },
    async created() { await this.load(); },
    methods: {
        async load() {
            try {
                const res = await axios.get('/api/admin/dashboard', { headers: this.$root.authHeader() });
                this.stats = res.data;
            } catch(e) { console.error(e); }
            this.loading = false;
        }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header">
            <h3><i class="bi bi-speedometer2 me-2"></i>Admin Dashboard</h3>
            <p>Overview of placement portal activity</p>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else>
            <div class="row g-3 mb-4">
                <div class="col-md-4 col-sm-6" v-for="(card, i) in [
                    {icon:'bi-people-fill', label:'Total Students', val:stats.total_students, grad:'stat-gradient-1'},
                    {icon:'bi-building-fill', label:'Total Companies', val:stats.total_companies, grad:'stat-gradient-2'},
                    {icon:'bi-briefcase-fill', label:'Total Drives', val:stats.total_drives, grad:'stat-gradient-3'},
                    {icon:'bi-file-earmark-check-fill', label:'Total Applications', val:stats.total_applications, grad:'stat-gradient-4'},
                    {icon:'bi-trophy-fill', label:'Students Selected', val:stats.total_selected, grad:'stat-gradient-5'},
                    {icon:'bi-clock-fill', label:'Pending Approvals', val:(stats.pending_companies||0)+(stats.pending_drives||0), grad:'stat-gradient-6'}
                ]" :key="i">
                    <div class="stat-card" :class="card.grad">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <div class="stat-number">{{ card.val || 0 }}</div>
                                <div class="stat-label mt-1">{{ card.label }}</div>
                            </div>
                            <i :class="card.icon" class="stat-icon"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="ppa-card p-3">
                        <h6 class="fw-bold mb-3"><i class="bi bi-building me-2"></i>Pending Companies ({{ stats.pending_companies || 0 }})</h6>
                        <router-link to="/admin/companies" class="btn btn-ppa-outline btn-sm">Manage Companies</router-link>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="ppa-card p-3">
                        <h6 class="fw-bold mb-3"><i class="bi bi-briefcase me-2"></i>Pending Drives ({{ stats.pending_drives || 0 }})</h6>
                        <router-link to="/admin/drives" class="btn btn-ppa-outline btn-sm">Manage Drives</router-link>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
