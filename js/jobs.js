// ===== JOBS PAGE LOGIC =====
// Data now loaded from the backend API via api.js

let currentView = 'grid';
let currentPage = 1;
const JOBS_PER_PAGE = 6;
let filteredJobs = [];
let allJobs = [];        // Full dataset from API
let activeTypeFilter = '';
let apiLoaded = false;
let appliedJobIds = new Set();  // track applied jobs for badge display

// Debounce helper
function debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

document.addEventListener('DOMContentLoaded', async () => {
    // Read URL params
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const loc = params.get('loc') || '';
    const cat = params.get('category') || '';

    if (q) document.getElementById('jobSearch').value = q;
    if (loc) document.getElementById('locationSearch').value = loc;
    if (cat) {
        const radio = document.querySelector(`input[name="cat"][value="${cat}"]`);
        if (radio) radio.checked = true;
    }

    // Show loading skeleton
    showLoadingSkeleton();

    // Try to load from API, fall back to local JOBS array
    try {
        const data = await Jobs.getAll();
        allJobs = data.jobs.map(j => ({
            ...j,
            postedDays: j.posted_days,     // normalize field name
            logoText:   j.logo_text        // normalize field name
        }));
        apiLoaded = true;
    } catch (err) {
        console.warn('API unavailable, using local data:', err.message);
        allJobs = typeof JOBS !== 'undefined' ? [...JOBS] : [];
    }

    filteredJobs = [...allJobs];
    applyFilters();

    // Load applied jobs so we can show badges
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
        Applications.getMyApplications().then(d => {
            (d.applications || []).forEach(a => appliedJobIds.add(a.job_id));
            markAppliedCards();
        }).catch(() => {});
    }

    // Debounced real-time search
    const debouncedSearch = debounce(() => { currentPage = 1; applyFilters(); }, 400);
    document.getElementById('jobSearch').addEventListener('input', debouncedSearch);
    document.getElementById('locationSearch').addEventListener('input', debouncedSearch);

    // Enter key search
    document.getElementById('jobSearch').addEventListener('keydown', e => { if (e.key === 'Enter') searchJobs(); });
    document.getElementById('locationSearch').addEventListener('keydown', e => { if (e.key === 'Enter') searchJobs(); });
});

function showLoadingSkeleton() {
    const grid = document.getElementById('jobsGrid');
    if (!grid) return;
    grid.innerHTML = Array(6).fill(0).map(() => `
        <div class="job-card" style="animation: pulse 1.5s infinite">
            <div style="height:20px;background:rgba(255,255,255,0.06);border-radius:8px;margin-bottom:12px;"></div>
            <div style="height:14px;background:rgba(255,255,255,0.04);border-radius:6px;margin-bottom:8px;width:60%;"></div>
            <div style="height:12px;background:rgba(255,255,255,0.04);border-radius:6px;margin-bottom:16px;width:40%;"></div>
            <div style="height:36px;background:rgba(255,255,255,0.06);border-radius:10px;"></div>
        </div>
    `).join('');
}

