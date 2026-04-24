const AdminStudents = {
    name: 'AdminStudents',
    data() { return { students: [], search: '', loading: true }; },
    async created() { await this.load(); },
    methods: {
        async load() {
            this.loading = true;
            try {
                const res = await axios.get('/api/admin/students', { headers: this.$root.authHeader(), params: { search: this.search } });
                this.students = res.data;
            } catch(e) { console.error(e); }
            this.loading = false;
        },
        async toggleBlacklist(id) {
            try {
                await axios.put('/api/admin/students/' + id + '/blacklist', {}, { headers: this.$root.authHeader() });
                this.$root.showToast('Blacklist status updated', 'info');
                await this.load();
            } catch(e) { this.$root.showToast('Error', 'danger'); }
        },
        async deleteStudent(id) {
            if (!confirm('Delete this student and all application data?')) return;
            try {
                await axios.delete('/api/admin/students/' + id, { headers: this.$root.authHeader() });
                this.$root.showToast('Student deleted', 'success');
                await this.load();
            } catch(e) { this.$root.showToast('Error', 'danger'); }
        },
        viewApps(id) {
            this.$router.push('/admin/applications?student_id=' + id);
        }
    },
    template: `
    <div class="main-content fade-in">
        <div class="page-header d-flex justify-content-between align-items-start flex-wrap">
            <div><h3><i class="bi bi-people me-2"></i>Students</h3><p>Manage registered students</p></div>
            <div class="search-box" style="width:300px">
                <i class="bi bi-search"></i>
                <input v-model="search" @input="load" class="form-control" placeholder="Search by name, roll, branch...">
            </div>
        </div>
        <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <div v-else-if="students.length===0" class="empty-state"><i class="bi bi-people"></i><p>No students found</p></div>
        <div v-else class="table-responsive">
            <table class="table ppa-table">
                <thead><tr><th>Name</th><th>Roll No</th><th>Branch</th><th>CGPA</th><th>Year</th><th>Blacklisted</th><th>Actions</th></tr></thead>
                <tbody>
                    <tr v-for="s in students" :key="s.id">
                        <td><strong>{{ s.name }}</strong><br><small class="text-muted">{{ s.email }}</small></td>
                        <td>{{ s.roll_number }}</td>
                        <td>{{ s.branch }}</td>
                        <td>{{ s.cgpa }}</td>
                        <td>{{ s.year }}</td>
                        <td><span :class="s.is_blacklisted?'text-danger fw-bold':'text-success'">{{ s.is_blacklisted?'Yes':'No' }}</span></td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary btn-sm" @click="viewApps(s.id)" title="View Applications"><i class="bi bi-eye"></i></button>
                                <button class="btn btn-outline-dark btn-sm" @click="toggleBlacklist(s.id)" :title="s.is_blacklisted?'Unblacklist':'Blacklist'">
                                    <i :class="s.is_blacklisted?'bi bi-unlock':'bi bi-lock'"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm" @click="deleteStudent(s.id)" title="Delete"><i class="bi bi-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `
};
