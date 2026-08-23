/**
 * Job Market Service — Real-Time Job Search Integration
 * 
 * Supports:
 * 1. JSearch API (via RapidAPI / OpenWebNinja) — Real-time Google for Jobs data (LinkedIn, Indeed, Glassdoor, ZipRecruiter)
 * 2. Adzuna API (developer.adzuna.com) — Licensed live job listings & salary insights across 18+ countries (including India)
 * 3. Intelligent fallback & skill matcher matching against student skills
 */

import { industryRoles, allSkills } from '../data/industrySkills';

// Environment variables
const ENV_RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || import.meta.env.VITE_JSEARCH_API_KEY || '';
const ENV_ADZUNA_APP_ID = import.meta.env.VITE_ADZUNA_APP_ID || '';
const ENV_ADZUNA_APP_KEY = import.meta.env.VITE_ADZUNA_APP_KEY || '';

// In-memory cache for API results (15 min TTL)
const jobCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

// Platform badge styles
export const PLATFORM_STYLES = {
  LinkedIn: { bg: 'bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/20', name: 'LinkedIn' },
  Indeed: { bg: 'bg-[#003A9B]/10 text-[#003A9B] border-[#003A9B]/20', name: 'Indeed' },
  Glassdoor: { bg: 'bg-[#0CAA41]/10 text-[#0CAA41] border-[#0CAA41]/20', name: 'Glassdoor' },
  ZipRecruiter: { bg: 'bg-[#5B6770]/10 text-[#2C3E50] border-[#5B6770]/20', name: 'ZipRecruiter' },
  Internshala: { bg: 'bg-[#008BDC]/10 text-[#008BDC] border-[#008BDC]/20', name: 'Internshala' },
  Naukri: { bg: 'bg-[#4A90E2]/10 text-[#2C5E9E] border-[#4A90E2]/20', name: 'Naukri' },
  Adzuna: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', name: 'Adzuna' },
  GoogleJobs: { bg: 'bg-blue-50 text-blue-700 border-blue-200', name: 'Google for Jobs' },
  Other: { bg: 'bg-zinc-100 text-zinc-700 border-zinc-200', name: 'Job Board' },
};

export const getPlatformStyle = (platformName) => {
  if (!platformName) return PLATFORM_STYLES.Other;
  const p = platformName.toLowerCase();
  if (p.includes('linkedin')) return PLATFORM_STYLES.LinkedIn;
  if (p.includes('indeed')) return PLATFORM_STYLES.Indeed;
  if (p.includes('glassdoor')) return PLATFORM_STYLES.Glassdoor;
  if (p.includes('ziprecruiter')) return PLATFORM_STYLES.ZipRecruiter;
  if (p.includes('internshala')) return PLATFORM_STYLES.Internshala;
  if (p.includes('naukri')) return PLATFORM_STYLES.Naukri;
  if (p.includes('adzuna')) return PLATFORM_STYLES.Adzuna;
  return { bg: 'bg-zinc-100 text-zinc-700 border-zinc-200', name: platformName };
};

/**
 * Smart skill extraction: Extract required skills from a job description / role
 */
export const extractSkillsFromJob = (title = '', description = '', roleSkills = []) => {
  const combinedText = `${title} ${description}`.toLowerCase();
  const matched = new Set();

  // First check role's required skills
  roleSkills.forEach(skillObj => {
    const sName = typeof skillObj === 'string' ? skillObj : skillObj.name;
    if (sName && combinedText.includes(sName.toLowerCase())) {
      matched.add(sName);
    }
  });

  // Also check top common skills in our global dictionary
  allSkills.slice(0, 50).forEach(s => {
    if (combinedText.includes(s.toLowerCase())) {
      matched.add(s);
    }
  });

  // If few skills detected, ensure at least 4-6 role skills are provided for meaningful comparison
  if (matched.size < 4 && roleSkills.length > 0) {
    roleSkills.slice(0, 5).forEach(s => {
      const sName = typeof s === 'string' ? s : s.name;
      if (sName) matched.add(sName);
    });
  }

  return Array.from(matched);
};

/**
 * Format relative date (e.g. "2 days ago")
 */
const formatPostedDate = (dateStr) => {
  if (!dateStr) return 'Recently posted';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently posted';
    const diffMs = Date.now() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  } catch {
    return 'Recently posted';
  }
};

