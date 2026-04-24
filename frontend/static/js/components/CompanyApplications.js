const CompanyApplications = {
    name: 'CompanyApplications',
    data() { return { applications: [], driveInfo: null, loading: true }; },
    computed: { driveId() { return this.$route.params.driveId; } },
    async created() { await this.load(); },
    methods: {
        async load() {
            this.loading = true;
            try {
                const [apps, drive] = await Promise.all([
                    axios.get('/api/company/drives/' + this.driveId + '/applications', { headers: this.$root.authHeader() }),
                    axios.get('/api/company/drives/' + this.driveId, { headers: this.$root.authHeader() })
                ]);
                this.applications = apps.data;
                this.driveInfo = drive.data;
            } catch(e) { console.error(e); }
            this.loading = false;
        },
        async updateStatus(appId, status) {
            try {
                await axios.put('/api/company/applications/' + appId + '/status', { status }, { headers: this.$root.authHeader() });
                this.$root.showToast('Status updated to ' + status, 'success');
                await this.load();
            } catch(e) { this.$root.showToast(e.response?.data?.error || 'Error', 'danger'); }
        },
        badgeClass(s) { return 'badge-status badge-' + s; },
        fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '-'; }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header">
            <router-link to="/company/drives" class="text-decoration-none text-muted"><i class="bi bi-arrow-left me-1"></i>Back to Drives</router-link>
            <h3 class="mt-2"><i class="bi bi-people me-2"></i>Applications{{ driveInfo ? ' - ' + driveInfo.job_title : '' }}</h3>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="applications.length===0" class="empty-state"><i class="bi bi-people"></i><p>No applications yet</p></div>
        <div v-else class="table-responsive">
            <table class="table ppa-table">
                <thead><tr><th>Student</th><th>Roll No</th><th>Branch</th><th>CGPA</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    <tr v-for="a in applications" :key="a.id">
                        <td><strong>{{ a.student_name }}</strong></td>
                        <td>{{ a.student_roll }}</td>
                        <td>{{ a.student_branch }}</td>
                        <td>{{ a.student_cgpa }}</td>
                        <td>{{ fmtDate(a.application_date) }}</td>
                        <td><span :class="badgeClass(a.status)">{{ a.status }}</span></td>
                        <td>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">Update</button>
                                <ul class="dropdown-menu">
                                    <li v-for="s in ['shortlisted','interviewed','selected','rejected']" :key="s">
                                        <a class="dropdown-item" href="#" @click.prevent="updateStatus(a.id, s)" :class="{'text-success':s==='selected','text-danger':s==='rejected'}">
                                            {{ s.charAt(0).toUpperCase() + s.slice(1) }}
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `
};
