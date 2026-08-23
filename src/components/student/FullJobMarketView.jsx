import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, RefreshCw, Compass, Building2, MapPin, 
  ExternalLink, Target, CheckCircle2, XCircle, TrendingUp, 
  Loader2, Filter, ChevronDown, Briefcase
} from 'lucide-react';
import { fetchJobMarketInsights, isJobRelevantForRole } from '../../services/jobMarketService';
import { industryRoles } from '../../data/industrySkills';

const FullJobMarketView = ({ 
  careerInterest, 
  userSkills = [], 
  onBack,
  initialSource = 'auto'
}) => {
  const [activeRoleId, setActiveRoleId] = useState(careerInterest || industryRoles[0]?.id || 'frontend-developer');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedSource, setSelectedSource] = useState(initialSource);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [activeSources, setActiveSources] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const selectedRole = activeRoleId === 'all' 
    ? { id: 'all', role_name: 'All Tech Roles', required_skills: [] }
    : (industryRoles.find(r => r.id === activeRoleId) || industryRoles[0]);

  // Initial load or role/source change
  const loadInitialJobs = async (forceRefresh = false) => {
    setLoading(true);
    setError('');
    setPage(1);
    try {
      const data = await fetchJobMarketInsights({
        roleId: activeRoleId,
        roleName: selectedRole.role_name,
        provider: selectedSource,
        page: 1,
        forceRefresh
      });
      setJobs(data.jobs || []);
      setActiveSources(data.activeSources || []);
      if (data.error && (!data.jobs || data.jobs.length === 0)) {
        setError(data.error);
      }
      setHasMore((data.jobs || []).length >= 8);
    } catch (err) {
      console.error('Error loading full job board:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialJobs();
  }, [activeRoleId, selectedSource]);

  // Load next page of jobs
  const handleLoadMore = async () => {
    if (loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await fetchJobMarketInsights({
        roleId: activeRoleId,
        roleName: selectedRole.role_name,
        provider: selectedSource,
        page: nextPage,
        forceRefresh: true
      });
      const newJobs = data.jobs || [];
      if (newJobs.length > 0) {
        // Prevent duplicate job IDs
        setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const filtered = newJobs.filter(j => !existingIds.has(j.id));
          return [...prev, ...filtered];
        });
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn('Error loading more jobs:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Filter jobs by role relevance, search query & selected source
  const filteredJobs = jobs.filter(job => {
    // 1. Strict Role Relevance check
    if (!isJobRelevantForRole(job.title, job.description, selectedRole.role_name)) {
      return false;
    }

    // 2. Source filter check
    if (selectedSource !== 'auto') {
      const p = (job.platform || job.source || '').toLowerCase();
      if (selectedSource === 'jsearch' && !p.includes('jsearch') && !p.includes('linkedin') && !p.includes('indeed') && !p.includes('glassdoor') && !p.includes('google')) return false;
      if (selectedSource === 'adzuna' && !p.includes('adzuna')) return false;
      if (selectedSource === 'jooble' && !p.includes('jooble')) return false;
      if (selectedSource === 'arbeitnow' && !p.includes('arbeitnow')) return false;
      if (selectedSource === 'themuse' && !p.includes('muse')) return false;
    }

    // 3. Search query check
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (job.title && job.title.toLowerCase().includes(q)) ||
      (job.company && job.company.toLowerCase().includes(q)) ||
      (job.location && job.location.toLowerCase().includes(q)) ||
      (job.requiredSkills && job.requiredSkills.some(s => s.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="min-h-screen bg-zinc-50 pb-16 animate-fade-in">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <div className="hidden sm:block h-5 w-px bg-zinc-200" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                  {selectedRole.role_name} Jobs
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Feed
                </span>
              </div>
              <p className="text-xs text-zinc-500 hidden md:block">
                Aggregated from LinkedIn, Indeed, Glassdoor, Adzuna, Jooble, Arbeitnow & The Muse
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
            {/* Career Role Selector Dropdown */}
            <div className="relative">
              <select
                value={activeRoleId}
                onChange={(e) => setActiveRoleId(e.target.value)}
                className="px-3.5 py-2 pr-9 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none cursor-pointer appearance-none shadow-xs transition-all"
                title="Select Career Role"
              >
                <option value="all">🌟 All Roles (Explore All Jobs)</option>
                {industryRoles.map(role => (
                  <option key={role.id} value={role.id}>
                    🎯 {role.role_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Refresh */}
            <button
              type="button"
              onClick={() => loadInitialJobs(true)}
              disabled={loading}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Fetching...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 bg-zinc-50/70 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, company or skill..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-xs"
            />
          </div>

          {/* Source Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'auto', label: '⚡ All Sources' },
              { id: 'jsearch', label: '💼 JSearch (LinkedIn/Indeed)' },
              { id: 'adzuna', label: '🏢 Adzuna' },
              { id: 'jooble', label: '🔍 Jooble' },
              { id: 'arbeitnow', label: '🌐 Arbeitnow' },
              { id: 'themuse', label: '🏛️ The Muse' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedSource(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSource === tab.id
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-xs font-bold text-zinc-600">
            Showing <span className="text-zinc-900">{filteredJobs.length}</span> live matching opportunities for <span className="text-zinc-900 font-extrabold">{selectedRole.role_name}</span>
          </p>
          {activeSources.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-zinc-500 font-medium">
              <span>Feeds connected:</span>
              {activeSources.map(s => (
                <span key={s} className="bg-zinc-200/70 text-zinc-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-zinc-900 mb-3" />
            <p className="text-base font-bold text-zinc-900">Fetching live {selectedRole.role_name} postings...</p>
            <p className="text-xs text-zinc-500 mt-1">Querying LinkedIn, Indeed, Glassdoor, Adzuna, Jooble & top enterprise boards</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200 max-w-lg mx-auto shadow-xs">
            <Compass className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
            <h3 className="text-base font-bold text-zinc-900 mb-1">No matching jobs found</h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
              {searchQuery ? `No results matched "${searchQuery}". Try a different keyword.` : 'No live roles found for this filter. Try selecting "All Sources" or refreshing.'}
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedSource('auto'); loadInitialJobs(true); }}
              className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Reset Filters & Refresh
            </button>
          </div>
        ) : (
          <div>
            {/* Grid of Job Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {filteredJobs.map((job, idx) => {
                const matchedJobSkills = job.requiredSkills.filter(s => userSkills.includes(s));
                const missingJobSkills = job.requiredSkills.filter(s => !userSkills.includes(s));
                const matchPercentage = job.requiredSkills.length > 0
                  ? Math.round((matchedJobSkills.length / job.requiredSkills.length) * 100)
                  : 0;

                return (
                  <div
                    key={job.id || idx}
                    className="border border-zinc-200 rounded-2xl p-5 bg-white hover:border-zinc-400 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex justify-between items-start mb-3 gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${job.platformStyle || 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
                          {job.platform}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {job.source && (
                            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                              {job.source.includes('JSearch') ? 'via JSearch' : job.source.includes('Adzuna') ? 'via Adzuna' : job.source.includes('Jooble') ? 'via Jooble' : 'Live Feed'}
                            </span>
                          )}
                          {job.salary && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                              {job.salary}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-md">
                            {job.posted}
                          </span>
                        </div>
                      </div>

                      {/* Title & Company */}
                      <h3 className="font-bold text-zinc-900 text-base mb-1.5 leading-snug line-clamp-2">
                        {job.title}
                      </h3>
                      <div className="flex items-center text-xs text-zinc-500 gap-3 mb-4 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-zinc-800">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" /> {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {job.location}
                        </span>
                        {job.type && (
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded text-[10px] font-semibold">
                            {job.type}
                          </span>
                        )}
                      </div>

                      {/* Skill Match Bar */}
                      <div className="mb-4 bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className="text-zinc-600">Your Placement Match</span>
                          <span className={matchPercentage >= 70 ? 'text-emerald-600 font-bold' : matchPercentage >= 40 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'}>
                            {matchPercentage}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${matchPercentage >= 70 ? 'bg-emerald-500' : matchPercentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${matchPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            selectedJob?.id === job.id 
                              ? 'bg-zinc-900 text-white shadow-sm' 
                              : 'bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'
                          }`}
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>{selectedJob?.id === job.id ? 'Close Plan' : 'Compare & Plan'}</span>
                        </button>

                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <span>Apply ↗</span>
                        </a>
                      </div>

                      {/* Expandable Comparison Section */}
                      {selectedJob?.id === job.id && (
                        <div className="mt-4 pt-4 border-t border-zinc-200 space-y-3.5 animate-fade-in text-left">
                          <div>
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">✅ Skills You Have</p>
                            <div className="flex flex-wrap gap-1.5">
                              {matchedJobSkills.length > 0 ? matchedJobSkills.map(skill => (
                                <span key={skill} className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> {skill}
                                </span>
                              )) : <span className="text-xs text-zinc-400 font-medium italic">No matching skills selected yet</span>}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">❌ Skills Missing</p>
                            <div className="flex flex-wrap gap-1.5">
                              {missingJobSkills.length > 0 ? missingJobSkills.map(skill => (
                                <span key={skill} className="text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-md flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> {skill}
                                </span>
                              )) : <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> You meet all requirements!</span>}
                            </div>
                          </div>

                          {missingJobSkills.length > 0 && (
                            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/70">
                              <p className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-amber-700" /> Actionable Step
                              </p>
                              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                Prioritize <strong className="font-extrabold text-amber-950">{missingJobSkills[0]}</strong> to boost your match score.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading More Roles from APIs...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Jobs</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Fetches additional live postings directly from JSearch, Adzuna, Jooble, Arbeitnow & The Muse
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FullJobMarketView;
