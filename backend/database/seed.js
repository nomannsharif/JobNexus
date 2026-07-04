/**
 * Seed Script — populates jobs, companies, and a demo user.
 * Run: node database/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcrypt');
const { db, initDB } = require('./db');

const JOBS = [
  { id: 1, title: 'Senior Frontend Developer', company: 'TechCorp Inc.', location: 'San Francisco, CA', salary: '$120k–$150k', type: 'Full-time', remote: 1, category: 'Technology', logo: '#6366f1', logo_text: 'TC', posted_days: 1, featured: 1, description: 'Build stunning web applications using React, TypeScript, and modern CSS frameworks.', skills: JSON.stringify(['React', 'TypeScript', 'Node.js', 'CSS/Tailwind']) },
  { id: 2, title: 'UX/UI Designer', company: 'DesignStudio', location: 'New York, NY', salary: '$95k–$120k', type: 'Full-time', remote: 0, category: 'Design', logo: '#a855f7', logo_text: 'DS', posted_days: 2, featured: 1, description: 'Create intuitive and visually stunning interfaces for enterprise-level products.', skills: JSON.stringify(['Figma', 'Adobe XD', 'Prototyping', 'UX Research']) },
  { id: 3, title: 'Data Scientist', company: 'DataMind AI', location: 'Remote', salary: '$130k–$175k', type: 'Full-time', remote: 1, category: 'Technology', logo: '#22c55e', logo_text: 'DM', posted_days: 3, featured: 1, description: 'Build and deploy ML models, analyze large datasets, and extract actionable business insights.', skills: JSON.stringify(['Python', 'TensorFlow', 'SQL', 'Statistics']) },
  { id: 4, title: 'Product Manager', company: 'Innovate Labs', location: 'Austin, TX', salary: '$110k–$140k', type: 'Full-time', remote: 0, category: 'Sales', logo: '#f97316', logo_text: 'IL', posted_days: 5, featured: 0, description: 'Lead product vision and strategy, working closely with engineering and design teams.', skills: JSON.stringify(['Roadmapping', 'Agile', 'Analytics', 'Communication']) },
  { id: 5, title: 'Marketing Manager', company: 'GrowthHub', location: 'Chicago, IL', salary: '$80k–$100k', type: 'Full-time', remote: 0, category: 'Marketing', logo: '#ec4899', logo_text: 'GH', posted_days: 4, featured: 0, description: 'Drive digital marketing campaigns and growth strategies across multiple channels.', skills: JSON.stringify(['SEO', 'Google Ads', 'Analytics', 'Content Strategy']) },
  { id: 6, title: 'Backend Engineer', company: 'CloudBase', location: 'Seattle, WA', salary: '$125k–$160k', type: 'Full-time', remote: 1, category: 'Technology', logo: '#06b6d4', logo_text: 'CB', posted_days: 2, featured: 1, description: 'Design and scale cloud-native backend services using Node.js, Python, and AWS.', skills: JSON.stringify(['Node.js', 'AWS', 'PostgreSQL', 'Docker']) },
  { id: 7, title: 'Financial Analyst', company: 'CapitalWave', location: 'Boston, MA', salary: '$85k–$110k', type: 'Full-time', remote: 0, category: 'Finance', logo: '#10b981', logo_text: 'CW', posted_days: 7, featured: 0, description: 'Analyze financial data, prepare reports, and support investment decision-making.', skills: JSON.stringify(['Excel', 'Financial Modeling', 'Python', 'Bloomberg']) },
  { id: 8, title: 'DevOps Engineer', company: 'InfraCore', location: 'Remote', salary: '$115k–$145k', type: 'Contract', remote: 1, category: 'Technology', logo: '#8b5cf6', logo_text: 'IC', posted_days: 1, featured: 0, description: 'Manage CI/CD pipelines, containerize applications, and improve developer workflows.', skills: JSON.stringify(['Kubernetes', 'Docker', 'CI/CD', 'Terraform']) },
  { id: 9, title: 'Content Strategist', company: 'MediaFlow', location: 'Los Angeles, CA', salary: '$70k–$90k', type: 'Part-time', remote: 0, category: 'Marketing', logo: '#f43f5e', logo_text: 'MF', posted_days: 6, featured: 0, description: 'Develop and execute content strategies that drive brand awareness and engagement.', skills: JSON.stringify(['Copywriting', 'SEO', 'Social Media', 'Analytics']) },
  { id: 10, title: 'Mobile Developer (iOS)', company: 'AppSphere', location: 'San Jose, CA', salary: '$130k–$165k', type: 'Full-time', remote: 1, category: 'Technology', logo: '#6366f1', logo_text: 'AS', posted_days: 3, featured: 1, description: 'Build world-class iOS applications using Swift and SwiftUI for millions of users.', skills: JSON.stringify(['Swift', 'SwiftUI', 'Xcode', 'REST APIs']) },
  { id: 11, title: 'Mechanical Engineer', company: 'BuildTech', location: 'Houston, TX', salary: '$90k–$115k', type: 'Full-time', remote: 0, category: 'Engineering', logo: '#f97316', logo_text: 'BT', posted_days: 8, featured: 0, description: 'Design and optimize mechanical systems for industrial applications.', skills: JSON.stringify(['SolidWorks', 'AutoCAD', 'FEA', 'Thermodynamics']) },
  { id: 12, title: 'HR Specialist', company: 'PeopleFirst', location: 'Denver, CO', salary: '$60k–$80k', type: 'Full-time', remote: 0, category: 'Sales', logo: '#14b8a6', logo_text: 'PF', posted_days: 10, featured: 0, description: 'Manage recruitment, employee relations, and HR programs for a growing organization.', skills: JSON.stringify(['Recruitment', 'HRIS', 'Labor Law', 'Onboarding']) },
];

const COMPANIES = [
  { id: 1, name: 'TechCorp Inc.', industry: 'Technology', location: 'San Francisco, CA', employees: '1000-5000', logo: '#6366f1', logo_text: 'TC', jobs: 24, rating: 4.8, description: 'Leading tech company building next-generation software solutions for enterprise clients worldwide.' },
  { id: 2, name: 'DesignStudio', industry: 'Design & Creative', location: 'New York, NY', employees: '50-200', logo: '#a855f7', logo_text: 'DS', jobs: 8, rating: 4.6, description: 'Award-winning design studio specializing in brand identity, UX, and digital product design.' },
  { id: 3, name: 'DataMind AI', industry: 'Artificial Intelligence', location: 'Remote-First', employees: '200-1000', logo: '#22c55e', logo_text: 'DM', jobs: 15, rating: 4.9, description: 'AI-first company building intelligent automation tools for the modern workplace.' },
  { id: 4, name: 'CloudBase', industry: 'Cloud Infrastructure', location: 'Seattle, WA', employees: '500-2000', logo: '#06b6d4', logo_text: 'CB', jobs: 31, rating: 4.7, description: 'Cloud infrastructure platform trusted by thousands of companies to scale their operations.' },
  { id: 5, name: 'GrowthHub', industry: 'Marketing & Growth', location: 'Chicago, IL', employees: '100-500', logo: '#ec4899', logo_text: 'GH', jobs: 12, rating: 4.5, description: 'Data-driven growth agency helping startups and Fortune 500s achieve breakthrough marketing results.' },
  { id: 6, name: 'InfraCore', industry: 'DevOps & Security', location: 'Austin, TX', employees: '50-200', logo: '#8b5cf6', logo_text: 'IC', jobs: 9, rating: 4.4, description: 'Building secure, scalable infrastructure tools for the next generation of cloud-native applications.' },
];

async function seed() {
  console.log('🌱 Initializing database...\n');
  await initDB();

  // ── Seed Demo User ─────────────────────────────────────────────────────────
  const demoEmail = 'demo@jobnexus.com';
  const existing = await db('users').where({ email: demoEmail }).first();
  if (!existing) {
    const hash = await bcrypt.hash('demo1234', 10);
    await db('users').insert({
      name: 'Demo User',
      email: demoEmail,
      password_hash: hash,
      role: 'jobseeker',
      job_title: 'Software Developer',
      bio: 'Passionate software developer with 3+ years of experience building modern web applications.',
      skills: JSON.stringify(['React', 'JavaScript', 'Node.js', 'TypeScript', 'CSS'])
    });
    console.log('✅ Seeded demo user  →  demo@jobnexus.com / demo1234');
  } else {
    console.log('⏭️  Demo user already exists');
  }

  // ── Seed Employer User ─────────────────────────────────────────────────────
  const employerEmail = 'employer@jobnexus.com';
  let employerId;
  const existingEmp = await db('users').where({ email: employerEmail }).first();
  if (!existingEmp) {
    const hash = await bcrypt.hash('employer1234', 10);
    const [id] = await db('users').insert({
      name: 'TechCorp Recruiter',
      email: employerEmail,
      password_hash: hash,
      role: 'employer',
      company_name: 'TechCorp Inc.',
      company_size: '1000-5000',
      location: 'San Francisco, CA',
      bio: 'Technical Recruiter at TechCorp Inc.'
    });
    employerId = id;
    console.log('✅ Seeded employer user  →  employer@jobnexus.com / employer1234');
  } else {
    employerId = existingEmp.id;
    console.log('⏭️  Employer user already exists');
  }

  // ── Seed Admin User ────────────────────────────────────────────────────────
  const adminEmail = 'admin@jobnexus.com';
  const existingAdmin = await db('users').where({ email: adminEmail }).first();
  if (!existingAdmin) {
    const hash = await bcrypt.hash('admin1234', 10);
    await db('users').insert({
      name: 'Admin',
      email: adminEmail,
      password_hash: hash,
      role: 'admin',
      bio: 'Super Administrator'
    });
    console.log('✅ Seeded admin user  →  admin@jobnexus.com / admin1234');
  } else {
    console.log('⏭️  Admin user already exists');
  }

  // ── Seed Jobs ──────────────────────────────────────────────────────────────
  const jobCount = await db('jobs').count('id as c').first();
  if (parseInt(jobCount.c) === 0) {
    const mappedJobs = JOBS.map(j => ({
      ...j,
      employer_id: employerId
    }));
    await db('jobs').insert(mappedJobs);
    console.log(`✅ Seeded ${JOBS.length} jobs`);
  } else {
    console.log(`⏭️  Jobs already seeded (${jobCount.c} found)`);
  }

  // ── Seed Companies ─────────────────────────────────────────────────────────
  const coCount = await db('companies').count('id as c').first();
  if (parseInt(coCount.c) === 0) {
    await db('companies').insert(COMPANIES);
    console.log(`✅ Seeded ${COMPANIES.length} companies`);
  } else {
    console.log(`⏭️  Companies already seeded (${coCount.c} found)`);
  }

  console.log('\n🎉 Seed complete!');
  await db.destroy();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
