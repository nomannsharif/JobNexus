# JobNexus - Premium Job Portal 

JobNexus is a modern, feature-rich Job Portal web application designed to connect top talent with premium employers. Built using a sleek dark-themed responsive design (with glassmorphism and tailored animations) and powered by a secure REST API backend, the platform enables seamless job search, dynamic filtering, application tracking, and profile management.

Developed as a project for **Web Technologies** by Noman (SP24-BAi-041).

---

##  Key Features

### For Job Seekers
* **Advanced Job Discovery**: Browse jobs with real-time composite filtering (keywords, location, category, job type, work mode, and min-salary range).
* **Easy Application**: Apply to jobs in one click with your profile details and track submission status.
* **Saved Jobs**: Bookmark jobs to view and apply later.
* **Candidate Dashboard**: Check stats (applied, in review, interview scheduled), manage professional profiles, update resumes, and modify settings.

### For Employers
* **Job Posting**: Post job listings complete with description, department, location, work mode, salary details, and required skills.
* **Applicant Tracking System (ATS)**: View all applicants for posted listings, download resumes, and advance candidates through status stages (Pending → Under Review → Interview Scheduled → Offered / Rejected).
* **Employer Dashboard**: Real-time stats showing active listings, total applicants, and interviews.
* **Company Profile**: Update business profiles, industries, location, and size.

### Technical & Security Highlights
* **Privacy & Access Control**: Applicant details and counts are strictly hidden from the public/jobseekers; only the employer who posted a job (and system administrators) can view applications or application counts.
* **Dynamic Sidebar Badges**: Sidebar badge counts update in real-time.
* **Smart Filter Composition**: Combine search inputs, salary sliders, and toggles without overwriting active states.

---

##  Technology Stack

### Backend
* **Core**: Node.js & Express
* **Database**: SQLite3
* **Query Builder**: Knex.js
* **Authentication**: JSON Web Tokens (JWT) & bcrypt password hashing
* **File Uploads**: Multer (for resume storage)

### Frontend
* **Core**: HTML5, Vanilla JavaScript (ES6)
* **Styling**: Modern CSS (Vanilla style sheets with TailwindCSS compilation)
* **Icons & Fonts**: FontAwesome v6, Google Fonts (Inter, Outfit)

---

##  Project Structure

```text
Job Portal/
├── backend/                       # REST API Backend
│   ├── database/                  # SQLite schema definitions and seed scripts
│   │   ├── db.js                  # Database connection & table setup (Knex)
│   │   └── seed.js                # Database mock data seeder
│   ├── middleware/                # Route security middlewares
│   │   └── auth.js                # JWT auth verification middleware
│   ├── routes/                    # API endpoints
│   │   ├── auth.js                # Auth, registration, and user moderation
│   │   ├── jobs.js                # Job postings & details
│   │   ├── applications.js        # Applications & bookmark lists
│   │   └── companies.js           # Employer details
│   ├── server.js                  # Express entry point & middleware configurations
│   ├── .env                       # Environment variables configuration
│   └── package.json               # Node.js dependencies & run scripts
├── css/                           # Styling assets
│   └── style.css                  # Custom theme rules & layout configurations
├── js/                            # Frontend scripts
│   ├── api.js                     # Centralized API fetch helper (CORS/JWT headers)
│   ├── home.js                    # Landing page stats & featured listings loader
│   ├── jobs.js                    # Job search page query and filter engine
│   └── main.js                    # Scroll behavior, toasts, and shared utilities
├── index.html                     # Homepage (Welcome portal)
├── jobs.html                      # Browse listings page
├── job-detail.html                # Single job details and application modal
├── companies.html                 # Featured companies roster
├── login.html                     # Sign in page
├── register.html                  # Sign up page
├── dashboard.html                 # Jobseeker candidate panel
├── employer-dashboard.html        # Employer recruitment panel
├── admin.html                     # Super administrator panel
└── README.md                      # Project manual
```

---

##  Installation & Setup

Ensure you have **Node.js** (v14 or higher) installed.

### 1. Set Up the Backend
Navigate to the `backend/` directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Configure the environment variables:
Create a file named `.env` in the `backend/` directory and populate it:
```env
PORT=3000
JWT_SECRET=jobnexus_super_secret_key_change_in_production_2024
JWT_EXPIRES_IN=7d
```

Initialize and seed the database with mock records:
```bash
npm run seed
```

Start the API server in development mode:
```bash
npm run dev
```
The API server will launch at **`http://localhost:3000`**.

### 2. Set Up the Frontend
Open another terminal in the root `Job Portal/` directory. Serve static files using a simple web server (e.g. `http-server` via `npx`):
```bash
npx http-server -p 8080
```
Open **`http://localhost:8080`** in your browser to run the web application.

---

##  Demo Account Credentials

Use these seeded credentials to explore different roles:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Job Seeker (Candidate)** | `demo@jobnexus.com` | `demo1234` |
| **Employer (Recruiter)** | `employer@jobnexus.com` | `employer1234` |
| **Super Administrator** | `admin@jobnexus.com` | `admin1234` |

---

## 📋 API Endpoint Documentation

All endpoints are prefixed with `/api`. Protected endpoints require standard `Authorization: Bearer <JWT_TOKEN>` headers.

### Authentication (`/auth`)
* `POST /auth/register` — Create a new user account (role: `jobseeker` or `employer`).
* `POST /auth/login` — Log in and receive a JWT access token.
* `GET /auth/me` [Protected] — Retrieve authenticated user profile metadata.
* `PUT /auth/profile` [Protected] — Update name, phone, bio, and skills.
* `PUT /auth/password` [Protected] — Modify account password.
* `GET /auth/users` [Admin Only] — List all registered users on the platform.
* `DELETE /auth/users/:id` [Admin Only] — Terminate a user account.
* `PATCH /auth/users/:id/suspend` [Admin Only] — Toggle suspension status for a user.

### Job Listings (`/jobs`)
* `GET /jobs` — Query all active job postings (optional search query params: `q`, `loc`, `category`, `type`, `remote`, `featured`).
* `GET /jobs/:id` — View details for a single job listing. If accessed by the posting employer or admin, also returns `applicants_count`.
* `POST /jobs` [Employer/Admin Only] — Publish a new job posting.
* `DELETE /jobs/:id` [Owner/Admin Only] — Remove a job post.
* `PATCH /jobs/:id/status` [Admin Only] — Set job status (`active`, `paused`, `expired`).
* `GET /jobs/my-jobs` [Employer/Admin Only] — Retrieve jobs posted by the logged-in user.

### Job Applications (`/applications`)
* `POST /applications` [Jobseeker Only] — Submit application for a job ID.
* `GET /applications` [Jobseeker Only] — List all jobs applied to by the candidate.
* `GET /applications/employer` [Employer/Admin Only] — List applicants for the employer's listings.
* `PATCH /applications/:id/status` [Owner/Admin Only] — Update application review status (`pending`, `reviewed`, `interview`, `rejected`, `offered`).
* `POST /applications/saved` [Jobseeker Only] — Bookmark / unbookmark a job.
* `GET /applications/saved` [Jobseeker Only] — List candidate saved jobs.

### Platform Stats (`/stats`)
* `GET /stats` — Returns public platform counters (total active jobs, companies, registered users, and system applications).
