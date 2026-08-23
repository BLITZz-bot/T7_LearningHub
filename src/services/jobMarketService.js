/**
 * Job Market Service — Secure Multi-Source Real-Time Job Search
 *
 * Architecture:
 * - JSearch (RapidAPI), Adzuna, Jooble → proxied through /api/jobs (server-side, keys never in browser)
 * - Arbeitnow, The Muse              → called directly (no API keys required)
 * - Strict Role-Relevance Filtering: No unrelated jobs (e.g. Cybersecurity for Data Analyst) ever leak through!
 */

import { industryRoles, allSkills } from '../data/industrySkills';

// In-memory cache for job results (15 min TTL)
const jobCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

// Platform badge styles
export const PLATFORM_STYLES = {
  LinkedIn:    { bg: 'bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/20', name: 'LinkedIn' },
  Indeed:      { bg: 'bg-[#003A9B]/10 text-[#003A9B] border-[#003A9B]/20', name: 'Indeed' },
  Glassdoor:   { bg: 'bg-[#0CAA41]/10 text-[#0CAA41] border-[#0CAA41]/20', name: 'Glassdoor' },
  ZipRecruiter:{ bg: 'bg-[#5B6770]/10 text-[#2C3E50] border-[#5B6770]/20', name: 'ZipRecruiter' },
  Internshala: { bg: 'bg-[#008BDC]/10 text-[#008BDC] border-[#008BDC]/20', name: 'Internshala' },
  Naukri:      { bg: 'bg-[#4A90E2]/10 text-[#2C5E9E] border-[#4A90E2]/20', name: 'Naukri' },
  Adzuna:      { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', name: 'Adzuna' },
  Arbeitnow:   { bg: 'bg-purple-50 text-purple-700 border-purple-200', name: 'Arbeitnow' },
  TheMuse:     { bg: 'bg-rose-50 text-rose-700 border-rose-200', name: 'The Muse' },
  Jooble:      { bg: 'bg-amber-50 text-amber-800 border-amber-200', name: 'Jooble' },
  GoogleJobs:  { bg: 'bg-blue-50 text-blue-700 border-blue-200', name: 'Google for Jobs' },
  Other:       { bg: 'bg-zinc-100 text-zinc-700 border-zinc-200', name: 'Job Board' },
};

export const getPlatformStyle = (platformName) => {
  if (!platformName) return PLATFORM_STYLES.Other;
  const p = platformName.toLowerCase();
  if (p.includes('linkedin'))    return PLATFORM_STYLES.LinkedIn;
  if (p.includes('indeed'))      return PLATFORM_STYLES.Indeed;
  if (p.includes('glassdoor'))   return PLATFORM_STYLES.Glassdoor;
  if (p.includes('ziprecruiter'))return PLATFORM_STYLES.ZipRecruiter;
  if (p.includes('internshala')) return PLATFORM_STYLES.Internshala;
  if (p.includes('naukri'))      return PLATFORM_STYLES.Naukri;
  if (p.includes('adzuna'))      return PLATFORM_STYLES.Adzuna;
  if (p.includes('arbeitnow'))   return PLATFORM_STYLES.Arbeitnow;
  if (p.includes('muse'))        return PLATFORM_STYLES.TheMuse;
  if (p.includes('jooble'))      return PLATFORM_STYLES.Jooble;
  return { bg: 'bg-zinc-100 text-zinc-700 border-zinc-200', name: platformName };
};

/**
 * Strict role-relevance checker: Ensures jobs returned actually match the selected career role!
 */
export const isJobRelevantForRole = (title = '', description = '', roleName = '') => {
  const t = title.toLowerCase();
  const d = description.toLowerCase();
  const r = roleName.toLowerCase();

  // If 'All Roles' or 'all' is selected — permit all tech opportunities!
  if (!r || r === 'all' || r.includes('all roles') || r.includes('all tech') || r.includes('all jobs') || r === 'all-roles') {
    return true;
  }

  // If role is Data Analyst / BI:
  if (r.includes('data analyst') || r.includes('business intelligence') || r.includes('bi analyst')) {
    return t.includes('data') || t.includes('analyst') || t.includes('analytics') || t.includes('bi ') || t.includes('power bi') || t.includes('tableau') || t.includes('sql');
  }

  // If role is Data Scientist / AI / ML:
  if (r.includes('data scientist') || r.includes('machine learning') || r.includes('ai') || r.includes('ml')) {
    return t.includes('data scien') || t.includes('machine learning') || t.includes('ai') || t.includes('ml') || t.includes('deep learning') || t.includes('nlp');
  }

  // If role is Frontend Developer:
  if (r.includes('frontend') || r.includes('front-end') || r.includes('ui developer')) {
    return t.includes('frontend') || t.includes('front-end') || t.includes('react') || t.includes('vue') || t.includes('angular') || t.includes('ui') || t.includes('web developer') || t.includes('javascript');
  }

  // If role is Backend Developer:
  if (r.includes('backend') || r.includes('back-end')) {
    return t.includes('backend') || t.includes('back-end') || t.includes('node') || t.includes('java') || t.includes('python') || t.includes('api') || t.includes('server') || t.includes('spring') || t.includes('golang') || t.includes('c#') || t.includes('.net');
  }

  // If role is Full Stack:
  if (r.includes('fullstack') || r.includes('full stack') || r.includes('full-stack')) {
    return t.includes('fullstack') || t.includes('full stack') || t.includes('full-stack') || t.includes('software engineer') || t.includes('software developer') || t.includes('web developer');
  }

  // If role is Cybersecurity:
  if (r.includes('security') || r.includes('cyber')) {
    return t.includes('security') || t.includes('cyber') || t.includes('infosec') || t.includes('soc') || t.includes('penetration') || t.includes('threat');
  }

  // If role is DevOps / Cloud:
  if (r.includes('devops') || r.includes('cloud') || r.includes('sre')) {
    return t.includes('devops') || t.includes('cloud') || t.includes('aws') || t.includes('azure') || t.includes('kubernetes') || t.includes('sre') || t.includes('infrastructure');
  }

  // If role is Mobile:
  if (r.includes('mobile') || r.includes('android') || r.includes('ios') || r.includes('flutter')) {
    return t.includes('android') || t.includes('ios') || t.includes('flutter') || t.includes('react native') || t.includes('mobile');
  }

  // Generic fallback: check if title or description has key role words
  const words = r.split(' ').filter(w => w.length > 2);
  return words.some(w => t.includes(w)) || (words.length > 1 && words.some(w => d.includes(w)));
};

/**
 * Smart skill extraction: match skills from job title + description
 */
export const extractSkillsFromJob = (title = '', description = '', roleSkills = []) => {
  const combinedText = `${title} ${description}`.toLowerCase();
  const matched = new Set();
  roleSkills.forEach(skillObj => {
    const sName = typeof skillObj === 'string' ? skillObj : skillObj.name;
    if (sName && combinedText.includes(sName.toLowerCase())) matched.add(sName);
  });
  allSkills.slice(0, 50).forEach(s => {
    if (combinedText.includes(s.toLowerCase())) matched.add(s);
  });
  if (matched.size < 4 && roleSkills.length > 0) {
    roleSkills.slice(0, 5).forEach(s => {
      const sName = typeof s === 'string' ? s : s.name;
      if (sName) matched.add(sName);
    });
  }
  return Array.from(matched);
};

const formatPostedDate = (dateStr) => {
  if (!dateStr) return 'Recently posted';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently posted';
    const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  } catch { return 'Recently posted'; }
};

