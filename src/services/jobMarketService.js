/**
 * Job Market Service — Secure Multi-Source Real-Time Job Search
 *
 * Architecture:
 * - JSearch (RapidAPI), Adzuna, Jooble → proxied through /api/jobs (server-side, keys never in browser)
 * - Arbeitnow, The Muse              → called directly (no API keys required)
 * - All results merged and returned to the UI
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
const fetchSecureJobs = async (roleName, location, source) => {
  const params = new URLSearchParams({ role: roleName, location, source });
  const res = await fetch(`/api/jobs?${params}`);
  if (!res.ok) throw new Error(`Job proxy error (${res.status})`);
  const data = await res.json();
  return data; // { jobs, activeSources, errors }
};

// ----------------------------------------------------------------
// 2. Arbeitnow API — Free, No Key, Direct Frontend Call
// ----------------------------------------------------------------
export const fetchArbeitnowJobs = async (roleName, location = 'India') => {
  const response = await fetch('https://www.arbeitnow.com/api/job-board-api');
  if (!response.ok) throw new Error(`Arbeitnow API error (${response.status})`);
  const data = await response.json();
  const rawJobs = data.data || [];
  const matchedRole = industryRoles.find(r => r.role_name.toLowerCase() === roleName.toLowerCase()) || {};
  const roleRequiredSkills = matchedRole.required_skills || [];
  const roleWords = roleName.toLowerCase().split(' ').filter(w => w.length > 2);
  const relevant = rawJobs.filter(job => {
    const text = `${job.title} ${job.description} ${job.tags?.join(' ')}`.toLowerCase();
    return roleWords.some(rw => text.includes(rw)) || text.includes('developer') || text.includes('engineer');
  });
  const jobsToMap = relevant.length > 0 ? relevant.slice(0, 6) : rawJobs.slice(0, 4);
  return jobsToMap.map((job, idx) => {
    const skills = extractSkillsFromJob(job.title, job.description, roleRequiredSkills);
    return {
      id: job.slug ? `arbeitnow-${job.slug}` : `arbeitnow-${idx}-${Date.now()}`,
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
// 3. The Muse API — Free, No Key, Direct Frontend Call
// ----------------------------------------------------------------
export const fetchTheMuseJobs = async (roleName, location = 'India') => {
  const url = `https://www.themuse.com/api/public/jobs?category=Software%20Engineering&category=Data%20and%20Analytics&category=Design%20and%20UX&page=1`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`The Muse API error (${response.status})`);
  const data = await response.json();
  const rawJobs = data.results || [];
  const matchedRole = industryRoles.find(r => r.role_name.toLowerCase() === roleName.toLowerCase()) || {};
  const roleRequiredSkills = matchedRole.required_skills || [];
  const roleWords = roleName.toLowerCase().split(' ').filter(w => w.length > 2);
  const relevant = rawJobs.filter(job => {
    const text = `${job.name} ${job.contents}`.toLowerCase();
    return roleWords.some(rw => text.includes(rw)) || text.includes('software') || text.includes('engineer');
  });
  const jobsToMap = relevant.length > 0 ? relevant.slice(0, 6) : rawJobs.slice(0, 4);
  return jobsToMap.map((job, idx) => {
    const skills = extractSkillsFromJob(job.name, job.contents, roleRequiredSkills);
    const locStr = job.locations?.map(l => l.name).join(', ') || (location || 'Global / Remote');
    return {
      id: job.id ? `themuse-${job.id}` : `themuse-${idx}-${Date.now()}`,
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
  forceRefresh = false,
} = {}) => {
  const cacheKey = `${roleId || roleName}-${location}-${provider}`;
  if (!forceRefresh && jobCache.has(cacheKey)) {
    const cached = jobCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.data;
  }

  const role = industryRoles.find(r => r.id === roleId || r.role_name === roleName) || industryRoles[0];
  const queryRole = roleName || role.role_name;

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
      fetchSecureJobs(queryRole, location, proxySource)
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
      fetchArbeitnowJobs(queryRole, location)
        .then(res => {
          arbeitnowJobs = res || [];
          if (arbeitnowJobs.length > 0) activeSources.push('Arbeitnow');
        })
        .catch(err => console.warn('Arbeitnow failed:', err.message))
    );
  }

  if (isAuto || provider === 'themuse') {
    promises.push(
      fetchTheMuseJobs(queryRole, location)
        .then(res => {
          theMuseJobs = res || [];
          if (theMuseJobs.length > 0) activeSources.push('The Muse');
        })
        .catch(err => console.warn('The Muse failed:', err.message))
    );
  }

  await Promise.allSettled(promises);

  // Enrich proxy jobs with client-side skill matching and platform styling
  const matchedRole = industryRoles.find(r => r.role_name === queryRole) || {};
  const roleRequiredSkills = matchedRole.required_skills || [];

  const enrichProxyJob = (job) => {
    const styling = getPlatformStyle(job.platform);
    return {
      ...job,
      platformStyle: styling.bg,
      posted: formatPostedDate(job.posted),
      requiredSkills: extractSkillsFromJob(job.title, job.description, roleRequiredSkills),
    };
  };

  const enrichedSecureJobs = secureJobs.map(enrichProxyJob);

  // Round-robin merge: secure (JSearch/Adzuna/Jooble), Arbeitnow, The Muse
  let finalJobs = [];
  if (provider === 'arbeitnow') {
    finalJobs = arbeitnowJobs;
  } else if (provider === 'themuse') {
    finalJobs = theMuseJobs;
  } else if (['jsearch', 'adzuna', 'jooble'].includes(provider)) {
    finalJobs = enrichedSecureJobs;
  } else {
    // Interleave all sources
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
    jobs: finalJobs.slice(0, 12),
    provider: uniqueSources.length > 1
      ? `Multi-Source Live (${uniqueSources.join(' + ')})`
      : (uniqueSources[0] || 'No Live Data'),
    activeSources: uniqueSources,
    hasLiveApiConfigured: true, // Keys are on server; always available
    error: finalJobs.length === 0 ? (errorMessage || 'No jobs returned from any source.') : '',
    timestamp: Date.now(),
  };

  jobCache.set(cacheKey, { data: resultPayload, timestamp: Date.now() });
  return resultPayload;
};
