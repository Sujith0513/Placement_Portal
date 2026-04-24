const CompanyInterviews = {
    name: 'CompanyInterviews',
    data() {
        return {
            interviews: [], loading: true, showForm: false,
            form: { application_id:'', scheduled_date:'', scheduled_time:'', venue:'', mode:'offline', meeting_link:'', notes:'' },
            formError: ''
        };
    },
    async created() { await this.load(); },
    methods: {
        async load() {
            this.loading = true;
            try {
                const res = await axios.get('/api/company/interviews', { headers: this.$root.authHeader() });
                this.interviews = res.data;
            } catch(e) { console.error(e); }
            this.loading = false;
        },
        async scheduleInterview() {
            this.formError = '';
            try {
                await axios.post('/api/company/interviews', this.form, { headers: this.$root.authHeader() });
                this.$root.showToast('Interview scheduled!', 'success');
                this.showForm = false;
                await this.load();
            } catch(e) { this.formError = e.response?.data?.error || 'Error'; }
        },
        async cancelInterview(id) {
            if (!confirm('Cancel this interview?')) return;
            try {
                await axios.put('/api/company/interviews/' + id, { status: 'cancelled' }, { headers: this.$root.authHeader() });
                this.$root.showToast('Interview cancelled', 'warning');
                await this.load();
            } catch(e) { this.$root.showToast('Error', 'danger'); }
        },
        async completeInterview(id) {
            try {
                await axios.put('/api/company/interviews/' + id, { status: 'completed' }, { headers: this.$root.authHeader() });
                this.$root.showToast('Interview marked complete', 'success');
                await this.load();
            } catch(e) { this.$root.showToast('Error', 'danger'); }
        },
        badgeClass(s) { return 'badge-status badge-' + s; }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header d-flex justify-content-between align-items-start">
            <div><h3><i class="bi bi-calendar-event me-2"></i>Interviews</h3><p>Schedule and manage interviews</p></div>
            <button class="btn btn-ppa" @click="showForm=!showForm"><i class="bi bi-plus-lg me-2"></i>Schedule Interview</button>
        </div>

        <div v-if="showForm" class="ppa-card p-4 mb-4" style="border-left:4px solid var(--ppa-primary)">
            <h6 class="fw-bold mb-3">Schedule New Interview</h6>
            <div v-if="formError" class="alert alert-danger py-2">{{ formError }}</div>
            <form @submit.prevent="scheduleInterview">
                <div class="row g-3">
                    <div class="col-md-3"><label class="form-label">Application ID *</label><input v-model="form.application_id" type="number" class="form-control" required></div>
                    <div class="col-md-3"><label class="form-label">Date *</label><input v-model="form.scheduled_date" type="date" class="form-control" required></div>
                    <div class="col-md-2"><label class="form-label">Time</label><input v-model="form.scheduled_time" type="time" class="form-control"></div>
                    <div class="col-md-2"><label class="form-label">Mode</label>
                        <select v-model="form.mode" class="form-select"><option value="offline">Offline</option><option value="online">Online</option></select>
                    </div>
                    <div class="col-md-4"><label class="form-label">Venue</label><input v-model="form.venue" class="form-control"></div>
                    <div class="col-md-4"><label class="form-label">Meeting Link</label><input v-model="form.meeting_link" class="form-control" placeholder="https://meet.google.com/..."></div>
                    <div class="col-md-4"><label class="form-label">Notes</label><input v-model="form.notes" class="form-control"></div>
                </div>
                <div class="mt-3"><button type="submit" class="btn btn-ppa me-2">Schedule</button><button type="button" class="btn btn-outline-secondary" @click="showForm=false">Cancel</button></div>
            </form>
        </div>

        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="interviews.length===0 && !showForm" class="empty-state"><i class="bi bi-calendar-event"></i><p>No interviews scheduled</p></div>
        <div v-else class="table-responsive">
            <table class="table ppa-table">
                <thead><tr><th>Student</th><th>Drive</th><th>Date</th><th>Time</th><th>Mode</th><th>Venue</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    <tr v-for="i in interviews" :key="i.id">
                        <td><strong>{{ i.student_name }}</strong></td>
                        <td>{{ i.drive_title }}</td>
                        <td>{{ i.scheduled_date }}</td>
                        <td>{{ i.scheduled_time || '-' }}</td>
                        <td>{{ i.mode }}</td>
                        <td>{{ i.venue || (i.meeting_link ? 'Online' : '-') }}</td>
                        <td><span :class="badgeClass(i.status)">{{ i.status }}</span></td>
                        <td>
                            <div class="btn-group btn-group-sm" v-if="i.status==='scheduled'">
                                <button class="btn btn-success btn-sm" @click="completeInterview(i.id)" title="Mark Complete"><i class="bi bi-check-lg"></i></button>
                                <button class="btn btn-danger btn-sm" @click="cancelInterview(i.id)" title="Cancel"><i class="bi bi-x-lg"></i></button>
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
