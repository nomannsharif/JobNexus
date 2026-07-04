require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./database/db');

// ─── Import Routes ────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const jobsRoutes         = require('./routes/jobs');
const companiesRoutes    = require('./routes/companies');
const applicationsRoutes = require('./routes/applications');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded resumes / files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/jobs',         jobsRoutes);
app.use('/api/companies',    companiesRoutes);
app.use('/api/applications', applicationsRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'JobNexus API is running 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ─── Live Stats ───────────────────────────────────────────────────────────────
const { db } = require('./database/db');
app.get('/api/stats', async (req, res) => {
  try {
    const [{ jobs }]   = await db('jobs').count('id as jobs');
    const [{ companies }] = await db('companies').count('id as companies');
    const [{ users }]  = await db('users').count('id as users');
    const [{ applications }] = await db('applications').count('id as applications');
    return res.json({ success: true, stats: { jobs, companies, users, applications } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 JobNexus API running at http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize DB:', err);
  process.exit(1);
});
