const express = require('express');
const { db } = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { q, loc, category, type, remote, featured, all } = req.query;
    let query = db('jobs');

    let isAdmin = false;
    if (all === 'true') {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
          if (decoded.role === 'admin') isAdmin = true;
        } catch (e) {}
      }
    }

    if (!isAdmin) {
      query = query.where({ status: 'active' });
    }

    if (q) {
      query = query.where(function () {
        this.where('title', 'like', `%${q}%`)
            .orWhere('company', 'like', `%${q}%`)
            .orWhere('description', 'like', `%${q}%`);
      });
    }
    if (loc)      query = query.where('location', 'like', `%${loc}%`);
    if (category) query = query.where({ category });
    if (type)     query = query.where({ type });
    if (remote === 'true' || remote === '1') query = query.where({ remote: 1 });
    if (featured === 'true' || featured === '1') query = query.where({ featured: 1 });

    const jobs = await query.orderBy([{ column: 'featured', order: 'desc' }, { column: 'posted_days', order: 'asc' }]);

    const parsed = jobs.map(j => ({
      ...j,
      skills: j.skills ? JSON.parse(j.skills) : [],
      remote: Boolean(j.remote)
    }));

    return res.json({ success: true, count: parsed.length, jobs: parsed });
  } catch (err) {
    console.error('[Jobs List Error]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/jobs/my-jobs (Employer's own posted jobs) ─────────────────────
router.get('/my-jobs', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'employer' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Employers only.' });
    }
    const jobs = await db('jobs').where({ employer_id: req.user.id }).orderBy('created_at', 'desc');

    const jobsWithCount = await Promise.all(jobs.map(async j => {
      const [{ count }] = await db('applications').where({ job_id: j.id }).count('id as count');
      return {
        ...j,
        skills: j.skills ? JSON.parse(j.skills) : [],
        remote: Boolean(j.remote),
        applicants_count: count
      };
    }));

    return res.json({ success: true, count: jobsWithCount.length, jobs: jobsWithCount });
  } catch (err) {
    console.error('[My Jobs Error]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const job = await db('jobs').where({ id: req.params.id }).first();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    // Optional auth check to see if the requester is the owner (employer) of this job or admin
    let isOwnerOrAdmin = false;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'admin' || decoded.id === job.employer_id) {
          isOwnerOrAdmin = true;
        }
      } catch (e) {}
    }

    const jobData = {
      ...job,
      skills: job.skills ? JSON.parse(job.skills) : [],
      remote: Boolean(job.remote)
    };

    if (isOwnerOrAdmin) {
      const [{ count }] = await db('applications').where({ job_id: job.id }).count('id as count');
      jobData.applicants_count = count;
    }

    return res.json({ success: true, job: jobData });
  } catch (err) {
    console.error('[Get Job Detail Error]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── POST /api/jobs (Employer posts a job) ───────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'employer' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only employers can post jobs.' });
    }
    const { title, description, location, type, salary, remote, category, skills } = req.body;
    if (!title || !description || !location || !type) {
      return res.status(400).json({ success: false, message: 'Title, description, location and type are required.' });
    }

    // Get company name from user profile
    const user = await db('users').where({ id: req.user.id }).select('company_name', 'name').first();
    const company = user.company_name || user.name;

    const [id] = await db('jobs').insert({
      employer_id: req.user.id,
      title: title.trim(),
      company,
      description: description.trim(),
      location: location.trim(),
      type,
      salary: salary || 'Competitive',
      remote: remote ? 1 : 0,
      category: category || 'Technology',
      skills: Array.isArray(skills) ? JSON.stringify(skills) : JSON.stringify(skills ? skills.split(',').map(s => s.trim()) : []),
      logo: '#6366f1',
      logo_text: company.slice(0, 2).toUpperCase(),
      posted_days: 0,
      featured: 0,
      status: 'active'
    });

    return res.status(201).json({ success: true, message: `Job "${title}" posted successfully!`, id });
  } catch (err) {
    console.error('[Post Job Error]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── DELETE /api/jobs/:id (Admin or Job Owner deletes job listing) ───────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await db('jobs').where({ id: req.params.id }).first();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    if (req.user.role !== 'admin' && job.employer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this job listing.' });
    }

    await db('jobs').where({ id: req.params.id }).delete();
    return res.json({ success: true, message: 'Job listing deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PATCH /api/jobs/:id/status (Admin updates job status/moderation) ───────
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    const { status } = req.body;
    const valid = ['active', 'paused', 'expired'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${valid.join(', ')}` });
    }

    const updated = await db('jobs').where({ id: req.params.id }).update({ status });
    if (!updated) return res.status(404).json({ success: false, message: 'Job not found.' });

    return res.json({ success: true, message: `Job status updated to "${status}".` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
