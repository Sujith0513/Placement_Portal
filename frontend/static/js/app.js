// ══════════════════════════════════════════════════════════
// Placement Portal Application - Main Vue App
// ══════════════════════════════════════════════════════════

const { createApp, ref, computed, onMounted } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// ─── Routes ─────────────────────────────────────────────
const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginComponent, meta: { guest: true } },
    { path: '/register', component: RegisterComponent, meta: { guest: true } },
    // Admin
    { path: '/admin/dashboard', component: AdminDashboard, meta: { role: 'admin' } },
    { path: '/admin/companies', component: AdminCompanies, meta: { role: 'admin' } },
    { path: '/admin/students', component: AdminStudents, meta: { role: 'admin' } },
    { path: '/admin/drives', component: AdminDrives, meta: { role: 'admin' } },
    { path: '/admin/applications', component: AdminApplications, meta: { role: 'admin' } },
    { path: '/admin/reports', component: AdminReports, meta: { role: 'admin' } },
    // Company
    { path: '/company/dashboard', component: CompanyDashboard, meta: { role: 'company' } },
    { path: '/company/drives', component: CompanyDrives, meta: { role: 'company' } },
    { path: '/company/applications/:driveId', component: CompanyApplications, meta: { role: 'company' } },
    { path: '/company/interviews', component: CompanyInterviews, meta: { role: 'company' } },
    // Student
    { path: '/student/dashboard', component: StudentDashboard, meta: { role: 'student' } },
    { path: '/student/applications', component: StudentApplications, meta: { role: 'student' } },
    { path: '/student/profile', component: StudentProfile, meta: { role: 'student' } },
    { path: '/student/history', component: StudentHistory, meta: { role: 'student' } },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

// ─── Navigation Guard ───────────────────────────────────
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('ppa_token');
    const user = JSON.parse(localStorage.getItem('ppa_user') || 'null');

    if (to.meta.guest) {
        if (token && user) {
            return next(getHomePath(user.role));
        }
        return next();
    }

    if (!token) return next('/login');

    if (to.meta.role && (!user || user.role !== to.meta.role)) {
        return next(getHomePath(user?.role));
    }

    next();
});

function getHomePath(role) {
    switch (role) {
        case 'admin': return '/admin/dashboard';
        case 'company': return '/company/dashboard';
        case 'student': return '/student/dashboard';
        default: return '/login';
    }
}

// ─── App ────────────────────────────────────────────────
const app = createApp({
    data() {
        return {
            currentUser: JSON.parse(localStorage.getItem('ppa_user') || 'null'),
            token: localStorage.getItem('ppa_token') || '',
            toast: { message: '', type: 'success' }
        };
    },
    computed: {
        isLoggedIn() { return !!this.token && !!this.currentUser; }
    },
    methods: {
        authHeader() {
            return this.token ? { Authorization: 'Bearer ' + this.token } : {};
        },
        onLoginSuccess(data) {
            this.token = data.access_token;
            this.currentUser = data.user;
            localStorage.setItem('ppa_token', data.access_token);
            localStorage.setItem('ppa_user', JSON.stringify(data.user));
            this.$router.push(getHomePath(data.user.role));
        },
        logout() {
            this.token = '';
            this.currentUser = null;
            localStorage.removeItem('ppa_token');
            localStorage.removeItem('ppa_user');
            this.$router.push('/login');
        },
        showToast(message, type = 'success') {
            this.toast = { message, type };
            this.$nextTick(() => {
                const el = document.getElementById('appToast');
                if (el) {
                    const t = new bootstrap.Toast(el, { delay: 3000 });
                    t.show();
                }
            });
        }
    }
});

// Register components
app.component('navbar-component', NavbarComponent);

app.use(router);
app.mount('#app');