function searchJobs() {
    currentPage = 1;
    applyFilters();
    // Animate button
    const btn = document.getElementById('searchBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Searching...</span>';
    setTimeout(() => { btn.innerHTML = '<i class="fas fa-search"></i><span>Search</span>'; }, 800);
}

function clearSearch() {
    document.getElementById('jobSearch').value = '';
    document.getElementById('locationSearch').value = '';
    currentPage = 1;
    applyFilters();
}

function updateFilterTags(type, remote, isNewActive) {
    document.querySelectorAll('.filter-tag').forEach(t => {
        const filterVal = t.dataset.filter;
        if (filterVal === 'new') {
            t.classList.toggle('active', !!isNewActive);
        } else if (filterVal === 'remote') {
            t.classList.toggle('active', remote === '1');
        } else {
            t.classList.toggle('active', type === filterVal);
        }
    });
}

function applyFilters() {
    const q = document.getElementById('jobSearch')?.value.toLowerCase() || '';
    const loc = document.getElementById('locationSearch')?.value.toLowerCase() || '';
    const cat = document.querySelector('input[name="cat"]:checked')?.value || '';
    const type = document.querySelector('input[name="type"]:checked')?.value || '';
    const remote = document.querySelector('input[name="remote"]:checked')?.value || '';
    const minSalary = parseInt(document.getElementById('salaryRange')?.value || 40);
    const sort = document.getElementById('sortBy')?.value || 'newest';
    const isNewActive = document.querySelector('.filter-tag[data-filter="new"]')?.classList.contains('active');

    filteredJobs = allJobs.filter(j => {
        const skills = Array.isArray(j.skills) ? j.skills : [];
        const matchQ = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || skills.some(s => s.toLowerCase().includes(q));
        const matchLoc = !loc || j.location.toLowerCase().includes(loc);
        const matchCat = !cat || j.category === cat;
        const matchType = !type || j.type === type;
        const matchRemote = remote === '' ? true : (remote === '1' ? (j.remote === true || j.remote === 1) : !(j.remote === true || j.remote === 1));
        
        // Handle "Competitive" salary string
        const isCompetitive = j.salary.toLowerCase().includes('competitive');
        const salNum = isCompetitive ? 0 : parseInt((j.salary.match(/\$(\d+)k/) || [0, 0])[1]);
        const matchSalary = isCompetitive || salNum >= minSalary || minSalary <= 40;

        // Composed "New (24h)" filter
        const matchNew = !isNewActive || (j.postedDays ?? j.posted_days ?? 99) <= 1;

        return matchQ && matchLoc && matchCat && matchType && matchRemote && matchSalary && matchNew;
    });

    // Synchronize tag button highlighting with sidebar selections
    updateFilterTags(type, remote, isNewActive);

    // Sort
    const postedKey = j => j.postedDays ?? j.posted_days ?? 0;
    if (sort === 'newest') filteredJobs.sort((a,b) => postedKey(a) - postedKey(b));
    else if (sort === 'salary-high') filteredJobs.sort((a,b) => {
        const sa = parseInt((b.salary.match(/\$(\d+)k/) || [0,0])[1]);
        const sb = parseInt((a.salary.match(/\$(\d+)k/) || [0,0])[1]);
        return sa - sb;
    });
    else if (sort === 'salary-low') filteredJobs.sort((a,b) => {
        const sa = parseInt((a.salary.match(/\$(\d+)k/) || [0,0])[1]);
        const sb = parseInt((b.salary.match(/\$(\d+)k/) || [0,0])[1]);
        return sa - sb;
    });
    else if (sort === 'featured') filteredJobs.sort((a,b) => (b.featured||0) - (a.featured||0));

    currentPage = 1;
    renderJobs();
}

function renderJobs() {
    const grid = document.getElementById('jobsGrid');
    const noResults = document.getElementById('noResults');
    const countEl = document.getElementById('resultsCount');

    if (countEl) countEl.textContent = filteredJobs.length;

    const start = (currentPage - 1) * JOBS_PER_PAGE;
    const paginated = filteredJobs.slice(start, start + JOBS_PER_PAGE);

    if (paginated.length === 0) {
        grid.innerHTML = '';
        noResults.classList.remove('hidden');
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    noResults.classList.add('hidden');
    grid.innerHTML = paginated.map((j, i) => {
        const card = renderJobCard(j);
        return card;
    }).join('');

    // Stagger fade-in
    const cards = grid.querySelectorAll('.job-card');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, i * 80);
    });

    renderPagination();

    // Apply saved state from API or localStorage fallback
    if (apiLoaded && typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
        Applications.getMySaved().then(data => {
            (data.saved || []).forEach(item => {
                const btn = document.querySelector(`#job-${item.job_id} .save-btn`);
                if (btn) {
                    btn.classList.add('saved');
                    btn.innerHTML = '<i class="fas fa-heart text-sm"></i>';
                    btn.style.color = '#fb923c';
                }
            });
        }).catch(() => {});
    } else {
        const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
        saved.forEach(id => {
            const btn = document.querySelector(`#job-${id} .save-btn`);
            if (btn) {
                btn.classList.add('saved');
                btn.innerHTML = '<i class="fas fa-heart text-sm"></i>';
                btn.style.color = '#fb923c';
            }
        });
    }

    // Mark already-applied jobs
    markAppliedCards();
}

