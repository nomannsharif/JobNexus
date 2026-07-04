const express = require('express');
const { db } = require('../database/db');

const router = express.Router();

// ─── GET /api/companies ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { industry, q } = req.query;
    let query = db('companies');
    if (q)        query = query.where(function() { this.where('name', 'like', `%${q}%`).orWhere('description', 'like', `%${q}%`); });
    if (industry) query = query.where({ industry });
    const companies = await query.orderBy('rating', 'desc');
    return res.json({ success: true, count: companies.length, companies });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/companies/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const company = await db('companies').where({ id: req.params.id }).first();
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
    const jobs = await db('jobs').whereILike('company', company.name).orderBy('posted_days', 'asc').limit(10);
    return res.json({
      success: true, company,
      jobs: jobs.map(j => ({ ...j, skills: j.skills ? JSON.parse(j.skills) : [], remote: Boolean(j.remote) }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
