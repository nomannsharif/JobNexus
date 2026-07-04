// ===== MAIN.JS: Global utilities and shared logic =====

// === Navbar scroll behavior ===
const navbar = document.getElementById('navbar');
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (navbar) {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    }
    if (backToTop) {
        if (window.scrollY > 400) backToTop.classList.add('visible');
        else backToTop.classList.remove('visible');
    }
    revealOnScroll();
});

// === Mobile Menu Toggle ===
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    const icon = document.getElementById('menuIcon');
    if (!menu) return;
    menu.classList.toggle('hidden');
    if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    }
}

// === Back to Top ===
if (backToTop) {
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// === Toast Notification ===
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.classList.add('show');

    if (toastIcon) {
        if (type === 'success') {
            toastIcon.className = 'w-8 h-8 rounded-full flex items-center justify-center bg-green-500/20';
            toastIcon.innerHTML = '<i class="fas fa-check text-green-400 text-sm"></i>';
        } else if (type === 'error') {
            toastIcon.className = 'w-8 h-8 rounded-full flex items-center justify-center bg-red-500/20';
            toastIcon.innerHTML = '<i class="fas fa-times text-red-400 text-sm"></i>';
        } else if (type === 'info') {
            toastIcon.className = 'w-8 h-8 rounded-full flex items-center justify-center bg-primary-500/20';
            toastIcon.innerHTML = '<i class="fas fa-info text-primary-400 text-sm"></i>';
        }
    }
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// === Scroll Reveal ===
function revealOnScroll() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    reveals.forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 80) el.classList.add('visible');
    });
}
window.addEventListener('load', revealOnScroll);

// === Animated Counter ===
function animateCounter(el, target, suffix = '') {
    let start = 0;
    const duration = 2000;
    const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const value = Math.floor(progress * target);
        el.textContent = value.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString() + suffix;
    };
    requestAnimationFrame(step);
}

function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.animated) {
                entry.target.animated = true;
                const target = parseInt(entry.target.dataset.count);
                const suffix = entry.target.dataset.suffix || '';
                animateCounter(entry.target, target, suffix);
            }
        });
    }, { threshold: 0.3 });
    counters.forEach(c => observer.observe(c));
}