function markAppliedCards() {
    appliedJobIds.forEach(jobId => {
        const applyBtn = document.querySelector(`#job-${jobId} .apply-btn`);
        if (applyBtn && !applyBtn.classList.contains('applied')) {
            applyBtn.classList.add('applied');
            applyBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Applied';
            applyBtn.disabled = true;
            applyBtn.style.cssText = 'flex:1;margin:0;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#4ade80;cursor:not-allowed;opacity:0.85';
        }
    });
}

function renderPagination() {
    const total = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
    const pag = document.getElementById('pagination');
    if (!pag || total <= 1) { if(pag) pag.innerHTML=''; return; }

    let html = `<button onclick="changePage(${Math.max(1,currentPage-1)})" class="page-btn" ${currentPage===1?'disabled style="opacity:0.4"':''}><i class="fas fa-chevron-left text-xs"></i></button>`;
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button onclick="changePage(${i})" class="page-btn ${i===currentPage?'active':''}">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="text-gray-600 px-1">...</span>`;
        }
    }
    html += `<button onclick="changePage(${Math.min(total,currentPage+1)})" class="page-btn" ${currentPage===total?'disabled style="opacity:0.4"':''}><i class="fas fa-chevron-right text-xs"></i></button>`;
    pag.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderJobs();
    window.scrollTo({ top: 300, behavior: 'smooth' });
}

function setView(v) {
    currentView = v;
    const grid = document.getElementById('jobsGrid');
    const gridBtn = document.getElementById('gridViewBtn');
    const listBtn = document.getElementById('listViewBtn');
    if (v === 'grid') {
        grid.className = 'grid grid-cols-1 xl:grid-cols-2 gap-5 mb-10';
        gridBtn.className = 'p-2 rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30 transition-all';
        listBtn.className = 'p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10';
    } else {
        grid.className = 'grid grid-cols-1 gap-4 mb-10';
        listBtn.className = 'p-2 rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30 transition-all';
        gridBtn.className = 'p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10';
    }
}

function setTypeFilter(type) {
    const radio = document.querySelector(`input[name="type"][value="${type}"]`);
    if (radio) {
        if (radio.checked) {
            const allRadio = document.querySelector('input[name="type"][value=""]');
            if (allRadio) allRadio.checked = true;
        } else {
            radio.checked = true;
        }
        applyFilters();
    }
}

function setRemoteFilter() {
    const radio = document.querySelector('input[name="remote"][value="1"]');
    if (radio) {
        if (radio.checked) {
            const allRadio = document.querySelector('input[name="remote"][value=""]');
            if (allRadio) allRadio.checked = true;
        } else {
            radio.checked = true;
        }
        applyFilters();
    }
}

function setNewFilter() {
    const tag = document.querySelector('.filter-tag[data-filter="new"]');
    if (tag) {
        tag.classList.toggle('active');
        applyFilters();
    }
}

function resetFilters() {
    document.getElementById('jobSearch').value = '';
    document.getElementById('locationSearch').value = '';
    document.querySelectorAll('input[type="radio"]').forEach(r => { if (r.value === '') r.checked = true; });
    const sr = document.getElementById('salaryRange');
    if (sr) { sr.value = 40; updateSalaryDisplay(40); }
    document.getElementById('sortBy').value = 'newest';
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    currentPage = 1;
    applyFilters();
}

function updateSalaryDisplay(val) {
    const el = document.getElementById('salaryValue');
    if (el) el.textContent = `$${val}k+`;
}

function toggleFilterSidebar() {
    document.getElementById('filterSidebar').classList.toggle('open');
}
