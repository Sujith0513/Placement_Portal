// ══════════════════════════════════════════════════════════
// Navbar Component
// ══════════════════════════════════════════════════════════

const NavbarComponent = {
    name: 'NavbarComponent',
    props: ['user'],
    emits: ['logout'],
    template: `
    <nav class="navbar navbar-expand-lg ppa-navbar">
        <div class="container-fluid px-4">
            <router-link class="navbar-brand" to="/">
                <i class="bi bi-mortarboard-fill"></i> PlaceHub
            </router-link>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu"
                    style="border-color:rgba(255,255,255,0.2)">
                <i class="bi bi-list" style="color:white;font-size:1.5rem"></i>
            </button>
            <div class="collapse navbar-collapse" id="navMenu">
                <!-- Admin Nav -->
                <ul class="navbar-nav me-auto" v-if="user && user.role === 'admin'">
                    <li class="nav-item"><router-link class="nav-link" to="/admin/dashboard"><i class="bi bi-speedometer2"></i> Dashboard</router-link></li>
                    <li class="nav-item"><router-link class="nav-link" to="/admin/companies"><i class="bi bi-building"></i> Companies</router-link></li>
                    <li class="nav-item"><router-link class="nav-link" to="/admin/students"><i class="bi bi-people"></i> Students</router-link></li>
                    <li class="nav-item"><router-link class="nav-link" to="/admin/drives"><i class="bi bi-briefcase"></i> Drives</router-link></li>
                    <li class="nav-item"><router-link class="nav-link" to="/admin/applications"><i class="bi bi-file-earmark-text"></i> Applications</router-link></li>
                    <li class="nav-item"><router-link class="nav-link" to="/admin/reports"><i class="bi bi-bar-chart-line"></i> Reports</router-link></li>
                </ul>
                <!-- Company Nav -->
                <ul class="navbar-nav me-auto" v-if="user && user.role === 'company'">
                    <li class="nav-item"><router-link class="nav-link" to="/company/dashboard"><i class="bi bi-speedometer2"></i> Dashboard</router-link></li>
                    <li class="nav-item"><router-link class="nav-link" to="/company/drives"><i class="bi bi-briefcase"></i> My Drives</router-link></li>
                    <li class="nav-item"><router-link class="nav-link" to="/company/interviews"><i class="bi bi-calendar-event"></i> Interviews</router-link></li>
                </ul>
                <!-- Student Nav -->
                <ul class="navbar-nav me-auto" v-if="user && user.role === 'student'">
                    <li class="nav-item"><router-link class="nav-link" to="/student/dashboard"><i class="bi bi-speedometer2"></i> Drives</router-link></li>
                    <li class="nav-item"><router-link class="nav-link" to="/student/applications"><i class="bi bi-file-earmark-text"></i> Applications</router-link></li>
                    <li class="nav-item"><router-link class="nav-link" to="/student/history"><i class="bi bi-clock-history"></i> History</router-link></li>
                    <li class="nav-item"><router-link class="nav-link" to="/student/profile"><i class="bi bi-person"></i> Profile</router-link></li>
                </ul>
                <!-- Right side -->
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <span class="nav-link" style="cursor:default">
                            <i class="bi bi-person-circle"></i> {{ user ? user.email : '' }}
                            <span class="badge bg-light text-dark ms-1" style="font-size:0.7rem">{{ user ? user.role : '' }}</span>
                        </span>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" @click.prevent="$emit('logout')"><i class="bi bi-box-arrow-right"></i> Logout</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    `
};