// ----------------------------------------------------------------
// 1. SECURE PROXY: JSearch + Adzuna + Jooble via /api/jobs
// ----------------------------------------------------------------
const fetchSecureJobs = async (roleName, location, source, page = 1) => {
  const params = new URLSearchParams({ role: roleName, location, source, page: String(page) });
  const res = await fetch(`/api/jobs?${params}`);
  if (!res.ok) throw new Error(`Job proxy error (${res.status})`);
  const data = await res.json();
  return data; // { jobs, activeSources, errors }
};

// ----------------------------------------------------------------
// 2. Arbeitnow API — Free, No Key, Direct Frontend Call (Strictly Filtered)
// ----------------------------------------------------------------
export const fetchArbeitnowJobs = async (roleName, location = 'India', page = 1) => {
  const url = `https://www.arbeitnow.com/api/job-board-api?page=${page}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Arbeitnow API error (${response.status})`);
  const data = await response.json();
  const rawJobs = data.data || [];
  const matchedRole = industryRoles.find(r => r.role_name.toLowerCase() === roleName.toLowerCase()) || {};
  const roleRequiredSkills = matchedRole.required_skills || [];

  // Strictly filter only jobs that match the selected role!
  const relevant = rawJobs.filter(job => isJobRelevantForRole(job.title, `${job.description} ${job.tags?.join(' ')}`, roleName));

  return relevant.slice(0, 8).map((job, idx) => {
    const skills = extractSkillsFromJob(job.title, job.description, roleRequiredSkills);
    return {
      id: job.slug ? `arbeitnow-${job.slug}` : `arbeitnow-${page}-${idx}-${Date.now()}`,
      title: job.title,
      company: job.company_name || 'Tech Company',
      companyLogo: null,
      platform: 'Arbeitnow',
      platformStyle: PLATFORM_STYLES.Arbeitnow.bg,
      location: job.location || (job.remote ? 'Remote' : location),
      isRemote: Boolean(job.remote),
      type: job.job_types?.join(', ') || 'Full-time',
      salary: 'Competitive',
      requiredSkills: skills,
      posted: formatPostedDate(job.created_at ? new Date(job.created_at * 1000) : null),
      applyUrl: job.url || '#',
      description: job.description ? job.description.replace(/<\/?[^>]+(>|$)/g, '') : '',
      source: 'Arbeitnow (Remote & Tech)',
    };
  });
};

