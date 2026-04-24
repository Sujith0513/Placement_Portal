const RegisterComponent = {
    name: 'RegisterComponent',
    emits: ['login-success'],
    data() {
        return {
            role: 'student',
            email: '', password: '', confirmPassword: '',
            name: '', roll_number: '', branch: '', cgpa: '', year: '', phone: '',
            company_name: '', hr_contact: '', hr_email: '', website: '', industry: '', description: '',
            error: '', loading: false
        };
    },
    methods: {
        async register() {
            this.error = '';
            if (this.password !== this.confirmPassword) {
                this.error = 'Passwords do not match';
                return;
            }
            if (this.password.length < 4) {
                this.error = 'Password must be at least 4 characters';
                return;
            }
            this.loading = true;
            try {
                const payload = { email: this.email, password: this.password, role: this.role };
                if (this.role === 'student') {
                    Object.assign(payload, {
                        name: this.name, roll_number: this.roll_number, branch: this.branch,
                        cgpa: parseFloat(this.cgpa) || 0, year: parseInt(this.year) || 1, phone: this.phone
                    });
                } else {
                    Object.assign(payload, {
                        company_name: this.company_name, hr_contact: this.hr_contact,
                        hr_email: this.hr_email, website: this.website,
                        industry: this.industry, description: this.description
                    });
                }
                const res = await axios.post('/api/auth/register', payload);
                this.$emit('login-success', res.data);
            } catch (e) {
                this.error = e.response?.data?.error || 'Registration failed';
            } finally {
                this.loading = false;
            }
        }
    },
    template: `
    <div class="auth-wrapper" style="padding:2rem 0">
        <div class="auth-card" style="max-width:520px">
            <div class="text-center mb-3">
                <i class="bi bi-person-plus-fill" style="font-size:2.5rem;background:linear-gradient(135deg,#4361ee,#7209b7);-webkit-background-clip:text;-webkit-text-fill-color:transparent"></i>
            </div>
            <h2 class="text-center">Create Account</h2>
            <p class="subtitle text-center">Join the Placement Portal</p>
            <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
            <form @submit.prevent="register">
                <!-- Role Switch -->
                <div class="d-flex mb-3 gap-2">
                    <button type="button" class="btn flex-fill" :class="role==='student'?'btn-ppa':'btn-ppa-outline'" @click="role='student'">
                        <i class="bi bi-person"></i> Student
                    </button>
                    <button type="button" class="btn flex-fill" :class="role==='company'?'btn-ppa':'btn-ppa-outline'" @click="role='company'">
                        <i class="bi bi-building"></i> Company
                    </button>
                </div>

                <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input v-model="email" type="email" class="form-control" required>
                </div>
                <div class="row mb-3">
                    <div class="col-6">
                        <label class="form-label">Password</label>
                        <input v-model="password" type="password" class="form-control" required>
                    </div>
                    <div class="col-6">
                        <label class="form-label">Confirm Password</label>
                        <input v-model="confirmPassword" type="password" class="form-control" required>
                    </div>
                </div>

                <!-- Student Fields -->
                <template v-if="role==='student'">
                    <div class="row mb-3">
                        <div class="col-6">
                            <label class="form-label">Full Name</label>
                            <input v-model="name" type="text" class="form-control" required>
                        </div>
                        <div class="col-6">
                            <label class="form-label">Roll Number</label>
                            <input v-model="roll_number" type="text" class="form-control" required>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-4">
                            <label class="form-label">Branch</label>
                            <select v-model="branch" class="form-select" required>
                                <option value="">Select</option>
                                <option v-for="b in ['CSE','ECE','ME','CE','EE']" :value="b">{{ b }}</option>
                            </select>
                        </div>
                        <div class="col-4">
                            <label class="form-label">CGPA</label>
                            <input v-model="cgpa" type="number" step="0.01" min="0" max="10" class="form-control">
                        </div>
                        <div class="col-4">
                            <label class="form-label">Year</label>
                            <select v-model="year" class="form-select">
                                <option v-for="y in [1,2,3,4]" :value="y">{{ y }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Phone</label>
                        <input v-model="phone" type="tel" class="form-control">
                    </div>
                </template>

                <!-- Company Fields -->
                <template v-if="role==='company'">
                    <div class="mb-3">
                        <label class="form-label">Company Name</label>
                        <input v-model="company_name" type="text" class="form-control" required>
                    </div>
                    <div class="row mb-3">
                        <div class="col-6">
                            <label class="form-label">HR Contact Person</label>
                            <input v-model="hr_contact" type="text" class="form-control">
                        </div>
                        <div class="col-6">
                            <label class="form-label">HR Email</label>
                            <input v-model="hr_email" type="email" class="form-control">
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-6">
                            <label class="form-label">Website</label>
                            <input v-model="website" type="url" class="form-control" placeholder="https://">
                        </div>
                        <div class="col-6">
                            <label class="form-label">Industry</label>
                            <input v-model="industry" type="text" class="form-control" placeholder="e.g. IT, Finance">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea v-model="description" class="form-control" rows="2"></textarea>
                    </div>
                </template>

                <button type="submit" class="btn btn-ppa w-100 py-2" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ loading ? 'Creating...' : 'Create Account' }}
                </button>
            </form>
            <p class="text-center mt-3 mb-0" style="font-size:0.9rem">
                Already have an account? <router-link to="/login" style="color:var(--ppa-primary);font-weight:600">Sign In</router-link>
            </p>
        </div>
    </div>
    `
};