/**
 * 1. Fetch Real-time Jobs from JSearch API (RapidAPI)
 */
export const fetchJSearchJobs = async (roleName, location = 'India', customKey = '') => {
  const apiKey = customKey || ENV_RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error('RapidAPI Key is missing for JSearch');
  }

  const query = `${roleName} in ${location}`;
  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=1&employment_types=FULLTIME,INTERN`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey.trim(),
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`JSearch API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  if (!data.data || !Array.isArray(data.data)) {
    return [];
  }

  const matchedRole = industryRoles.find(r => r.role_name.toLowerCase() === roleName.toLowerCase()) || {};
  const roleRequiredSkills = matchedRole.required_skills || [];

  return data.data.map((job, idx) => {
    const platform = job.job_publisher || 'Google for Jobs';
    const styling = getPlatformStyle(platform);

    const locationStr = [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ') || (job.job_is_remote ? 'Remote' : location);
    
    // Format salary if available
    let salaryStr = 'Competitive';
    if (job.job_min_salary && job.job_max_salary) {
      salaryStr = `${job.job_salary_currency || '₹'} ${job.job_min_salary.toLocaleString()} - ${job.job_max_salary.toLocaleString()}`;
      if (job.job_salary_period) salaryStr += ` / ${job.job_salary_period.toLowerCase()}`;
    }

    const skills = extractSkillsFromJob(job.job_title, job.job_description, roleRequiredSkills);

    return {
      id: job.job_id || `jsearch-${idx}-${Date.now()}`,
      title: job.job_title,
      company: job.employer_name || 'Hiring Company',
      companyLogo: job.employer_logo || null,
      platform: styling.name,
      platformStyle: styling.bg,
      location: locationStr,
      isRemote: Boolean(job.job_is_remote),
      type: job.job_employment_type === 'INTERN' ? 'Internship' : 'Full-time',
      salary: salaryStr,
      requiredSkills: skills,
      posted: formatPostedDate(job.job_posted_at_datetime_utc),
      applyUrl: job.job_apply_link || job.job_google_link || '#',
      description: job.job_description || '',
      source: 'JSearch (Google for Jobs)',
    };
  });
};

/**
 * 2. Fetch Live Jobs from Adzuna API (developer.adzuna.com)
 */
