const StudentProfile = {
    name: 'StudentProfile',
    data() { return { profile: {}, editing: false, form: {}, resumeFile: null, loading: true, saving: false, error: '' }; },
    async created() { await this.load(); },
    methods: {
        async load() {
            try {
                const res = await axios.get('/api/student/profile', { headers: this.$root.authHeader() });
                this.profile = res.data;
                this.form = { ...res.data };
            } catch(e) { console.error(e); }
            this.loading = false;
        },
        async save() {
            this.saving = true; this.error = '';
            try {
                const data = { name: this.form.name, roll_number: this.form.roll_number, branch: this.form.branch, cgpa: parseFloat(this.form.cgpa), year: parseInt(this.form.year), phone: this.form.phone };
                await axios.put('/api/student/profile', data, { headers: this.$root.authHeader() });
                this.$root.showToast('Profile updated', 'success');
                this.editing = false;
                await this.load();
            } catch(e) { this.error = e.response?.data?.error || 'Error'; }
            this.saving = false;
        },
        async uploadResume() {
            if (!this.resumeFile) return;
            const fd = new FormData();
            fd.append('resume', this.resumeFile);
            try {
                await axios.post('/api/student/resume', fd, { headers: { ...this.$root.authHeader(), 'Content-Type': 'multipart/form-data' } });
                this.$root.showToast('Resume uploaded!', 'success');
                await this.load();
            } catch(e) { this.$root.showToast(e.response?.data?.error || 'Upload failed', 'danger'); }
        },
        async exportCSV() {
            try {
                const res = await axios.post('/api/student/export-csv', {}, { headers: this.$root.authHeader() });
                this.$root.showToast(res.data.message, 'success');
                if (res.data.download_url) {
                    window.open(res.data.download_url, '_blank');
                }
            } catch(e) { this.$root.showToast(e.response?.data?.error || 'Export failed', 'danger'); }
        }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header"><h3><i class="bi bi-person me-2"></i>My Profile</h3><p>Manage your profile and resume</p></div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else>
            <div class="row g-4">
                <div class="col-md-8">
                    <div class="ppa-card p-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="fw-bold mb-0">Profile Details</h6>
                            <button v-if="!editing" class="btn btn-ppa-outline btn-sm" @click="editing=true"><i class="bi bi-pencil me-1"></i>Edit</button>
                        </div>
                        <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
                        <div v-if="!editing">
                            <div class="row g-3">
                                <div class="col-6"><label class="form-label text-muted">Name</label><p class="fw-bold">{{ profile.name }}</p></div>
                                <div class="col-6"><label class="form-label text-muted">Roll Number</label><p class="fw-bold">{{ profile.roll_number }}</p></div>
                                <div class="col-4"><label class="form-label text-muted">Branch</label><p class="fw-bold">{{ profile.branch }}</p></div>
                                <div class="col-4"><label class="form-label text-muted">CGPA</label><p class="fw-bold">{{ profile.cgpa }}</p></div>
                                <div class="col-4"><label class="form-label text-muted">Year</label><p class="fw-bold">{{ profile.year }}</p></div>
                                <div class="col-6"><label class="form-label text-muted">Email</label><p>{{ profile.email }}</p></div>
                                <div class="col-6"><label class="form-label text-muted">Phone</label><p>{{ profile.phone || '-' }}</p></div>
                            </div>
                        </div>
                        <form v-else @submit.prevent="save">
                            <div class="row g-3">
                                <div class="col-6"><label class="form-label">Name</label><input v-model="form.name" class="form-control" required></div>
                                <div class="col-6"><label class="form-label">Roll Number</label><input v-model="form.roll_number" class="form-control" required></div>
                                <div class="col-4"><label class="form-label">Branch</label>
                                    <select v-model="form.branch" class="form-select"><option v-for="b in ['CSE','ECE','ME','CE','EE']" :value="b">{{ b }}</option></select></div>
                                <div class="col-4"><label class="form-label">CGPA</label><input v-model="form.cgpa" type="number" step="0.01" class="form-control"></div>
                                <div class="col-4"><label class="form-label">Year</label><select v-model="form.year" class="form-select"><option v-for="y in [1,2,3,4]" :value="y">{{ y }}</option></select></div>
                                <div class="col-6"><label class="form-label">Phone</label><input v-model="form.phone" class="form-control"></div>
                            </div>
                            <div class="mt-3">
                                <button type="submit" class="btn btn-ppa me-2" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
                                <button type="button" class="btn btn-outline-secondary" @click="editing=false">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="ppa-card p-4 mb-3">
                        <h6 class="fw-bold mb-3"><i class="bi bi-file-earmark-pdf me-2"></i>Resume</h6>
                        <p v-if="profile.resume_path" class="text-success mb-2"><i class="bi bi-check-circle me-1"></i>{{ profile.resume_path }}</p>
                        <p v-else class="text-muted mb-2">No resume uploaded</p>
                        <input type="file" class="form-control form-control-sm mb-2" accept=".pdf,.doc,.docx" @change="resumeFile=$event.target.files[0]">
                        <button class="btn btn-ppa btn-sm w-100" @click="uploadResume" :disabled="!resumeFile">
                            <i class="bi bi-upload me-1"></i>Upload Resume
                        </button>
                    </div>
                    <div class="ppa-card p-4">
                        <h6 class="fw-bold mb-3"><i class="bi bi-download me-2"></i>Export Data</h6>
                        <button class="btn btn-ppa-outline btn-sm w-100" @click="exportCSV">
                            <i class="bi bi-filetype-csv me-1"></i>Export Applications CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
