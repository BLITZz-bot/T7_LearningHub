/**
 * Vercel Serverless Function: /api/jobs
 *
 * Secure server-side proxy for all external job market APIs.
 * API keys (RAPIDAPI_KEY, ADZUNA_APP_ID, ADZUNA_APP_KEY, JOOBLE_API_KEY)
 * are server-only env vars — NEVER exposed to the browser bundle.
 *
 * GET /api/jobs?role=Frontend+Developer&location=India&source=all
 * Sources: all | jsearch | adzuna | jooble
 * (Arbeitnow & The Muse are called directly from frontend — no keys needed)
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed. Use GET.' });

  const { role = 'Software Developer', location = 'India', source = 'all', page = '1' } = req.query;
  const pageNum = parseInt(page, 10) || 1;

  // Server-only env vars — no VITE_ prefix, never bundled into frontend
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
  const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || '';
  const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || '';
  const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY || '';

  const results = { jsearch: [], adzuna: [], jooble: [], errors: [] };
  const runAll = source === 'all';

  const fetchPromises = [];

  // ---- 1. JSearch (RapidAPI) ----
  if ((runAll || source === 'jsearch') && RAPIDAPI_KEY) {
    fetchPromises.push(
      (async () => {
        try {
          const query = encodeURIComponent(`${role} in ${location}`);
          const url = `https://jsearch.p.rapidapi.com/search-v2?query=${query}&page=${pageNum}&num_pages=1`;
          const r = await fetch(url, {
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
            },
          });
          if (!r.ok) throw new Error(`JSearch ${r.status}: ${await r.text()}`);
          const data = await r.json();
          const rawJobs = Array.isArray(data.data) ? data.data : (data.data?.jobs || []);
          results.jsearch = rawJobs.map((j, idx) => ({
            id: j.job_id || `jsearch-${pageNum}-${idx}`,
            title: j.job_title,
            company: j.employer_name || 'Hiring Company',
            companyLogo: j.employer_logo || null,
            platform: j.job_publisher || 'Google for Jobs',
            location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || (j.job_is_remote ? 'Remote' : location),
            isRemote: Boolean(j.job_is_remote),
            type: j.job_employment_type === 'INTERN' ? 'Internship' : 'Full-time',
            salary: j.job_min_salary && j.job_max_salary
              ? `${j.job_salary_currency || '₹'} ${j.job_min_salary.toLocaleString()} - ${j.job_max_salary.toLocaleString()}`
              : 'Competitive',
            posted: j.job_posted_at_datetime_utc || null,
            applyUrl: j.job_apply_link || j.job_google_link || '#',
            description: j.job_description || '',
            source: 'JSearch (Google for Jobs)',
          }));
        } catch (e) {
          results.errors.push(`JSearch: ${e.message}`);
        }
      })()
    );
  }

  // ---- 2. Adzuna ----
  if ((runAll || source === 'adzuna') && ADZUNA_APP_ID && ADZUNA_APP_KEY) {
    fetchPromises.push(
      (async () => {
        try {
          const what = encodeURIComponent(role);
          const url = `https://api.adzuna.com/v1/api/jobs/in/search/${pageNum}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=${what}&results_per_page=10&content-type=application/json`;
          const r = await fetch(url);
          if (!r.ok) throw new Error(`Adzuna ${r.status}: ${await r.text()}`);
          const data = await r.json();
          results.adzuna = (data.results || []).map((j, idx) => ({
            id: j.id ? `adzuna-${j.id}` : `adzuna-${pageNum}-${idx}`,
            title: j.title?.replace(/<\/?[^>]+(>|$)/g, '') || '',
            company: j.company?.display_name || 'Leading Enterprise',
            companyLogo: null,
            platform: 'Adzuna',
            location: j.location?.display_name || 'India',
            isRemote: (j.title + (j.description || '')).toLowerCase().includes('remote'),
            type: j.contract_time === 'part_time' ? 'Part-time' : 'Full-time',
            salary: j.salary_min && j.salary_max
              ? `₹${Math.round(j.salary_min / 100000)}L - ₹${Math.round(j.salary_max / 100000)}L / yr`
              : 'Industry Standard',
            posted: j.created || null,
            applyUrl: j.redirect_url || '#',
            description: j.description?.replace(/<\/?[^>]+(>|$)/g, '') || '',
            source: 'Adzuna Official API',
          }));
        } catch (e) {
          results.errors.push(`Adzuna: ${e.message}`);
        }
      })()
    );
  }

  // ---- 3. Jooble ----
  if ((runAll || source === 'jooble') && JOOBLE_API_KEY) {
    fetchPromises.push(
      (async () => {
        try {
          const url = `https://jooble.org/api/${JOOBLE_API_KEY}`;
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords: role, location, page: pageNum }),
          });
          if (!r.ok) throw new Error(`Jooble ${r.status}`);
          const data = await r.json();
          results.jooble = (data.jobs || []).map((j, idx) => ({
            id: j.id ? `jooble-${j.id}` : `jooble-${pageNum}-${idx}`,
            title: j.title?.replace(/<\/?[^>]+(>|$)/g, '') || '',
            company: j.company || 'Leading Employer',
            companyLogo: null,
            platform: 'Jooble',
            location: j.location || location,
            isRemote: (j.title + (j.snippet || '')).toLowerCase().includes('remote'),
            type: j.type || 'Full-time',
            salary: j.salary || 'Competitive',
            posted: j.updated || null,
            applyUrl: j.link || '#',
            description: j.snippet?.replace(/<\/?[^>]+(>|$)/g, '') || '',
            source: 'Jooble Global Search',
          }));
        } catch (e) {
          results.errors.push(`Jooble: ${e.message}`);
        }
      })()
    );
  }

  await Promise.allSettled(fetchPromises);

  // Round-robin merge: J[0], A[0], Jooble[0], J[1], A[1], ...
  const buckets = [results.jsearch, results.adzuna, results.jooble].filter(b => b.length > 0);
  const merged = [];
  const maxLen = Math.max(0, ...buckets.map(b => b.length));
  for (let i = 0; i < maxLen; i++) {
    for (const bucket of buckets) {
      if (bucket[i]) merged.push(bucket[i]);
    }
  }

  const activeSources = [
    results.jsearch.length > 0 ? 'JSearch' : null,
    results.adzuna.length > 0 ? 'Adzuna' : null,
    results.jooble.length > 0 ? 'Jooble' : null,
  ].filter(Boolean);

  return res.status(200).json({
    jobs: merged.slice(0, 50),
    activeSources,
    errors: results.errors,
    timestamp: Date.now(),
  });
}