export const fetchAdzunaJobs = async (roleName, country = 'in', customAppId = '', customAppKey = '') => {
  const appId = customAppId || ENV_ADZUNA_APP_ID;
  const appKey = customAppKey || ENV_ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error('Adzuna App ID and App Key are missing');
  }

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${encodeURIComponent(appId.trim())}&app_key=${encodeURIComponent(appKey.trim())}&what=${encodeURIComponent(roleName)}&results_per_page=10&content-type=application/json`;

  const response = await fetch(url);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Adzuna API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  if (!data.results || !Array.isArray(data.results)) {
    return [];
  }

  const matchedRole = industryRoles.find(r => r.role_name.toLowerCase() === roleName.toLowerCase()) || {};
  const roleRequiredSkills = matchedRole.required_skills || [];

  return data.results.map((job, idx) => {
    let salaryStr = 'Industry Standard';
    if (job.salary_min && job.salary_max) {
      salaryStr = `₹${Math.round(job.salary_min / 100000)}L - ₹${Math.round(job.salary_max / 100000)}L / yr`;
    } else if (job.salary_is_predicted === '1') {
      salaryStr = 'Competitive (Estimated)';
    }

    const skills = extractSkillsFromJob(job.title, job.description, roleRequiredSkills);
    const styling = getPlatformStyle('Adzuna');

    return {
      id: job.id ? `adzuna-${job.id}` : `adzuna-${idx}-${Date.now()}`,
      title: job.title.replace(/<\/?[^>]+(>|$)/g, ''), // strip any HTML tags
      company: job.company?.display_name || 'Leading Enterprise',
      companyLogo: null,
      platform: 'Adzuna',
      platformStyle: styling.bg,
      location: job.location?.display_name || 'India',
      isRemote: (job.title + job.description).toLowerCase().includes('remote'),
      type: job.contract_time === 'part_time' ? 'Part-time' : 'Full-time',
      salary: salaryStr,
      requiredSkills: skills,
      posted: formatPostedDate(job.created),
      applyUrl: job.redirect_url || '#',
      description: job.description ? job.description.replace(/<\/?[^>]+(>|$)/g, '') : '',
      source: 'Adzuna Official API',
    };
  });
};

/**
 * 3. Unified Master Fetcher for Job Market Insights
 * Exclusively queries live JSearch (RapidAPI) and Adzuna APIs
 */
export const fetchJobMarketInsights = async ({
  roleId,
  roleName,
  location = 'India',
  provider = 'auto', // 'auto' | 'both' | 'jsearch' | 'adzuna'
  customRapidApiKey = '',
  customAdzunaAppId = '',
  customAdzunaAppKey = '',
  forceRefresh = false
}) => {
  const cacheKey = `${roleId || roleName}-${location}-${provider}`;

  if (!forceRefresh && jobCache.has(cacheKey)) {
    const cached = jobCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const role = industryRoles.find(r => r.id === roleId || r.role_name === roleName) || industryRoles[0];
  const queryRole = roleName || role.role_name;

  const hasJSearchKey = Boolean(customRapidApiKey || ENV_RAPIDAPI_KEY);
  const hasAdzunaKeys = Boolean((customAdzunaAppId || ENV_ADZUNA_APP_ID) && (customAdzunaAppKey || ENV_ADZUNA_APP_KEY));

  let jsearchResults = [];
  let adzunaResults = [];
  let activeProviders = [];
  let errorMessage = '';

  if (!hasJSearchKey && !hasAdzunaKeys) {
    return {
      jobs: [],
      provider: 'API Key Required',
      hasLiveApiConfigured: false,
      hasJSearch: false,
      hasAdzuna: false,
      error: 'Please configure your RapidAPI (JSearch) or Adzuna API key in Settings or .env to view real-time jobs.',
      timestamp: Date.now()
    };
  }

  // Determine which APIs to run
  const runJSearch = (provider === 'auto' || provider === 'both' || provider === 'jsearch') && hasJSearchKey;
  const runAdzuna = (provider === 'auto' || provider === 'both' || provider === 'adzuna') && hasAdzunaKeys;

  // Run in parallel for maximum performance
  const promises = [];
  if (runJSearch) {
    promises.push(
      fetchJSearchJobs(queryRole, location, customRapidApiKey)
        .then(res => { jsearchResults = res || []; })
        .catch(err => {
          console.warn('JSearch query failed:', err.message);
          errorMessage = err.message;
        })
    );
  }
  if (runAdzuna) {
    promises.push(
      fetchAdzunaJobs(queryRole, 'in', customAdzunaAppId, customAdzunaAppKey)
        .then(res => { adzunaResults = res || []; })
        .catch(err => {
          console.warn('Adzuna query failed:', err.message);
          if (!errorMessage) errorMessage = err.message;
        })
    );
  }

  if (promises.length > 0) {
    await Promise.allSettled(promises);
  }

  // Interleave and merge live results
  let finalJobs = [];
  if (jsearchResults.length > 0 && adzunaResults.length > 0) {
    activeProviders.push('JSearch (LinkedIn/Indeed)', 'Adzuna');
    const maxLen = Math.max(jsearchResults.length, adzunaResults.length);
    for (let i = 0; i < maxLen; i++) {
      if (jsearchResults[i]) finalJobs.push(jsearchResults[i]);
      if (adzunaResults[i]) finalJobs.push(adzunaResults[i]);
    }
  } else if (jsearchResults.length > 0) {
    activeProviders.push('JSearch (Google for Jobs)');
    finalJobs = jsearchResults;
  } else if (adzunaResults.length > 0) {
    activeProviders.push('Adzuna API');
    finalJobs = adzunaResults;
  }

  let providerLabel = 'Live Feed';
  if (activeProviders.length > 1) {
    providerLabel = 'JSearch + Adzuna Live Feed';
  } else if (activeProviders.length === 1) {
    providerLabel = activeProviders[0];
  } else {
    providerLabel = 'No Live Data';
  }

  const resultPayload = {
    jobs: finalJobs.slice(0, 10),
    provider: providerLabel,
    hasLiveApiConfigured: hasJSearchKey || hasAdzunaKeys,
    hasJSearch: hasJSearchKey,
    hasAdzuna: hasAdzunaKeys,
    error: errorMessage,
    timestamp: Date.now()
  };

  jobCache.set(cacheKey, { data: resultPayload, timestamp: Date.now() });
  return resultPayload;
};
