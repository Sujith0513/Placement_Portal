const AdminCompanies = {
    name: 'AdminCompanies',
    data() { return { companies: [], search: '', loading: true }; },
    async created() { await this.load(); },
    methods: {
        async load() {
            this.loading = true;
            try {
                const res = await axios.get('/api/admin/companies', { headers: this.$root.authHeader(), params: { search: this.search } });
                this.companies = res.data;
            } catch(e) { console.error(e); }
            this.loading = false;
        },
        async approve(id, status) {
            try {
                await axios.put('/api/admin/companies/' + id + '/approve', { status }, { headers: this.$root.authHeader() });
                this.$root.showToast(status === 'approved' ? 'Company approved!' : 'Company rejected', status === 'approved' ? 'success' : 'warning');
                await this.load();
            } catch(e) { this.$root.showToast('Error', 'danger'); }
        },
        async toggleBlacklist(id) {
            try {
                await axios.put('/api/admin/companies/' + id + '/blacklist', {}, { headers: this.$root.authHeader() });
                this.$root.showToast('Blacklist status updated', 'info');
                await this.load();
            } catch(e) { this.$root.showToast('Error', 'danger'); }
        },
        async deleteCompany(id) {
            if (!confirm('Delete this company and all associated data?')) return;
            try {
                await axios.delete('/api/admin/companies/' + id, { headers: this.$root.authHeader() });
                this.$root.showToast('Company deleted', 'success');
                await this.load();
            } catch(e) { this.$root.showToast('Error', 'danger'); }
        },
        badgeClass(s) { return 'badge-status badge-' + s; }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header d-flex justify-content-between align-items-start flex-wrap">
            <div><h3><i class="bi bi-building me-2"></i>Companies</h3><p>Manage company registrations</p></div>
            <div class="search-box" style="width:300px">
                <i class="bi bi-search"></i>
                <input v-model="search" @input="load" class="form-control" placeholder="Search companies...">
            </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="companies.length===0" class="empty-state"><i class="bi bi-building"></i><p>No companies found</p></div>
        <div v-else class="table-responsive">
            <table class="table ppa-table">
                <thead><tr><th>Company</th><th>Industry</th><th>HR Contact</th><th>Status</th><th>Blacklisted</th><th>Actions</th></tr></thead>
                <tbody>
                    <tr v-for="c in companies" :key="c.id">
                        <td><strong>{{ c.company_name }}</strong><br><small class="text-muted">{{ c.email }}</small></td>
                        <td>{{ c.industry || '-' }}</td>
                        <td>{{ c.hr_contact || '-' }}<br><small>{{ c.hr_email }}</small></td>
                        <td><span :class="badgeClass(c.approval_status)">{{ c.approval_status }}</span></td>
                        <td><span :class="c.is_blacklisted?'text-danger fw-bold':'text-success'">{{ c.is_blacklisted?'Yes':'No' }}</span></td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button v-if="c.approval_status==='pending'" class="btn btn-success btn-sm" @click="approve(c.id,'approved')" title="Approve"><i class="bi bi-check-lg"></i></button>
                                <button v-if="c.approval_status==='pending'" class="btn btn-warning btn-sm" @click="approve(c.id,'rejected')" title="Reject"><i class="bi bi-x-lg"></i></button>
                                <button class="btn btn-outline-dark btn-sm" @click="toggleBlacklist(c.id)" :title="c.is_blacklisted?'Unblacklist':'Blacklist'">
                                    <i :class="c.is_blacklisted?'bi bi-unlock':'bi bi-lock'"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm" @click="deleteCompany(c.id)" title="Delete"><i class="bi bi-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `
};