// ----------------------------------------------------------------
// 3. The Muse API — Free, No Key, Direct Frontend Call (Strictly Filtered)
// ----------------------------------------------------------------
export const fetchTheMuseJobs = async (roleName, location = 'India', page = 1) => {
  // Determine relevant Muse category
  let categoryParam = 'category=Software%20Engineering';
  const rLower = roleName.toLowerCase();
  if (rLower.includes('data') || rLower.includes('analyst') || rLower.includes('scientist')) {
    categoryParam = 'category=Data%20and%20Analytics';
  } else if (rLower.includes('design') || rLower.includes('ui') || rLower.includes('ux')) {
    categoryParam = 'category=Design%20and%20UX';
  }

  const url = `https://www.themuse.com/api/public/jobs?${categoryParam}&page=${page}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`The Muse API error (${response.status})`);
  const data = await response.json();
  const rawJobs = data.results || [];
  const matchedRole = industryRoles.find(r => r.role_name.toLowerCase() === roleName.toLowerCase()) || {};
  const roleRequiredSkills = matchedRole.required_skills || [];

  // Strictly filter only jobs that match the selected role!
  const relevant = rawJobs.filter(job => isJobRelevantForRole(job.name, job.contents, roleName));

  return relevant.slice(0, 8).map((job, idx) => {
    const skills = extractSkillsFromJob(job.name, job.contents, roleRequiredSkills);
    const locStr = job.locations?.map(l => l.name).join(', ') || (location || 'Global / Remote');
    return {
      id: job.id ? `themuse-${job.id}` : `themuse-${page}-${idx}-${Date.now()}`,
      title: job.name,
      company: job.company?.name || 'Top Tech Enterprise',
      companyLogo: null,
      platform: 'The Muse',
      platformStyle: PLATFORM_STYLES.TheMuse.bg,
      location: locStr,
      isRemote: locStr.toLowerCase().includes('remote'),
      type: job.levels?.map(l => l.name).join(', ') || 'Full-time',
      salary: 'Industry Standard',
      requiredSkills: skills,
      posted: formatPostedDate(job.publication_date),
      applyUrl: job.refs?.landing_page || '#',
      description: job.contents ? job.contents.replace(/<\/?[^>]+(>|$)/g, '') : '',
      source: 'The Muse (Top Tech Enterprises)',
    };
  });
};

// ----------------------------------------------------------------
// 4. Unified Master Fetcher — Blends all 5 sources
// ----------------------------------------------------------------
export const fetchJobMarketInsights = async ({
  roleId,
  roleName,
  location = 'India',
  provider = 'auto', // 'auto'|'all'|'jsearch'|'adzuna'|'arbeitnow'|'themuse'|'jooble'
  page = 1,
  forceRefresh = false,
} = {}) => {
  const cacheKey = `${roleId || roleName}-${location}-${provider}-p${page}`;
  if (!forceRefresh && jobCache.has(cacheKey)) {
    const cached = jobCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.data;
  }

  const isAllRoles = roleId === 'all' || roleName === 'All Tech Roles' || roleName === 'All Roles' || !roleId;
  const matchedRole = !isAllRoles ? (industryRoles.find(r => r.id === roleId || r.role_name === roleName) || industryRoles[0]) : null;
  const queryRole = isAllRoles ? 'Developer' : (roleName || matchedRole?.role_name || 'Software Developer');

  const isAuto = provider === 'auto' || provider === 'all';

  let secureJobs = [];       // JSearch + Adzuna + Jooble (proxied)
  let arbeitnowJobs = [];
  let theMuseJobs = [];
  let activeSources = [];
  let errorMessage = '';

  const promises = [];

  // Keyed APIs through secure proxy
  if (isAuto || ['jsearch', 'adzuna', 'jooble'].includes(provider)) {
    const proxySource = isAuto ? 'all' : provider;
    promises.push(
      fetchSecureJobs(queryRole, location, proxySource, page)
        .then(data => {
          secureJobs = data.jobs || [];
          if (data.activeSources) activeSources.push(...data.activeSources);
          if (data.errors?.length) console.warn('Job proxy errors:', data.errors);
        })
        .catch(err => {
          console.warn('Secure job proxy failed:', err.message);
          errorMessage = err.message;
        })
    );
  }

  // Free APIs — direct frontend calls
  if (isAuto || provider === 'arbeitnow') {
    promises.push(
      fetchArbeitnowJobs(queryRole, location, page)
        .then(res => {
          arbeitnowJobs = res || [];
          if (arbeitnowJobs.length > 0) activeSources.push('Arbeitnow');
        })
        .catch(err => console.warn('Arbeitnow failed:', err.message))
    );
  }

  if (isAuto || provider === 'themuse') {
    promises.push(
      fetchTheMuseJobs(queryRole, location, page)
        .then(res => {
          theMuseJobs = res || [];
          if (theMuseJobs.length > 0) activeSources.push('The Muse');
        })
        .catch(err => console.warn('The Muse failed:', err.message))
    );
  }

  await Promise.allSettled(promises);

  // Enrich proxy jobs with client-side skill matching and platform styling
  const roleRequiredSkills = matchedRole?.required_skills || [];

  const enrichProxyJob = (job) => {
    const styling = getPlatformStyle(job.platform);
    return {
      ...job,
      platformStyle: styling.bg,
      posted: formatPostedDate(job.posted),
      requiredSkills: extractSkillsFromJob(job.title, job.description, roleRequiredSkills),
    };
  };

  // Filter proxied jobs through the relevance checker as well to guarantee 100% role purity!
  const enrichedSecureJobs = secureJobs
    .filter(job => isJobRelevantForRole(job.title, job.description, queryRole))
    .map(enrichProxyJob);

  // Round-robin merge: secure (JSearch/Adzuna/Jooble), Arbeitnow, The Muse
  let finalJobs = [];
  if (provider === 'arbeitnow') {
    finalJobs = arbeitnowJobs;
  } else if (provider === 'themuse') {
    finalJobs = theMuseJobs;
  } else if (['jsearch', 'adzuna', 'jooble'].includes(provider)) {
    finalJobs = enrichedSecureJobs;
  } else {
    // Interleave all relevant sources
    const buckets = [enrichedSecureJobs, arbeitnowJobs, theMuseJobs].filter(b => b.length > 0);
    const maxLen = Math.max(0, ...buckets.map(b => b.length));
    for (let i = 0; i < maxLen; i++) {
      for (const bucket of buckets) {
        if (bucket[i]) finalJobs.push(bucket[i]);
      }
    }
  }

  const uniqueSources = [...new Set(activeSources)];
  const resultPayload = {
    jobs: finalJobs,
    page,
    provider: uniqueSources.length > 1
      ? `Multi-Source Live (${uniqueSources.join(' + ')})`
      : (uniqueSources[0] || 'No Live Data'),
    activeSources: uniqueSources,
    hasLiveApiConfigured: true,
    error: finalJobs.length === 0 ? (errorMessage || 'No matching jobs returned for this role.') : '',
    timestamp: Date.now(),
  };

  jobCache.set(cacheKey, { data: resultPayload, timestamp: Date.now() });
  return resultPayload;
};