// === Job Data Store ===
const JOBS = [
    { id: 1, title: 'Senior Frontend Developer', company: 'TechCorp Inc.', location: 'San Francisco, CA', salary: '$120k–$150k', type: 'Full-time', remote: true, category: 'Technology', logo: '#6366f1', logoText: 'TC', postedDays: 1, featured: true, description: 'Build stunning web applications using React, TypeScript, and modern CSS frameworks. Work with a cross-functional team to deliver exceptional user experiences.', skills: ['React', 'TypeScript', 'Node.js', 'CSS/Tailwind'] },
    { id: 2, title: 'UX/UI Designer', company: 'DesignStudio', location: 'New York, NY', salary: '$95k–$120k', type: 'Full-time', remote: false, category: 'Design', logo: '#a855f7', logoText: 'DS', postedDays: 2, featured: true, description: 'Create intuitive and visually stunning interfaces for enterprise-level products.', skills: ['Figma', 'Adobe XD', 'Prototyping', 'UX Research'] },
    { id: 3, title: 'Data Scientist', company: 'DataMind AI', location: 'Remote', salary: '$130k–$175k', type: 'Full-time', remote: true, category: 'Technology', logo: '#22c55e', logoText: 'DM', postedDays: 3, featured: true, description: 'Build and deploy ML models, analyze large datasets, and extract actionable business insights.', skills: ['Python', 'TensorFlow', 'SQL', 'Statistics'] },
    { id: 4, title: 'Product Manager', company: 'Innovate Labs', location: 'Austin, TX', salary: '$110k–$140k', type: 'Full-time', remote: false, category: 'Sales', logo: '#f97316', logoText: 'IL', postedDays: 5, featured: false, description: 'Lead product vision and strategy, working closely with engineering and design teams.', skills: ['Roadmapping', 'Agile', 'Analytics', 'Communication'] },
    { id: 5, title: 'Marketing Manager', company: 'GrowthHub', location: 'Chicago, IL', salary: '$80k–$100k', type: 'Full-time', remote: false, category: 'Marketing', logo: '#ec4899', logoText: 'GH', postedDays: 4, featured: false, description: 'Drive digital marketing campaigns and growth strategies across multiple channels.', skills: ['SEO', 'Google Ads', 'Analytics', 'Content Strategy'] },
    { id: 6, title: 'Backend Engineer', company: 'CloudBase', location: 'Seattle, WA', salary: '$125k–$160k', type: 'Full-time', remote: true, category: 'Technology', logo: '#06b6d4', logoText: 'CB', postedDays: 2, featured: true, description: 'Design and scale cloud-native backend services using Node.js, Python, and AWS.', skills: ['Node.js', 'AWS', 'PostgreSQL', 'Docker'] },
    { id: 7, title: 'Financial Analyst', company: 'CapitalWave', location: 'Boston, MA', salary: '$85k–$110k', type: 'Full-time', remote: false, category: 'Finance', logo: '#10b981', logoText: 'CW', postedDays: 7, featured: false, description: 'Analyze financial data, prepare reports, and support investment decision-making.', skills: ['Excel', 'Financial Modeling', 'Python', 'Bloomberg'] },
    { id: 8, title: 'DevOps Engineer', company: 'InfraCore', location: 'Remote', salary: '$115k–$145k', type: 'Contract', remote: true, category: 'Technology', logo: '#8b5cf6', logoText: 'IC', postedDays: 1, featured: false, description: 'Manage CI/CD pipelines, containerize applications, and improve developer workflows.', skills: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform'] },
    { id: 9, title: 'Content Strategist', company: 'MediaFlow', location: 'Los Angeles, CA', salary: '$70k–$90k', type: 'Part-time', remote: false, category: 'Marketing', logo: '#f43f5e', logoText: 'MF', postedDays: 6, featured: false, description: 'Develop and execute content strategies that drive brand awareness and engagement.', skills: ['Copywriting', 'SEO', 'Social Media', 'Analytics'] },
    { id: 10, title: 'Mobile Developer (iOS)', company: 'AppSphere', location: 'San Jose, CA', salary: '$130k–$165k', type: 'Full-time', remote: true, category: 'Technology', logo: '#6366f1', logoText: 'AS', postedDays: 3, featured: true, description: 'Build world-class iOS applications using Swift and SwiftUI for millions of users.', skills: ['Swift', 'SwiftUI', 'Xcode', 'REST APIs'] },
    { id: 11, title: 'Mechanical Engineer', company: 'BuildTech', location: 'Houston, TX', salary: '$90k–$115k', type: 'Full-time', remote: false, category: 'Engineering', logo: '#f97316', logoText: 'BT', postedDays: 8, featured: false, description: 'Design and optimize mechanical systems for industrial applications.', skills: ['SolidWorks', 'AutoCAD', 'FEA', 'Thermodynamics'] },
    { id: 12, title: 'HR Specialist', company: 'PeopleFirst', location: 'Denver, CO', salary: '$60k–$80k', type: 'Full-time', remote: false, category: 'Sales', logo: '#14b8a6', logoText: 'PF', postedDays: 10, featured: false, description: 'Manage recruitment, employee relations, and HR programs for a growing organization.', skills: ['Recruitment', 'HRIS', 'Labor Law', 'Onboarding'] },
];

const COMPANIES = [
    { id: 1, name: 'TechCorp Inc.', industry: 'Technology', location: 'San Francisco, CA', employees: '1000-5000', logo: '#6366f1', logoText: 'TC', jobs: 24, rating: 4.8, description: 'Leading tech company building next-generation software solutions for enterprise clients worldwide.' },
    { id: 2, name: 'DesignStudio', industry: 'Design & Creative', location: 'New York, NY', employees: '50-200', logo: '#a855f7', logoText: 'DS', jobs: 8, rating: 4.6, description: 'Award-winning design studio specializing in brand identity, UX, and digital product design.' },
    { id: 3, name: 'DataMind AI', industry: 'Artificial Intelligence', location: 'Remote-First', employees: '200-1000', logo: '#22c55e', logoText: 'DM', jobs: 15, rating: 4.9, description: 'AI-first company building intelligent automation tools for the modern workplace.' },
    { id: 4, name: 'CloudBase', industry: 'Cloud Infrastructure', location: 'Seattle, WA', employees: '500-2000', logo: '#06b6d4', logoText: 'CB', jobs: 31, rating: 4.7, description: 'Cloud infrastructure platform trusted by thousands of companies to scale their operations.' },
    { id: 5, name: 'GrowthHub', industry: 'Marketing & Growth', location: 'Chicago, IL', employees: '100-500', logo: '#ec4899', logoText: 'GH', jobs: 12, rating: 4.5, description: 'Data-driven growth agency helping startups and Fortune 500s achieve breakthrough marketing results.' },
    { id: 6, name: 'InfraCore', industry: 'DevOps & Security', location: 'Austin, TX', employees: '50-200', logo: '#8b5cf6', logoText: 'IC', jobs: 9, rating: 4.4, description: 'Building secure, scalable infrastructure tools for the next generation of cloud-native applications.' },
];

// === Type Badge Color ===
function getTypeBadge(type) {
    const map = { 'Full-time': 'badge-full', 'Part-time': 'badge-part', 'Contract': 'badge-contract', 'Remote': 'badge-remote' };
    return map[type] || 'badge-full';
}

// === Render Job Card ===
function renderJobCard(job, small = false) {
    // Normalize field names — API uses snake_case, local JOBS uses camelCase
    const logoText   = job.logoText   || job.logo_text   || '?';
    const postedDays = job.postedDays ?? job.posted_days ?? 0;
    const isRemote   = job.remote === true || job.remote === 1;
    const isFeatured = job.featured === true || job.featured === 1;
    const skills     = Array.isArray(job.skills) ? job.skills : [];
    const daysText   = postedDays === 1 ? '1 day ago' : `${postedDays} days ago`;
    return `
    <div class="job-card reveal ${small ? '' : ''}" id="job-${job.id}">
        <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
                <div class="company-logo" style="background: ${job.logo}20; color: ${job.logo}; border: 1px solid ${job.logo}40; font-size: 14px;">
                    ${logoText}
                </div>
                <div>
                    <div class="text-xs text-gray-500">${job.company}</div>
                    <h3 class="font-semibold text-white text-sm leading-tight">${job.title}</h3>
                </div>
            </div>
            <button onclick="toggleSave(${job.id}, this)" class="save-btn" title="Save job">
                <i class="far fa-heart text-sm"></i>
            </button>
        </div>
        <div class="flex flex-wrap gap-2 mb-3">
            <span class="badge ${getTypeBadge(job.type)}">${job.type}</span>
            ${isRemote ? '<span class="badge badge-remote">Remote</span>' : ''}
            ${postedDays <= 2 ? '<span class="badge badge-new">New</span>' : ''}
            ${isFeatured ? '<span class="badge badge-featured">Featured</span>' : ''}
        </div>
        <div class="space-y-1.5 mb-4">
            <div class="flex items-center gap-2 text-xs text-gray-400"><i class="fas fa-map-marker-alt text-primary-400 w-3"></i>${job.location}</div>
            <div class="flex items-center gap-2 text-xs text-gray-400"><i class="fas fa-dollar-sign text-green-400 w-3"></i>${job.salary}</div>
            <div class="flex items-center gap-2 text-xs text-gray-400"><i class="fas fa-clock text-accent-400 w-3"></i>Posted ${daysText}</div>
        </div>
        <div class="flex flex-wrap gap-1.5 mb-4">
            ${skills.slice(0, 3).map(s => `<span class="px-2 py-1 rounded-lg bg-white/5 text-xs text-gray-400 border border-white/8">${s}</span>`).join('')}
        </div>
        <div class="flex gap-2">
            <button onclick="applyToJob(${job.id})" class="apply-btn" style="flex:1;margin:0">
                <i class="fas fa-paper-plane mr-2"></i>Apply Now
            </button>
            <button onclick="viewJobDetail(${job.id})" class="save-btn px-3">
                <i class="fas fa-eye text-sm"></i>
            </button>
        </div>
    </div>`;
}

// === Toggle Save Job ===
async function toggleSave(jobId, btn) {
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
        // API path
        try {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin text-sm"></i>';
            const data = await Applications.toggleSave(jobId);
            if (data.saved) {
                btn.classList.add('saved');
                btn.innerHTML = '<i class="fas fa-heart text-sm"></i>';
                btn.style.color = '#fb923c';
                showToast('Job saved successfully!', 'success');
            } else {
                btn.classList.remove('saved');
                btn.innerHTML = '<i class="far fa-heart text-sm"></i>';
                btn.style.color = '';
                showToast('Job removed from saved', 'info');
            }
        } catch (err) {
            btn.innerHTML = '<i class="far fa-heart text-sm"></i>';
            showToast(err.message || 'Failed to save job.', 'error');
        }
        return;
    }

    // Fallback: localStorage (guest mode)
    const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    const idx = saved.indexOf(jobId);
    if (idx > -1) {
        saved.splice(idx, 1);
        btn.classList.remove('saved');
        btn.innerHTML = '<i class="far fa-heart text-sm"></i>';
        btn.style.color = '';
        showToast('Job removed from saved', 'info');
    } else {
        saved.push(jobId);
        btn.classList.add('saved');
        btn.innerHTML = '<i class="fas fa-heart text-sm"></i>';
        btn.style.color = '#fb923c';
        showToast('Job saved! Sign in to sync across devices.', 'success');
    }
    localStorage.setItem('savedJobs', JSON.stringify(saved));
}

