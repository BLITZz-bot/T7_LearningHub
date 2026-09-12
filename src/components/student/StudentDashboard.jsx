/**
 * Student Dashboard - Sleek Black & Grey Theme with Images
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyzeStudentProfile } from '../../services/lyzrAgentService';
import { saveAnalysis, getLatestAnalysis, getVideoLearning, getVideoLearningSkills } from '../../services/apiService';
import { industryRoles, allSkills, BRANCH_CAREER_MAP } from '../../data/industrySkills';
import { fetchJobMarketInsights } from '../../services/jobMarketService';
import StudentProfileModal from './StudentProfileModal';
import YouTubeTrackerModal from './YouTubeTrackerModal';
import FullJobMarketView from './FullJobMarketView';
// ModelSelector removed — LYZR manages AI models internally
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
  Compass,
  Phone,
  Mail,
  Download,
  Calendar,
  User,
  Settings,
  Globe,
  Key,
  FileText,
  Moon,
  Sun,
  Lightbulb,
  Trophy
} from 'lucide-react';


const StudentDashboard = () => {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Profile modal & dropdown state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalEditMode, setProfileModalEditMode] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form state - Branch & Year are automatically sourced from the student's profile
  const userBranch = userProfile?.branch || '';
  const userYear = userProfile?.passoutYear || userProfile?.year || '';
  const [selectedSkills, setSelectedSkills] = useState(userProfile?.skills || []);
  const [careerInterest, setCareerInterest] = useState(userProfile?.career_interest || '');
  const [resumeFile, setResumeFile] = useState(null);
  
  // UI state
  const [skillSearch, setSkillSearch] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [isStartFromScratch, setIsStartFromScratch] = useState(false);

  // Dark mode — persisted in localStorage
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('t7_dark_mode') === 'true');
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('t7_dark_mode', String(next));
      return next;
    });
  };

  // Current selected role object
  const selectedRole = industryRoles.find(r => r.id === careerInterest);

  // Check if current selected role matches the last analyzed role
  const isMatchingRole = Boolean(
    lastAnalysis && (!careerInterest || !lastAnalysis.career_role || selectedRole?.role_name === lastAnalysis.career_role || selectedRole?.id === lastAnalysis.career_role)
  );

  // Earned skill badges & today's focus — displayed for the active analyzed role
  const earnedBadges = (isMatchingRole ? lastAnalysis?.matched_skills : null)?.slice(0, 6) || [];
  const atsScore = lastAnalysis?.ats_analysis?.score || null;
  const todayTasks = (isMatchingRole ? lastAnalysis?.quick_wins : null)?.slice(0, 3) || [];

  // Sync userProfile skills and career interest when user profile loads
  useEffect(() => {
    if (userProfile) {
      if (userProfile.skills?.length > 0 && selectedSkills.length === 0) {
        setSelectedSkills(userProfile.skills);
      }
      if (userProfile.career_interest && !careerInterest) {
        setCareerInterest(userProfile.career_interest);
      }
      // Auto-prompt first-time students to complete required profile details
      const isMissingRequired = !userProfile.college || !userProfile.branch || userProfile.college === 'Engineering College';
      if (isMissingRequired) {
        setProfileModalEditMode(true);
        setIsProfileModalOpen(true);
      }
    }
  }, [userProfile?.uid, userProfile?.college, userProfile?.branch]);

  // Real-Time Job Market state (Multi-Source Feeds)
  const [jobListings, setJobListings] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobProvider, setJobProvider] = useState('Real-Time Feed');
  const [selectedSource, setSelectedSource] = useState('auto');
  const [isFullJobViewOpen, setIsFullJobViewOpen] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobError, setJobError] = useState('');

  const loadJobMarketData = async (forceRefresh = false) => {
    if (!careerInterest) {
      setJobListings([]);
      setSelectedJob(null);
      setJobError('');
      return;
    }

    const selectedRole = industryRoles.find(r => r.id === careerInterest);
    if (!selectedRole) return;

    setLoadingJobs(true);
    setJobError('');
    try {
      const data = await fetchJobMarketInsights({
        roleId: careerInterest,
        roleName: selectedRole.role_name,
        location: 'India',
        provider: selectedSource,
        forceRefresh
      });
      setJobListings(data.jobs || []);
      setJobProvider(data.provider || 'Real-Time Feed');
      if (data.error) {
        setJobError(data.error);
      }
    } catch (err) {
      console.error('Error fetching real-time jobs:', err);
      setJobError(err.message);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Load jobs when career interest or provider change
  useEffect(() => {
    loadJobMarketData();
  }, [careerInterest, selectedSource]);

  // T7 ID & YouTube learning state
  const [copied, setCopied] = useState(false);
  const [videoLearning, setVideoLearning] = useState([]);
  const [ytSkills, setYtSkills] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    const loadLastAnalysis = async () => {
      if (currentUser?.uid) {
        const analysis = await getLatestAnalysis(currentUser.uid);
        setLastAnalysis(analysis);
        if (analysis) {
          // If careerInterest isn't selected, pre-select the one from last analysis
          if (!careerInterest) {
            const roleMatch = industryRoles.find(
              r => r.role_name === analysis.career_role || r.id === analysis.career_role
            );
            if (roleMatch) setCareerInterest(roleMatch.id);
          }

          // Check if student left off on results view
          const savedView = localStorage.getItem(`t7_student_view_${currentUser.uid}`);
          if (savedView === 'results' || (!savedView && analysis)) {
            const selectedRole = industryRoles.find(
              r => r.role_name === analysis.career_role || r.id === analysis.career_role
            ) || industryRoles[0];
            navigate('/results', { state: { analysis, role: selectedRole, userSkills: selectedSkills } });
          }
        }
      }
    };
    loadLastAnalysis();
  }, [currentUser?.uid]);

  // Fetch YouTube learning data and auto-merge skills (supports both Auth UID & T7 ID)
  const loadVideoLearningData = async () => {
    if (!currentUser?.uid) return;
    setLoadingVideos(true);
    try {
      let videos = await getVideoLearning(currentUser.uid);
      let skills = await getVideoLearningSkills(currentUser.uid);

      // If no videos under UID, also check if extension synced under T7 ID
      if (videos.length === 0 && userProfile?.t7Id) {
        const t7Videos = await getVideoLearning(userProfile.t7Id);
        if (t7Videos.length > 0) {
          videos = t7Videos;
          skills = await getVideoLearningSkills(userProfile.t7Id);
        }
      }

      setVideoLearning(videos);
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

  useEffect(() => {
    loadVideoLearningData();
  }, [currentUser?.uid, userProfile?.t7Id]);

  const copyT7Id = () => {
    if (userProfile?.t7Id) {
      navigator.clipboard.writeText(userProfile.t7Id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const refreshVideoLearning = () => {
    loadVideoLearningData();
  };

  const filteredSkills = allSkills.filter(skill =>
    skill.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const toggleSkill = (skill) => {
    setIsStartFromScratch(false);
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const [showAllBranchRoles, setShowAllBranchRoles] = useState(false);

  // Filter career roles automatically based on profile branch (with fuzzy matching)
  const branchAllowedIds = userBranch
    ? (BRANCH_CAREER_MAP[userBranch] || BRANCH_CAREER_MAP[Object.keys(BRANCH_CAREER_MAP).find(k => userBranch.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(userBranch.toLowerCase()))] || [])
    : [];

  const filteredRoles = (userBranch && !showAllBranchRoles && branchAllowedIds.length > 0)
    ? industryRoles.filter(role => branchAllowedIds.includes(role.id))
    : industryRoles;

  const handleAnalyze = async () => {
    setError('');
    
    if (!careerInterest) {
      setError('Please select your dream career role before analyzing');
      return;
    }

    if (selectedSkills.length === 0 && !isStartFromScratch) {
      setError('Please select at least one skill, or click "Start from scratch" if you are a beginner');
      return;
    }

    setAnalyzing(true);

    try {
      await updateUserProfile(currentUser.uid, {
        skills: selectedSkills,
        career_interest: careerInterest
      });

      const selectedRole = industryRoles.find(r => r.id === careerInterest);
      
      // Uses LYZR ProfileAnalyzerAgent (role-based, no hardcoded companies).
      // If LYZR is not yet configured, automatically falls back to Gemini.
      // YouTube history is NOT an input — tracked separately after roadmap starts.
      const analysisResult = await analyzeStudentProfile({
        studentSkills: selectedSkills,
        selectedRole,
        allRoles: industryRoles,
        branch: userProfile?.branch || '',
        year: userProfile?.passoutYear || userProfile?.year || '',
        cgpa: userProfile?.cgpa || '',
        resumeFile,
        userId: currentUser?.uid,
        // Gemini fallback params (used only if LYZR not yet configured)
        customApiKey: userProfile?.geminiApiKey,
        preferredModel: userProfile?.geminiModel,
      });

      await saveAnalysis(currentUser.uid, {
        career_role: selectedRole.role_name,
        ...analysisResult
      });

      if (currentUser?.uid) {
        localStorage.setItem(`t7_student_view_${currentUser.uid}`, 'results');
      }

      navigate('/results', { state: { analysis: analysisResult, role: selectedRole, userSkills: selectedSkills } });
    } catch (err) {
      console.error('Analysis error:', err);
      if (err?.message?.includes('LYZR_NOT_CONFIGURED')) {
        setError('Lyzr AI agents are pending configuration. Please add LYZR_API_KEY and LYZR_AGENT_PROFILE to your .env file.');
      } else {
        setError(err?.message || 'Analysis failed. Please try again.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF only for now)
      if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
        setError('Please upload a PDF resume file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Resume file size must be less than 5MB');
        return;
      }
      setResumeFile(file);
      setError('');
    }
  };

  const removeResume = () => {
    setResumeFile(null);
  };

  const viewPreviousResults = () => {
    if (lastAnalysis) {
      if (currentUser?.uid) {
        localStorage.setItem(`t7_student_view_${currentUser.uid}`, 'results');
      }
      const selectedRole = industryRoles.find(r => r.role_name === lastAnalysis.career_role || r.id === lastAnalysis.career_role) || industryRoles[0];
      navigate('/results', { state: { analysis: lastAnalysis, role: selectedRole, userSkills: selectedSkills } });
    }
  };

  if (isFullJobViewOpen && careerInterest) {
    return (
      <FullJobMarketView
        careerInterest={careerInterest}
        userSkills={selectedSkills}
        initialSource={selectedSource}
        onBack={() => setIsFullJobViewOpen(false)}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-40 transition-colors duration-300 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="max-w-6xl mx-auto px-6 h-18 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-zinc-900'}`}>T7 Learning Hub</span>
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border cursor-pointer ${
                darkMode
                  ? 'bg-zinc-800 border-zinc-700 text-yellow-400 hover:bg-zinc-700'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>


            {/* Top Right Profile Dropdown Menu */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(prev => !prev)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 bg-zinc-100 hover:bg-zinc-200/80 rounded-xl transition-all border border-zinc-200/80 group cursor-pointer"
                title="Student Profile Options"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-zinc-900 leading-tight">
                    {userProfile?.name || 'Student'}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate max-w-[130px]">{userProfile?.email}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu Popup */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-200/90 py-2 z-50 animate-fade-in divide-y divide-zinc-100">
                  {/* Student Identity Card in Dropdown */}
                  <div className="p-4 bg-gradient-to-b from-zinc-50 to-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-zinc-900 to-zinc-700 text-white flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">
                        {userProfile?.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-zinc-900 truncate">{userProfile?.name || 'Student'}</p>
                        </div>
                        <p className="text-xs text-zinc-500 truncate">{userProfile?.email}</p>
                      </div>
                    </div>

                    {/* Quick Metadata Chips */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200/60">
                        Verified Student
                      </span>
                      {userProfile?.passoutYear && (
                        <span className="px-2 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-md border border-violet-200/60 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Passout: {userProfile.passoutYear}
                        </span>
                      )}
                      {userProfile?.branch && (
                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 text-[10px] font-medium rounded-md truncate max-w-[200px]" title={userProfile.branch}>
                          {userProfile.branch}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: View Profile */}
                  <div className="p-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full px-3.5 py-3 text-left text-xs font-bold text-zinc-800 hover:text-zinc-900 hover:bg-zinc-100/80 rounded-xl flex items-center gap-3 transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 bg-zinc-900 text-white rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-zinc-900 text-sm flex items-center justify-between">
                          <span>View Profile</span>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                        </p>
                        <p className="text-[11px] text-zinc-500 font-normal">View & edit credentials, passout year & skills</p>
                      </div>
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-black mb-1 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
              Hey, {userProfile?.name?.split(' ')[0]}!
              <span className="text-3xl">👋</span>
            </h1>
            <p className={`text-lg ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Let's build your placement roadmap</p>
          </div>
        </div>

        {/* ── Smart Status Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          {/* Card 1: Readiness Score */}
          <div className={`relative overflow-hidden rounded-2xl p-4 border shadow-sm ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <span className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Readiness</span>
            </div>
            <p className={`text-3xl font-black ${lastAnalysis?.readiness_score >= 70 ? 'text-emerald-500' : lastAnalysis?.readiness_score >= 50 ? 'text-amber-500' : lastAnalysis?.readiness_score ? 'text-red-500' : darkMode ? 'text-zinc-600' : 'text-zinc-300'}`}>
              {lastAnalysis?.readiness_score != null ? `${lastAnalysis.readiness_score}%` : '—'}
            </p>
            {lastAnalysis?.readiness_score != null && (
              <div className="mt-2 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    lastAnalysis.readiness_score >= 70 ? 'bg-emerald-500' :
                    lastAnalysis.readiness_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${lastAnalysis.readiness_score}%` }}
                />
              </div>
            )}
            {!lastAnalysis && (
              <p className={`text-xs mt-1 ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>Run analysis first</p>
            )}
          </div>

          {/* Card 2: Skills Selected */}
          <div className={`relative overflow-hidden rounded-2xl p-4 border shadow-sm ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-violet-600" />
              </div>
              <span className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Skills</span>
            </div>
            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{selectedSkills.length}</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {selectedSkills.length > 0 ? `${selectedSkills.slice(0,2).join(', ')}${selectedSkills.length > 2 ? ` +${selectedSkills.length - 2}` : ''}` : 'None selected yet'}
            </p>
          </div>

          {/* Card 3: Resume / ATS Score */}
          <div className={`relative overflow-hidden rounded-2xl p-4 border shadow-sm ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <span className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Resume ATS</span>
            </div>
            <p className={`text-3xl font-black ${
              atsScore >= 70 ? 'text-emerald-500' :
              atsScore >= 50 ? 'text-amber-500' :
              atsScore ? 'text-red-500' :
              darkMode ? 'text-zinc-600' : 'text-zinc-300'
            }`}>
              {atsScore != null ? `${atsScore}/100` : '—'}
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {atsScore != null ? (atsScore >= 70 ? 'Resume looks strong' : atsScore >= 50 ? 'Needs improvement' : 'Upload & analyze') : 'Upload resume in results'}
            </p>
          </div>

          {/* Card 4: Target Role */}
          <div className={`relative overflow-hidden rounded-2xl p-4 border shadow-sm ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-orange-500" />
              </div>
              <span className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Target Role</span>
            </div>
            <p className={`text-sm font-black leading-tight ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
              {careerInterest
                ? industryRoles.find(r => r.id === careerInterest)?.role_name || careerInterest
                : '—'}
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {careerInterest ? 'Selected below' : 'Pick a role below'}
            </p>
          </div>
        </div>

        {/* T7 Tutor Feature Banner */}
        <div className="mb-6 p-6 bg-gradient-to-r from-violet-950 via-zinc-900 to-zinc-900 rounded-3xl shadow-xl border border-violet-800/40 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-violet-600/15 -translate-y-1/2 translate-x-1/2 pointer-events-none blur-2xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 bg-violet-500/20 rounded-2xl flex items-center justify-center border border-violet-400/30 flex-shrink-0 shadow-inner">
                <GraduationCap className="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black text-white">T7 Tutor</h3>
                  <span className="text-xs font-bold bg-violet-500/30 text-violet-200 px-2.5 py-0.5 rounded-full border border-violet-400/30">
                    DeepTutor AI v1.3.7
                  </span>
                  <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Workspace
                  </span>
                </div>
                <p className="text-zinc-300 text-sm mt-1 max-w-2xl">
                  Personalized AI tutor with interactive TutorBot, Co-Writer for notes, Knowledge Base, and Coding Space.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => navigate('/academic')}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-violet-600/30 flex items-center gap-2 hover:-translate-y-0.5"
              >
                <span>Launch T7 Tutor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Today's Focus Card ────────────────────────────── */}
        {todayTasks.length > 0 && (
          <div className={`mb-6 p-5 rounded-2xl border shadow-sm ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Today's Focus</h3>
              </div>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">From your roadmap</span>
            </div>
            <div className="space-y-2">
              {todayTasks.map((taskItem, i) => {
                const isObj = typeof taskItem === 'object' && taskItem !== null;
                const taskText = isObj ? (taskItem.task || taskItem.title || taskItem.action || JSON.stringify(taskItem)) : taskItem;
                const taskTime = isObj ? taskItem.time : null;
                const taskImpact = isObj ? taskItem.impact : null;

                return (
                  <div key={i} className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${
                    darkMode ? 'bg-zinc-800/80 border-zinc-700/60' : 'bg-zinc-50 border-zinc-200/60'
                  }`}>
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-snug ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                          {taskText}
                        </p>
                        {taskImpact && (
                          <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                            💡 {taskImpact}
                          </p>
                        )}
                      </div>
                    </div>
                    {taskTime && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-800 border border-amber-200 flex-shrink-0 whitespace-nowrap">
                        ⏱️ {taskTime}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Skill Badges Wall ─────────────────────────────── */}
        {earnedBadges.length > 0 && (
          <div className={`mb-6 p-5 rounded-2xl border shadow-sm ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-violet-600" />
                </div>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Your Skill Badges</h3>
              </div>
              <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">Verified by AI</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((skill, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 text-violet-800 text-xs font-bold rounded-xl shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-violet-500" />
                  {typeof skill === 'string' ? skill : skill.name || skill}
                </span>
              ))}
            </div>
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
              className="px-5 py-2.5 bg-white text-zinc-900 font-bold rounded-xl hover:bg-zinc-100 transition-all flex items-center gap-2 cursor-pointer"
            >
              View results
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-xl text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Step 1 & Step 2: Dream Career (Left) & Your Skills (Right) - Equal Height */}
        <div className="grid lg:grid-cols-12 gap-6 items-stretch mb-6">
          {/* Left Box - Dream Career */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100 flex flex-col h-[520px]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-zinc-900 text-lg">Dream Career</h2>
                    <p className="text-sm text-zinc-500">
                      {userBranch ? `Curated for ${userBranch}` : 'Top industry roles'}
                    </p>
                  </div>
                </div>
                {careerInterest && (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                    Selected
                  </span>
                )}
              </div>

              {/* Branch / All Roles Toggle Filter */}
              {userBranch && branchAllowedIds.length > 0 && (
                <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setShowAllBranchRoles(false)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      !showAllBranchRoles
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    🎯 Branch Roles ({branchAllowedIds.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAllBranchRoles(true)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      showAllBranchRoles
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    🌐 All 24+ Roles
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto pr-2 space-y-2.5">
                {filteredRoles.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 text-sm">
                    <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No career paths found. Set your branch in profile.
                  </div>
                ) : filteredRoles.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setCareerInterest(role.id)}
                    className={`w-full p-3.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                      careerInterest === role.id
                        ? 'bg-zinc-900 text-white shadow-lg ring-2 ring-zinc-900'
                        : 'bg-zinc-50 hover:bg-zinc-100/90 text-zinc-700 border border-zinc-100 hover:border-zinc-200'
                    }`}
                  >
                    <div>
                      <p className={`font-bold text-sm sm:text-base ${careerInterest === role.id ? 'text-white' : 'text-zinc-900'}`}>
                        {role.role_name}
                      </p>
                      <p className={`text-xs mt-0.5 ${careerInterest === role.id ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {role.required_skills.length} skills required
                      </p>
                    </div>
                    {careerInterest === role.id && (
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Box - Your Skills */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100 flex flex-col h-[520px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-zinc-900 text-lg">Your Skills</h2>
                    <p className="text-sm text-zinc-500">
                      {isStartFromScratch ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Beginner track (Start from scratch)
                        </span>
                      ) : (
                        <>
                          <span className="text-zinc-900 font-bold">{selectedSkills.length}</span> selected
                        </>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Start from Scratch Button (Black button, white text) */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isStartFromScratch;
                    setIsStartFromScratch(next);
                    if (next) setSelectedSkills([]);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
                    isStartFromScratch
                      ? 'bg-zinc-900 text-white ring-2 ring-emerald-400 shadow-lg shadow-zinc-900/20'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  }`}
                  title="Click if you are a beginner with no prior technical skills"
                >
                  {isStartFromScratch ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      <span>Start from scratch</span>
                      <span className="px-1.5 py-0.5 bg-emerald-400/20 text-emerald-300 rounded text-[10px] font-black uppercase tracking-wider">
                        Selected
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-zinc-500" />
                      <span>Start from scratch</span>
                    </>
                  )}
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Search skills (e.g. React, Python, Docker)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border-2 border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 outline-none text-zinc-900 font-medium text-sm placeholder:text-zinc-400 transition-colors"
                />
              </div>

              {/* Selected Skills */}
              {selectedSkills.length > 0 && (
                <div className="mb-3 pb-3 border-b-2 border-zinc-100 max-h-24 overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(selectedSkills)).map((skill, idx) => {
                      const isFromYt = ytSkills.some(ys => ys.toLowerCase() === skill.toLowerCase());
                      return (
                        <span
                          key={`selected-${skill}-${idx}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            isFromYt 
                              ? 'bg-red-600 text-white' 
                              : 'bg-zinc-900 text-white'
                          }`}
                        >
                          {isFromYt && <Youtube className="w-3.5 h-3.5" />}
                          {skill}
                          <button
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Skills Cloud */}
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set(filteredSkills)).map((skill, idx) => (
                    <button
                      key={`all-${skill}-${idx}`}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      disabled={selectedSkills.includes(skill)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
            </div>
          </div>
        </div>

        {/* Step 3: Unified ATS Resume & Analysis Action Box */}
        <div className="bg-white rounded-2xl shadow-lg border border-zinc-100 mb-8 overflow-hidden">
          {/* Top Section: Resume Analyzer Controls */}
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4 max-w-xl">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-zinc-900 text-lg">ATS Resume Analyzer</h2>
                    <span className="text-[11px] font-bold bg-zinc-100 text-zinc-600 px-2.5 py-0.5 rounded-full border border-zinc-200">
                      Optional
                    </span>
                    <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200/70">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">
                    Upload your resume for instant ATS scoring, keyword gap analysis, formatting audit, and role-tailored rewrite suggestions.
                  </p>
                </div>
              </div>

              {/* Upload Dropzone / File Display */}
              <div className="flex-1 lg:max-w-md">
                {resumeFile ? (
                  <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate">{resumeFile.name}</p>
                        <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready for ATS Analysis
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeResume}
                      className="p-1.5 hover:bg-emerald-200/60 text-emerald-800 rounded-lg transition-colors cursor-pointer ml-2 flex-shrink-0"
                      title="Remove Resume"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100/90 border-2 border-dashed border-zinc-200 hover:border-zinc-900 rounded-xl transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 group-hover:scale-105 text-white flex items-center justify-center transition-transform flex-shrink-0 shadow-sm">
                        <Download className="w-4 h-4 rotate-180" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Upload Resume (PDF)</p>
                        <p className="text-xs text-zinc-500">Max size 5MB • AI ATS Review</p>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 bg-white border border-zinc-200 text-xs font-bold text-zinc-800 rounded-lg group-hover:bg-zinc-900 group-hover:text-white transition-colors shadow-xs">
                      Browse
                    </span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleResumeChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Integrated Action Bar */}
          <div className="px-6 py-4 bg-zinc-50/80 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <Sparkles className="w-4 h-4 text-zinc-700" />
              <span>Powered by Google Gemini AI</span>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl shadow-lg shadow-zinc-900/10 hover:shadow-zinc-900/20 hover:-translate-y-0.5 transition-all text-sm sm:text-base flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {isStartFromScratch 
                      ? 'Generating Zero-to-Hero roadmap...' 
                      : `Analyzing skills${resumeFile ? ' + resume' : ''}...`}
                  </span>
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  <span>
                    {isStartFromScratch 
                      ? 'Generate Zero-to-Hero Roadmap (From Scratch)' 
                      : 'Analyze Placement Readiness'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

            {/* Job Market Insights */}
            {careerInterest && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100 mt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <Compass className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-zinc-900 text-lg">Job Market Insights</h2>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {jobProvider}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500">Live roles matching your dream career</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* API Source Provider Filter */}
                    <div className="relative">
                      <select
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="px-3 py-2 pr-8 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 outline-none cursor-pointer appearance-none"
                        title="Choose job data source"
                      >
                        <option value="auto">⚡ All Live Sources (Multi-Feed)</option>
                        <option value="jsearch">💼 JSearch (LinkedIn / Indeed / Glassdoor)</option>
                        <option value="adzuna">🏢 Adzuna API (Licensed Aggregator)</option>
                        <option value="arbeitnow">🌐 Arbeitnow (Remote & Tech)</option>
                        <option value="themuse">🏛️ The Muse (Top Tech Enterprises)</option>
                        <option value="jooble">🔍 Jooble Jobs</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Refresh Live Jobs */}
                    <button
                      type="button"
                      onClick={() => loadJobMarketData(true)}
                      disabled={loadingJobs}
                      className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      title="Refresh real-time job listings"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingJobs ? 'animate-spin' : ''}`} />
                      <span>{loadingJobs ? 'Fetching...' : 'Refresh'}</span>
                    </button>
                  </div>
                </div>

                {loadingJobs ? (
                  <div className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-900 mb-3" />
                    <p className="text-sm font-bold text-zinc-800">Fetching live job market postings...</p>
                    <p className="text-xs text-zinc-500 mt-1">Connecting to JSearch (LinkedIn, Indeed, Glassdoor), Adzuna & Jooble</p>
                  </div>
                ) : jobListings.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-sm max-w-md mx-auto">
                    <Compass className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-bold text-zinc-700">No active job listings found</p>
                    {jobError ? (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2 leading-relaxed font-medium">
                        {jobError.includes('not subscribed')
                          ? 'RapidAPI Notice: Please click "Subscribe to Test" on the free tier of JSearch in RapidAPI to activate your key.'
                          : jobError}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400 mt-1">Check your data source filter or try refreshing.</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {jobListings.slice(0, 8).map(job => {
                        const matchedJobSkills = job.requiredSkills.filter(s => selectedSkills.includes(s));
                        const missingJobSkills = job.requiredSkills.filter(s => !selectedSkills.includes(s));
                        const matchPercentage = job.requiredSkills.length > 0
                          ? Math.round((matchedJobSkills.length / job.requiredSkills.length) * 100)
                          : 0;

                        return (
                          <div key={job.id} className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70 hover:bg-white hover:border-zinc-300 transition-all shadow-xs flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2.5 gap-2 flex-wrap">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${job.platformStyle || 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
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
                                  <span className="text-xs font-semibold text-zinc-500 bg-white border border-zinc-200 px-2 py-0.5 rounded-md">
                                    {job.posted}
                                  </span>
                                </div>
                              </div>

                              <h3 className="font-bold text-zinc-900 text-base mb-1 leading-snug">{job.title}</h3>
                              <div className="flex items-center text-xs text-zinc-500 gap-3 mb-3.5 flex-wrap">
                                <span className="flex items-center gap-1 font-medium text-zinc-700"><Building2 className="w-3.5 h-3.5 text-zinc-400" /> {job.company}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-zinc-400" /> {job.location}</span>
                                {job.type && <span className="px-1.5 py-0.5 bg-zinc-200/60 text-zinc-700 rounded text-[10px] font-semibold">{job.type}</span>}
                              </div>
                              
                              <div className="mb-4">
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                  <span className="text-zinc-600">Your Skill Match</span>
                                  <span className={matchPercentage >= 70 ? 'text-emerald-600 font-bold' : matchPercentage >= 40 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'}>
                                    {matchPercentage}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${matchPercentage >= 70 ? 'bg-emerald-500' : matchPercentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${matchPercentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                  <span>Apply on {job.platform || 'Board'}</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>

                              {/* Expandable Comparison Section */}
                              {selectedJob?.id === job.id && (
                                <div className="mt-4 pt-4 border-t border-zinc-200 space-y-3.5 animate-fade-in">
                                  <div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">✅ Skills You Have</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {matchedJobSkills.length > 0 ? matchedJobSkills.map((skill, idx) => (
                                        <span key={`match-${skill}-${idx}`} className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" /> {skill}
                                        </span>
                                      )) : <span className="text-xs text-zinc-400 font-medium italic">No matching skills selected yet</span>}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">❌ Skills Missing (Click to Learn)</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {missingJobSkills.length > 0 ? missingJobSkills.map((skill, idx) => (
                                        <a
                                          key={`miss-${skill}-${idx}`}
                                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(skill + ' tutorial full course')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title={`Learn ${skill} on YouTube`}
                                          className="text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer group"
                                        >
                                          <XCircle className="w-3 h-3 text-red-500 group-hover:scale-110 transition-transform" /> 
                                          <span>{skill}</span>
                                          <span className="text-[10px] text-red-500/70 group-hover:text-red-700">▶</span>
                                        </a>
                                      )) : <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> You meet all skill requirements!</span>}
                                    </div>
                                  </div>

                                  {missingJobSkills.length > 0 && (
                                    <div className="bg-amber-50/90 rounded-xl p-3.5 border border-amber-200/80 space-y-2.5">
                                      <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                          <TrendingUp className="w-4 h-4 text-amber-700" /> Recommended Learning Action
                                        </p>
                                        <span className="text-[11px] font-extrabold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md border border-amber-300/60">
                                          Boosts Match: {matchPercentage}% ➔ {Math.min(100, Math.round(((matchedJobSkills.length + 1) / Math.max(1, job.requiredSkills.length)) * 100))}%
                                        </span>
                                      </div>
                                      
                                      <p className="text-xs text-amber-900 leading-relaxed font-medium">
                                        Prioritize learning <strong className="font-extrabold text-amber-950 underline decoration-amber-400">{missingJobSkills[0]}</strong> first to increase your match percentage.
                                      </p>

                                      <div className="pt-0.5 flex items-center gap-2 flex-wrap">
                                        <a
                                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(missingJobSkills[0] + ' tutorial full course')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                                        >
                                          <Youtube className="w-3.5 h-3.5" />
                                          <span>Watch {missingJobSkills[0]} Tutorials ↗</span>
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => setIsYouTubeModalOpen(true)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                                        >
                                          <span>Open T7 Video Tracker</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Full Job Description from API */}
                                  {job.description && (
                                    <div className="pt-2 border-t border-zinc-200/70">
                                      <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-zinc-500" /> Full Job Overview & Requirements
                                      </p>
                                      <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 text-xs text-zinc-700 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-line font-normal select-text">
                                        {job.description}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* View All in Full Screen Button */}
                    <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-3">
                      <p className="text-xs text-zinc-500 font-medium">
                        Showing top <span className="font-bold text-zinc-900">{Math.min(8, jobListings.length)}</span> featured roles for <span className="font-bold text-zinc-900">{industryRoles.find(r => r.id === careerInterest)?.role_name || 'your career'}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsFullJobViewOpen(true)}
                        className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer hover:gap-2.5"
                      >
                        <span>View All Jobs in Full Screen ({jobListings.length > 0 ? `${jobListings.length}+ Roles` : 'Explore Board'})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
        </main>

      {/* Professional Student Profile Modal */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        lastAnalysis={lastAnalysis}
        initialEditMode={profileModalEditMode}
      />

      {/* Professional YouTube Learning Tracker & Sync Hub Modal */}
      <YouTubeTrackerModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        videoLearning={videoLearning}
        ytSkills={ytSkills}
        loadingVideos={loadingVideos}
        refreshVideoLearning={loadVideoLearningData}
        t7Id={userProfile?.t7Id}
        userProfile={userProfile}
      />
    </div>
  );
};

export default StudentDashboard;
