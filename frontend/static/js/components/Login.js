const LoginComponent = {
    name: 'LoginComponent',
    emits: ['login-success'],
    data() {
        return { email: '', password: '', error: '', loading: false };
    },
    methods: {
        async login() {
            this.error = '';
            this.loading = true;
            try {
                const res = await axios.post('/api/auth/login', {
                    email: this.email, password: this.password
                });
                this.$emit('login-success', res.data);
            } catch (e) {
                this.error = e.response?.data?.error || 'Login failed';
            } finally {
                this.loading = false;
            }
        }
    },
    template: `
    <div class="auth-wrapper">
        <div class="auth-card">
            <div class="text-center mb-3">
                <i class="bi bi-mortarboard-fill" style="font-size:2.5rem;background:linear-gradient(135deg,#4361ee,#7209b7);-webkit-background-clip:text;-webkit-text-fill-color:transparent"></i>
            </div>
            <h2 class="text-center">Welcome Back</h2>
            <p class="subtitle text-center">Sign in to the Placement Portal</p>
            <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
            <form @submit.prevent="login">
                <div class="mb-3">
                    <label class="form-label">Email Address</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                        <input v-model="email" type="email" class="form-control" placeholder="you@example.com" required>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="form-label">Password</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-lock"></i></span>
                        <input v-model="password" type="password" class="form-control" placeholder="Enter password" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-ppa w-100 py-2" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ loading ? 'Signing in...' : 'Sign In' }}
                </button>
            </form>
            <p class="text-center mt-3 mb-0" style="font-size:0.9rem">
                Don't have an account? <router-link to="/register" style="color:var(--ppa-primary);font-weight:600">Register</router-link>
            </p>
        </div>
    </div>
    `
};