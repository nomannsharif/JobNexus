// ===== HOME PAGE LOGIC — fetches live data from API =====

document.addEventListener('DOMContentLoaded', async () => {
    animateHero();
    await Promise.all([loadFeaturedJobs(), loadLiveStats()]);
});

// ── Featured Jobs (from API, fallback to local) ─────────────────────────────
async function loadFeaturedJobs() {
    const container = document.getElementById('featuredJobs');
    if (!container) return;

    // Show skeletons
    container.innerHTML = Array(3).fill(`
        <div class="job-card" style="opacity:0.5">
            <div style="height:60px;background:rgba(255,255,255,0.05);border-radius:12px;margin-bottom:16px;animation:pulse 1.5s infinite"></div>
            <div style="height:14px;background:rgba(255,255,255,0.05);border-radius:6px;margin-bottom:8px;width:70%;animation:pulse 1.5s infinite 0.1s"></div>
            <div style="height:12px;background:rgba(255,255,255,0.04);border-radius:6px;width:50%;animation:pulse 1.5s infinite 0.2s"></div>
        </div>`).join('');

    try {
        const data = await Jobs.getAll({ featured: 'true' });
        const jobs = (data.jobs || []).slice(0, 6);
        if (!jobs.length) throw new Error('empty');
        container.innerHTML = jobs.map(j => renderJobCard(j)).join('');
    } catch {
        // Fallback to local data
        const featured = typeof JOBS !== 'undefined' ? JOBS.filter(j => j.featured).slice(0, 6) : [];
        container.innerHTML = featured.map(j => renderJobCard(j)).join('');
    }

    // Stagger animation
    const cards = container.querySelectorAll('.job-card');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, i * 100 + 200);
    });
}

// ── Live Stats (real counts from DB) ────────────────────────────────────────
async function loadLiveStats() {
    try {
        const data = await Stats.get();
        const { jobs, companies, users } = data.stats;
        // Update stat counters with real values
        const statEls = document.querySelectorAll('[data-count]');
        if (statEls[0]) statEls[0].dataset.count = jobs;
        if (statEls[1]) statEls[1].dataset.count = companies;
        if (statEls[2]) statEls[2].dataset.count = users;
        // Reinitialize counters with real values
        initCounters();

        // Also update hero text
        const heroCount = document.getElementById('heroJobCount');
        if (heroCount) heroCount.textContent = `${jobs}+`;
    } catch {
        // Live stats unavailable — counters use defaults
    }
}

// ── Hero Particle Animation ──────────────────────────────────────────────────
function animateHero() {
    const hero = document.querySelector('section');
    if (!hero) return;

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(99,102,241,${Math.random() * 0.5 + 0.1});
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation: particleFloat ${Math.random() * 8 + 6}s ease-in-out infinite;
            animation-delay: ${Math.random() * -8}s;
            pointer-events: none;
            z-index: 1;
        `;
        hero.appendChild(particle);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFloat {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
            25% { transform: translateY(-40px) translateX(15px); opacity: 0.8; }
            75% { transform: translateY(20px) translateX(-10px); opacity: 0.2; }
        }
        @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}
