const express = require('express');
const { db } = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/applications
router.get('/', async (req, res) => {
  try {
    const applications = await db('applications as a')
      .join('jobs as j', 'a.job_id', 'j.id')
      .where('a.user_id', req.user.id)
      .select('a.id', 'a.status', 'a.applied_at', 'j.id as job_id', 'j.title', 'j.company', 'j.location', 'j.salary', 'j.type', 'j.logo', 'j.logo_text', 'j.category')
      .orderBy('a.applied_at', 'desc');
    return res.json({ success: true, count: applications.length, applications });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/applications
router.post('/', async (req, res) => {
  try {
    const { job_id } = req.body;
    if (!job_id) return res.status(400).json({ success: false, message: 'job_id is required.' });
    const job = await db('jobs').where({ id: job_id }).select('id', 'title', 'company').first();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    const existing = await db('applications').where({ user_id: req.user.id, job_id }).first();
    if (existing) return res.status(409).json({ success: false, message: 'You have already applied for this job.' });
    await db('applications').insert({ user_id: req.user.id, job_id });
    return res.status(201).json({ success: true, message: `Application submitted for "${job.title}" at ${job.company}!` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/applications/saved
router.get('/saved', async (req, res) => {
  try {
    const saved = await db('saved_jobs as s')
      .join('jobs as j', 's.job_id', 'j.id')
      .where('s.user_id', req.user.id)
      .select('s.id', 's.saved_at', 'j.id as job_id', 'j.title', 'j.company', 'j.location', 'j.salary', 'j.type', 'j.remote', 'j.logo', 'j.logo_text', 'j.category', 'j.posted_days', 'j.featured', 'j.skills')
      .orderBy('s.saved_at', 'desc');
    const parsed = saved.map(j => ({ ...j, skills: j.skills ? JSON.parse(j.skills) : [], remote: Boolean(j.remote) }));
    return res.json({ success: true, count: parsed.length, saved: parsed });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/applications/saved
router.post('/saved', async (req, res) => {
  try {
    const { job_id } = req.body;
    if (!job_id) return res.status(400).json({ success: false, message: 'job_id is required.' });
    const existing = await db('saved_jobs').where({ user_id: req.user.id, job_id }).first();
    if (existing) {
      await db('saved_jobs').where({ user_id: req.user.id, job_id }).delete();
      return res.json({ success: true, saved: false, message: 'Job removed from saved.' });
    }
    await db('saved_jobs').insert({ user_id: req.user.id, job_id });
    return res.status(201).json({ success: true, saved: true, message: 'Job saved successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/applications/:id/status  (employer updates status)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'reviewed', 'interview', 'rejected', 'offered'];
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: `Status must be one of: ${valid.join(', ')}` });

    // Verify the application belongs to a job posted by this user (employer)
    const app = await db('applications as a')
      .join('jobs as j', 'a.job_id', 'j.id')
      .where('a.id', req.params.id)
      .select('a.id', 'j.company').first();

    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    await db('applications').where({ id: req.params.id }).update({ status });
    return res.json({ success: true, message: `Status updated to "${status}".` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/applications/employer — all applicants for this employer's jobs
router.get('/employer', async (req, res) => {
  try {
    if (req.user.role !== 'employer' && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Employers only.' });

    const userInfo = await db('users').where({ id: req.user.id }).select('company_name', 'name').first();
    const company = userInfo.company_name || userInfo.name;

    const applicants = await db('applications as a')
      .join('jobs as j', 'a.job_id', 'j.id')
      .join('users as u', 'a.user_id', 'u.id')
      .where('j.company', company)
      .select(
        'a.id', 'a.status', 'a.applied_at',
        'j.id as job_id', 'j.title as job_title',
        'u.id as user_id', 'u.name as applicant_name', 'u.email as applicant_email',
        'u.job_title as applicant_role', 'u.skills as applicant_skills'
      )
      .orderBy('a.applied_at', 'desc');

    const parsed = applicants.map(a => ({
      ...a,
      applicant_skills: a.applicant_skills ? JSON.parse(a.applicant_skills) : []
    }));

    return res.json({ success: true, count: parsed.length, applicants: parsed });
  } catch (err) {
    console.error('[Employer Applicants Error]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
