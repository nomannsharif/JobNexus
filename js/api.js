/**
 * api.js — Centralized frontend API client for JobNexus
 * All fetch calls to the backend go through this file.
 */

const API_BASE = 'http://localhost:3000/api';

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('jwtToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw { status: response.status, message: data.message || 'Request failed.' };
    }

    return data;
  } catch (err) {
    // Re-throw structured errors
    if (err.status) throw err;
    // Network / CORS error — server may be offline
    throw { status: 0, message: 'Cannot connect to server. Is the backend running?' };
  }
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
const Auth = {
  async register(payload) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data.token) {
      localStorage.setItem('jwtToken', data.token);
      localStorage.setItem('jobuser', JSON.stringify(data.user));
    }
    return data;
  },

  async login(email, password, role) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    if (data.token) {
      localStorage.setItem('jwtToken', data.token);
      localStorage.setItem('jobuser', JSON.stringify(data.user));
    }
    return data;
  },

  async me() {
    return await apiFetch('/auth/me');
  },

  async updateProfile(payload) {
    return await apiFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async changePassword(currentPassword, newPassword) {
    return await apiFetch('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  logout() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('jobuser');
    localStorage.removeItem('appliedJobs');
    localStorage.removeItem('savedJobs');
    window.location.href = 'index.html';
  },

  isLoggedIn() {
    return !!localStorage.getItem('jwtToken');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('jobuser') || 'null');
    } catch {
      return null;
    }
  },

  async getAllUsers() {
    return await apiFetch('/auth/users');
  },

  async deleteUser(id) {
    return await apiFetch(`/auth/users/${id}`, {
      method: 'DELETE'
    });
  },

  async toggleSuspendUser(id) {
    return await apiFetch(`/auth/users/${id}/suspend`, {
      method: 'PATCH'
    });
  }
};

// ─── Jobs helpers ─────────────────────────────────────────────────────────────
const Jobs = {
  async getAll(params = {}) {
    // If we want all jobs (including inactive) for admin, we can pass it
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return await apiFetch(`/jobs${qs ? '?' + qs : ''}`);
  },

  async getById(id) {
    return await apiFetch(`/jobs/${id}`);
  },

  async getMyJobs() {
    return await apiFetch('/jobs/my-jobs');
  },

  async post(payload) {
    return await apiFetch('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async delete(id) {
    return await apiFetch(`/jobs/${id}`, {
      method: 'DELETE'
    });
  },

  async updateStatus(id, status) {
    return await apiFetch(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
};

// ─── Companies helpers ────────────────────────────────────────────────────────
const Companies = {
  async getAll(params = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return await apiFetch(`/companies${qs ? '?' + qs : ''}`);
  },

  async getById(id) {
    return await apiFetch(`/companies/${id}`);
  }
};

// ─── Applications helpers ─────────────────────────────────────────────────────
const Applications = {
  async getMyApplications() {
    return await apiFetch('/applications');
  },

  async apply(jobId) {
    return await apiFetch('/applications', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId })
    });
  },

  async getMySaved() {
    return await apiFetch('/applications/saved');
  },

  async toggleSave(jobId) {
    return await apiFetch('/applications/saved', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId })
    });
  },

  async getEmployerApplicants() {
    return await apiFetch('/applications/employer');
  },

  async updateStatus(applicationId, status) {
    return await apiFetch(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
};

// ─── Stats helper ─────────────────────────────────────────────────────────────
const Stats = {
  async get() {
    return await apiFetch('/stats');
  }
};
