/**
 * Student Dashboard - Sleek Black & Grey Theme with Images
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyzeT7LearningHub } from '../../services/geminiService';
import { saveAnalysis, getLatestAnalysis, getVideoLearning, getVideoLearningSkills } from '../../services/firestoreService';
import { industryRoles, allSkills, branches, years } from '../../data/industrySkills';
import { getJobsForRole } from '../../data/jobListings';
import { 
  LogOut,
  Search,
  X,
  Loader2,
  ChevronDown,
  ArrowRight,
  Check,
  Briefcase,
  GraduationCap,
  Sparkles,
  Rocket,
  Target,
  TrendingUp,
  Zap,
  Star,
  Copy,
  CheckCircle,
  Youtube,
  RefreshCw,
  ExternalLink,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  Compass
} from 'lucide-react';

const StudentDashboard = () => {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [branch, setBranch] = useState(userProfile?.branch || '');
  const [year, setYear] = useState(userProfile?.year || '');
  const [selectedSkills, setSelectedSkills] = useState(userProfile?.skills || []);
  const [careerInterest, setCareerInterest] = useState(userProfile?.career_interest || '');
  const [resumeFile, setResumeFile] = useState(null);
  
  // UI state
  const [skillSearch, setSkillSearch] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [lastAnalysis, setLastAnalysis] = useState(null);

  // Sync userProfile into local form state once it loads (fixes re-login showing empty form)
  useEffect(() => {
    if (userProfile) {
      if (userProfile.branch) setBranch(userProfile.branch);
      if (userProfile.year) setYear(String(userProfile.year));
      if (userProfile.skills?.length > 0) setSelectedSkills(userProfile.skills);
      if (userProfile.career_interest) setCareerInterest(userProfile.career_interest);
    }
  }, [userProfile?.uid]); // Only run when a new user profile loads (not on every profile update)

  // Job Market state
  const [jobListings, setJobListings] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // Load jobs when career interest changes
  useEffect(() => {
    if (careerInterest) {
      setJobListings(getJobsForRole(careerInterest));
      setSelectedJob(null);
    } else {
      setJobListings([]);
      setSelectedJob(null);
    }
  }, [careerInterest]);

  // T7 ID & YouTube learning state
  const [copied, setCopied] = useState(false);
  const [videoLearning, setVideoLearning] = useState([]);
  const [ytSkills, setYtSkills] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    const loadLastAnalysis = async () => {
      if (currentUser) {
        const analysis = await getLatestAnalysis(currentUser.uid);
        setLastAnalysis(analysis);
      }
    };
    loadLastAnalysis();
  }, [currentUser]);

  // Fetch YouTube learning data and auto-merge skills
  // Uses t7Id because extension syncs to users/{t7Id}/videoLearning
  useEffect(() => {
    const loadVideoLearning = async () => {
      if (!userProfile?.t7Id) return;
      setLoadingVideos(true);
      try {
        const videos = await getVideoLearning(userProfile.t7Id);
        setVideoLearning(videos);

        const skills = await getVideoLearningSkills(userProfile.t7Id);
        setYtSkills(skills);

        // Auto-merge YouTube skills into selected skills (no duplicates)
        if (skills.length > 0) {
          setSelectedSkills(prev => {
            const combined = [...prev];
            skills.forEach(skill => {
              if (!combined.some(s => s.toLowerCase() === skill.toLowerCase())) {
                combined.push(skill);
              }
            });
            return combined;
          });
        }
      } catch (err) {
        console.error('Error loading video learning:', err);
      } finally {
        setLoadingVideos(false);
      }
    };
    loadVideoLearning();
  }, [userProfile?.t7Id]);

  const copyT7Id = () => {
    if (userProfile?.t7Id) {
      navigator.clipboard.writeText(userProfile.t7Id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const refreshVideoLearning = async () => {
    if (!userProfile?.t7Id) return;
    setLoadingVideos(true);
    try {
      const videos = await getVideoLearning(userProfile.t7Id);
      setVideoLearning(videos);
      const skills = await getVideoLearningSkills(userProfile.t7Id);
      setYtSkills(skills);
      if (skills.length > 0) {
        setSelectedSkills(prev => {
          const combined = [...prev];
          skills.forEach(skill => {
            if (!combined.some(s => s.toLowerCase() === skill.toLowerCase())) {
              combined.push(skill);
            }
          });
          return combined;
        });
      }
    } catch (err) {
      console.error('Error refreshing video learning:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const filteredSkills = allSkills.filter(skill =>
    skill.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  // Branch → relevant career roles mapping
  const branchCareerMap = {
    'Computer Science': ['frontend-developer', 'backend-developer', 'fullstack-developer', 'data-analyst', 'ai-ml-engineer', 'devops-engineer', 'mobile-developer', 'cloud-engineer'],
    'Information Technology': ['frontend-developer', 'backend-developer', 'fullstack-developer', 'data-analyst', 'devops-engineer', 'mobile-developer', 'cloud-engineer', 'iot-architect'],
    'Electronics & Communication': ['embedded-systems-engineer', 'vlsi-design-engineer', 'telecom-engineer', 'iot-architect', 'robotics-engineer', 'ai-ml-engineer', 'fullstack-developer', 'data-analyst'],
    'Electrical Engineering': ['power-systems-engineer', 'control-systems-engineer', 'instrumentation-engineer', 'renewable-energy-engineer', 'embedded-systems-engineer', 'robotics-engineer', 'ai-ml-engineer', 'data-analyst'],
    'Mechanical Engineering': ['mechanical-design-engineer', 'automotive-engineer', 'hvac-engineer', 'manufacturing-engineer', 'quality-engineer', 'robotics-engineer', 'data-analyst', 'ai-ml-engineer'],
    'Civil Engineering': ['structural-engineer', 'construction-manager', 'environmental-engineer', 'transportation-engineer', 'data-analyst', 'fullstack-developer'],
    'Chemical Engineering': ['process-engineer', 'chemical-rd-scientist', 'environmental-health-safety', 'quality-engineer', 'data-analyst', 'ai-ml-engineer'],
    'Biotechnology': ['biotech-research', 'biomedical-engineer', 'clinical-research', 'pharma-production', 'data-analyst', 'ai-ml-engineer', 'process-engineer'],
    'Other': industryRoles.map(r => r.id)
  };

  const filteredRoles = branch
    ? industryRoles.filter(role => (branchCareerMap[branch] || []).includes(role.id))
    : industryRoles;

  // Reset career interest when branch changes and role is no longer relevant
  useEffect(() => {
    if (branch && careerInterest) {
      const allowedIds = branchCareerMap[branch] || [];
      if (!allowedIds.includes(careerInterest)) {
        setCareerInterest('');
      }
    }
  }, [branch]);

  const handleAnalyze = async () => {
    setError('');
    
    if (!branch || !year || selectedSkills.length === 0 || !careerInterest) {
      setError('Please complete all fields before analyzing');
      return;
    }

    setAnalyzing(true);

    try {
      await updateUserProfile(currentUser.uid, {
        branch,
        year: parseInt(year),
        skills: selectedSkills,
        career_interest: careerInterest
      });

      const selectedRole = industryRoles.find(r => r.id === careerInterest);
      
      const analysisResult = await analyzeT7LearningHub(
        selectedSkills,
        selectedRole,
        industryRoles,
        resumeFile
      );

      await saveAnalysis(currentUser.uid, {
        career_role: selectedRole.role_name,
        ...analysisResult
      });

      navigate('/results', { state: { analysis: analysisResult, role: selectedRole, userSkills: selectedSkills } });
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setResumeFile(null);
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload your resume as a PDF or Word document.');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Resume file must be under 10MB.');
      e.target.value = '';
      return;
    }

    setError('');
    setResumeFile(file);
  };

  const viewPreviousResults = () => {
    if (lastAnalysis) {
      const role = industryRoles.find(r => r.role_name === lastAnalysis.career_role);
      navigate('/results', { state: { analysis: lastAnalysis, role, userSkills: selectedSkills } });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-zinc-900 text-lg">T7 Learning Hub</span>
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-zinc-900">{userProfile?.name}</p>
              <p className="text-xs text-zinc-500">{userProfile?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 mb-2 flex items-center gap-3">
              Hey, {userProfile?.name?.split(' ')[0]}! 
              <span className="text-3xl">👋</span>
            </h1>
            <p className="text-zinc-600 text-lg">Let's analyze your placement readiness</p>
          </div>
          
          {/* Quick stats */}
          <div className="flex gap-4">
            <div className="px-4 py-3 bg-white rounded-xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Skills</span>
              </div>
              <p className="text-2xl font-black text-zinc-900">{selectedSkills.length}</p>
            </div>
            <div className="px-4 py-3 bg-white rounded-xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <Star className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Ready</span>
              </div>
              <p className="text-2xl font-black text-zinc-900">{lastAnalysis?.readiness_score || '—'}%</p>
            </div>
          </div>
        </div>

        {/* T7 Unique ID Card */}
        {userProfile?.t7Id && (
          <div className="mb-6 p-5 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl shadow-xl border border-zinc-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                  <Sparkles className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Your T7 Account ID</p>
                  <p className="text-2xl font-black text-white tracking-widest font-mono">{userProfile.t7Id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={copyT7Id}
                  className={`px-5 py-2.5 font-bold rounded-xl transition-all flex items-center gap-2 ${
                    copied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-white text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  {copied ? (
                    <><CheckCircle className="w-4 h-4" /> Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4" /> Copy ID</>
                  )}
                </button>
              </div>
            </div>
            <p className="text-zinc-400 text-sm mt-3 flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Paste this ID in the <span className="text-white font-semibold">T7 Extension → Settings → Account ID</span> to sync your YouTube learning
            </p>
          </div>
        )}

        {/* Previous Analysis Banner */}
        {lastAnalysis && (
          <div className="mb-6 p-5 bg-zinc-900 rounded-2xl shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-2xl font-black text-white">{lastAnalysis.readiness_score}%</span>
              </div>
              <div>
                <p className="font-bold text-white text-lg">Previous analysis ready! 🎉</p>
                <p className="text-zinc-400">{lastAnalysis.career_role}</p>
              </div>
            </div>
            <button
              onClick={viewPreviousResults}
              className="px-5 py-2.5 bg-white text-zinc-900 font-bold rounded-xl hover:bg-zinc-100 transition-all flex items-center gap-2"
            >
              View results
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* YouTube Learning Tracker */}
        <div className="mb-6 bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                <Youtube className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-zinc-900 text-lg">YouTube Learning Tracker</h2>
                <p className="text-sm text-zinc-500">
                  <span className="text-zinc-900 font-bold">{videoLearning.length}</span> videos analyzed · <span className="text-zinc-900 font-bold">{ytSkills.length}</span> skills learned
                </p>
              </div>
            </div>
            <button
              onClick={refreshVideoLearning}
              disabled={loadingVideos}
              className="p-2.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loadingVideos ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingVideos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              <span className="ml-2 text-zinc-500">Loading your learning data...</span>
            </div>
          ) : videoLearning.length === 0 ? (
            <div className="text-center py-8 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200">
              <Youtube className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-600 font-medium mb-1">No videos analyzed yet</p>
              <p className="text-zinc-400 text-sm">Use the T7 extension on YouTube to analyze videos & sync skills here</p>
            </div>
          ) : (
            <>
              {/* Skills from YouTube */}
              {ytSkills.length > 0 && (
                <div className="mb-4 pb-4 border-b border-zinc-100">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3">🎥 Skills Learned from YouTube</p>
                  <div className="flex flex-wrap gap-2">
                    {ytSkills.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-semibold border border-red-100"
                      >
                        <Youtube className="w-3 h-3" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Videos */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {videoLearning.slice(0, 8).map(video => (
                  <div key={video.id} className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-zinc-300 transition-colors">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Youtube className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-900 text-sm truncate">{video.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-500">
                          ⭐ {typeof video.rating === 'number' ? video.rating.toFixed(1) : video.rating}
                        </span>
                        {video.topSkills?.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {video.topSkills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="text-xs bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {video.videoId && (
                      <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-xl text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Career */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 text-lg">Your Profile</h2>
                  <p className="text-sm text-zinc-500">Academic details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">Branch</label>
                  <div className="relative">
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl appearance-none focus:border-zinc-900 outline-none text-zinc-900 font-medium"
                    >
                      <option value="">Select branch</option>
                      {branches.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">Year</label>
                  <div className="grid grid-cols-4 gap-2">
                    {years.map(y => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setYear(y)}
                        className={`py-3 text-sm font-bold rounded-xl transition-all ${
                          year === y
                            ? 'bg-zinc-900 text-white shadow-lg'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Career Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 text-lg">Dream Career</h2>
                  <p className="text-sm text-zinc-500">
                    {branch ? `Top roles for ${branch}` : 'Select a branch first'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {filteredRoles.length === 0 ? (
                  <div className="text-center py-6 text-zinc-400 text-sm">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Select your branch to see relevant career paths
                  </div>
                ) : filteredRoles.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setCareerInterest(role.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between ${
                      careerInterest === role.id
                        ? 'bg-zinc-900 text-white shadow-lg'
                        : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-100'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{role.role_name}</p>
                      <p className={`text-sm mt-0.5 ${careerInterest === role.id ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {role.required_skills.length} skills required
                      </p>
                    </div>
                    {careerInterest === role.id && (
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 text-lg">ATS Resume Check</h2>
                  <p className="text-sm text-zinc-500">Optional, but recommended</p>
                </div>
              </div>

              <label className="block">
                <span className="block text-sm font-semibold text-zinc-700 mb-2">Upload Resume</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleResumeChange}
                  className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-900 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-800"
                />
              </label>

              <div className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-medium text-zinc-800">
                  {resumeFile ? resumeFile.name : 'No resume uploaded yet'}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  We will score ATS fit, keyword match, formatting, and rewrite suggestions directly inside your results.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Skills */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-zinc-900 text-lg">Your Skills</h2>
                    <p className="text-sm text-zinc-500">
                      <span className="text-zinc-900 font-bold">{selectedSkills.length}</span> selected
                    </p>
                  </div>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=100&fit=crop" 
                  alt="" 
                  className="w-14 h-14 rounded-xl object-cover hidden sm:block"
                />
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none text-zinc-900 font-medium placeholder:text-zinc-400"
                />
              </div>

              {/* Selected Skills */}
              {selectedSkills.length > 0 && (
                <div className="mb-4 pb-4 border-b-2 border-zinc-100">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">✨ Selected Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map(skill => {
                      const isFromYt = ytSkills.some(ys => ys.toLowerCase() === skill.toLowerCase());
                      return (
                        <span
                          key={skill}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                            isFromYt 
                              ? 'bg-red-600 text-white' 
                              : 'bg-zinc-900 text-white'
                          }`}
                        >
                          {isFromYt && <Youtube className="w-3.5 h-3.5" />}
                          {skill}
                          <button
                            onClick={() => toggleSkill(skill)}
                            className="hover:bg-white/20 rounded-full p-0.5"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Skills */}
              <div className="max-h-56 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {filteredSkills.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      disabled={selectedSkills.includes(skill)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        selectedSkills.includes(skill)
                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Analyze Button */}
              <div className="mt-6 pt-6 border-t-2 border-zinc-100">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3 text-lg"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Analyzing skills{resumeFile ? ' + resume' : ''}...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-6 h-6" />
                      Analyze my profile
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-center text-sm text-zinc-500 mt-4 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Powered by Google Gemini AI
                </p>
              </div>
            </div>

            {/* Job Market Insights */}
            {jobListings.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100 mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
                    <Compass className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-zinc-900 text-lg">Job Market Insights</h2>
                    <p className="text-sm text-zinc-500">Live roles matching your dream career</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {jobListings.map(job => {
                    const matchedJobSkills = job.requiredSkills.filter(s => selectedSkills.includes(s));
                    const missingJobSkills = job.requiredSkills.filter(s => !selectedSkills.includes(s));
                    const matchPercentage = Math.round((matchedJobSkills.length / job.requiredSkills.length) * 100);

                    return (
                      <div key={job.id} className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 hover:bg-white hover:border-zinc-300 transition-all shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${job.platformColor}`}>
                            {job.platform}
                          </span>
                          <span className="text-xs font-semibold text-zinc-500 bg-white border border-zinc-200 px-2 py-1 rounded-md">
                            {job.posted}
                          </span>
                        </div>
                        <h3 className="font-bold text-zinc-900 text-base mb-1">{job.title}</h3>
                        <div className="flex items-center text-xs text-zinc-500 gap-3 mb-3">
                          <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {job.company}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-zinc-600">Skill Match</span>
                            <span className={matchPercentage >= 70 ? 'text-emerald-600' : matchPercentage >= 40 ? 'text-amber-600' : 'text-red-600'}>
                              {matchPercentage}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${matchPercentage >= 70 ? 'bg-emerald-500' : matchPercentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${matchPercentage}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            selectedJob?.id === job.id 
                              ? 'bg-zinc-900 text-white' 
                              : 'bg-white border-2 border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'
                          }`}
                        >
                          <Target className="w-4 h-4" />
                          Compare & Plan
                        </button>

                        {/* Expandable Comparison Section */}
                        {selectedJob?.id === job.id && (
                          <div className="mt-4 pt-4 border-t border-zinc-200 space-y-4">
                            <div>
                              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">✅ Skills You Have</p>
                              <div className="flex flex-wrap gap-1.5">
                                {matchedJobSkills.length > 0 ? matchedJobSkills.map(skill => (
                                  <span key={skill} className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> {skill}
                                  </span>
                                )) : <span className="text-xs text-zinc-400 font-medium italic">No matched skills yet</span>}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">❌ Skills Missing (What to learn)</p>
                              <div className="flex flex-wrap gap-1.5">
                                {missingJobSkills.length > 0 ? missingJobSkills.map(skill => (
                                  <span key={skill} className="text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-md flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> {skill}
                                  </span>
                                )) : <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> You meet all requirements!</span>}
                              </div>
                            </div>

                            {missingJobSkills.length > 0 && (
                              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 mt-2">
                                <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                                  <TrendingUp className="w-3.5 h-3.5" /> Recommended Next Step
                                </p>
                                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                  Focus on learning <strong className="font-extrabold">{missingJobSkills[0]}</strong> first. Find introductory tutorials on YouTube to add it to your profile.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
