const StudentApplications = {
    name: 'StudentApplications',
    data() { return { applications: [], loading: true }; },
    async created() { await this.load(); },
    methods: {
        async load() {
            try {
                const res = await axios.get('/api/student/applications', { headers: this.$root.authHeader() });
                this.applications = res.data;
            } catch(e) { console.error(e); }
            this.loading = false;
        },
        badgeClass(s) { return 'badge-status badge-' + s; },
        fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '-'; }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header"><h3><i class="bi bi-file-earmark-text me-2"></i>My Applications</h3><p>Track your placement applications</p></div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="applications.length===0" class="empty-state"><i class="bi bi-file-earmark-text"></i><p>No applications yet. Browse drives and apply!</p></div>
        <div v-else class="table-responsive">
            <table class="table ppa-table">
                <thead><tr><th>Company</th><th>Drive</th><th>Applied On</th><th>Status</th><th>Interview</th></tr></thead>
                <tbody>
                    <tr v-for="a in applications" :key="a.id">
                        <td><strong>{{ a.company_name }}</strong></td>
                        <td>{{ a.drive_title }}</td>
                        <td>{{ fmtDate(a.application_date) }}</td>
                        <td><span :class="badgeClass(a.status)">{{ a.status }}</span></td>
                        <td>
                            <div v-if="a.interview">
                                <small>{{ a.interview.scheduled_date }} {{ a.interview.scheduled_time || '' }}</small><br>
                                <small class="text-muted">{{ a.interview.mode }} · {{ a.interview.venue || 'TBA' }}</small>
                                <span v-if="a.interview.meeting_link"><br><a :href="a.interview.meeting_link" target="_blank" class="small">Join Link</a></span>
                            </div>
                            <span v-else class="text-muted">-</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `
};