// === Apply to Job ===
function applyToJob(jobId) {
    window.location.href = `job-detail.html?id=${jobId}&apply=true`;
}

// === View Job Detail ===
function viewJobDetail(jobId) {
    window.location.href = `job-detail.html?id=${jobId}`;
}

// === Hero Search ===
function heroSearch() {
    const q = document.getElementById('heroJobSearch')?.value || '';
    const loc = document.getElementById('heroLocationSearch')?.value || '';
    window.location.href = `jobs.html?q=${encodeURIComponent(q)}&loc=${encodeURIComponent(loc)}`;
}

// === Quick Search Tags ===
function quickSearch(term) {
    window.location.href = `jobs.html?q=${encodeURIComponent(term)}`;
}

// === Filter by Category ===
function filterByCategory(cat) {
    window.location.href = `jobs.html?category=${encodeURIComponent(cat)}`;
}

// === Update Navbar Based on Auth State ===
function updateNavAuth() {
    if (typeof Auth === 'undefined') return;

    const isLoggedIn = Auth.isLoggedIn();
    const user = Auth.getUser();
    if (!isLoggedIn || !user) return;  // nothing to do — keep Sign In / Get Started

    const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const dashHref = user.role === 'employer' ? 'employer-dashboard.html' : 'dashboard.html';

    // Find the nav auth container by looking for the Sign In anchor inside any nav
    const signInLink = document.querySelector('nav a[href="login.html"]');
    if (!signInLink) return;
    const authContainer = signInLink.parentElement;
    if (!authContainer) return;

    authContainer.innerHTML = `
        <a href="${dashHref}" class="flex items-center gap-2 btn-ghost px-4 py-2 rounded-full text-sm font-medium">
            <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#f97316);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff">${initials}</div>
            ${user.name.split(' ')[0]}
        </a>
        <a href="${dashHref}" class="btn-primary px-5 py-2.5 rounded-full text-sm font-semibold">Dashboard</a>
        <button onclick="Auth.logout()" class="btn-outline px-4 py-2.5 rounded-full text-sm font-medium" style="color:#f87171;border-color:rgba(248,113,113,0.3)"><i class="fas fa-sign-out-alt mr-1"></i>Logout</button>
    `;
}

// === Init on load ===
document.addEventListener('DOMContentLoaded', () => {
    initCounters();
    revealOnScroll();
    updateNavAuth(); // ← Update navbar based on login state

    // Add styles for toast visibility
    const style = document.createElement('style');
    style.textContent = '#toast.show { transform: translateY(0) !important; opacity: 1 !important; }';
    document.head.appendChild(style);

    // Keyboard: Enter on hero search
    document.getElementById('heroJobSearch')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') heroSearch();
    });
    document.getElementById('heroLocationSearch')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') heroSearch();
    });
});
