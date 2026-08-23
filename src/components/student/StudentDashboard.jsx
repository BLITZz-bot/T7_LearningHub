/**
 * Student Dashboard - Sleek Black & Grey Theme with Images
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyzeT7LearningHub } from '../../services/geminiService';
import { saveAnalysis, getLatestAnalysis, getVideoLearning, getVideoLearningSkills } from '../../services/firestoreService';
import { industryRoles, allSkills } from '../../data/industrySkills';
import { fetchJobMarketInsights } from '../../services/jobMarketService';
import StudentProfileModal from './StudentProfileModal';
import YouTubeTrackerModal from './YouTubeTrackerModal';
import FullJobMarketView from './FullJobMarketView';
import ModelSelector from '../common/ModelSelector';
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
  FileText
} from 'lucide-react';

// Branch → relevant real-world career roles mapping
const BRANCH_CAREER_MAP = {
  // Computer Science & IT
  'Computer Science Engineering': ['frontend-developer', 'backend-developer', 'fullstack-developer', 'data-analyst', 'ai-ml-engineer', 'devops-engineer', 'mobile-developer', 'cloud-engineer', 'iot-architect'],
  'Computer Science': ['frontend-developer', 'backend-developer', 'fullstack-developer', 'data-analyst', 'ai-ml-engineer', 'devops-engineer', 'mobile-developer', 'cloud-engineer', 'iot-architect'],
  'Information Technology': ['frontend-developer', 'backend-developer', 'fullstack-developer', 'data-analyst', 'ai-ml-engineer', 'devops-engineer', 'mobile-developer', 'cloud-engineer', 'iot-architect'],
  'Artificial Intelligence & Machine Learning': ['ai-ml-engineer', 'data-analyst', 'backend-developer', 'fullstack-developer', 'robotics-engineer', 'cloud-engineer'],
  'Data Science': ['data-analyst', 'ai-ml-engineer', 'backend-developer', 'fullstack-developer', 'cloud-engineer'],
  'Cyber Security': ['cloud-engineer', 'devops-engineer', 'backend-developer', 'fullstack-developer', 'telecom-engineer', 'iot-architect'],
  'Cloud Computing': ['cloud-engineer', 'devops-engineer', 'backend-developer', 'fullstack-developer', 'data-analyst'],
  'Internet of Things (IoT)': ['iot-architect', 'embedded-systems-engineer', 'robotics-engineer', 'telecom-engineer', 'backend-developer', 'cloud-engineer'],
  'Robotics & Automation': ['robotics-engineer', 'embedded-systems-engineer', 'control-systems-engineer', 'iot-architect', 'ai-ml-engineer', 'manufacturing-engineer'],

  // Electronics & Electrical
  'Electronics & Communication Engineering': ['embedded-systems-engineer', 'vlsi-design-engineer', 'telecom-engineer', 'iot-architect', 'robotics-engineer', 'ai-ml-engineer', 'fullstack-developer', 'data-analyst'],
  'Electronics & Communication': ['embedded-systems-engineer', 'vlsi-design-engineer', 'telecom-engineer', 'iot-architect', 'robotics-engineer', 'ai-ml-engineer', 'fullstack-developer', 'data-analyst'],
  'Electrical Engineering': ['power-systems-engineer', 'control-systems-engineer', 'instrumentation-engineer', 'renewable-energy-engineer', 'embedded-systems-engineer', 'robotics-engineer', 'data-analyst'],
  'Electrical & Electronics Engineering': ['power-systems-engineer', 'embedded-systems-engineer', 'vlsi-design-engineer', 'control-systems-engineer', 'renewable-energy-engineer', 'instrumentation-engineer', 'robotics-engineer', 'iot-architect'],
  'Instrumentation Engineering': ['instrumentation-engineer', 'control-systems-engineer', 'embedded-systems-engineer', 'iot-architect', 'robotics-engineer'],

  // Mechanical, Automobile, Aerospace & Industrial
  'Mechanical Engineering': ['mechanical-design-engineer', 'automotive-engineer', 'hvac-engineer', 'manufacturing-engineer', 'quality-engineer', 'robotics-engineer', 'data-analyst'],
  'Automobile Engineering': ['automotive-engineer', 'mechanical-design-engineer', 'manufacturing-engineer', 'quality-engineer', 'robotics-engineer', 'embedded-systems-engineer'],
  'Aerospace Engineering': ['mechanical-design-engineer', 'automotive-engineer', 'quality-engineer', 'embedded-systems-engineer', 'robotics-engineer', 'data-analyst'],
  'Industrial Engineering': ['manufacturing-engineer', 'quality-engineer', 'construction-manager', 'process-engineer', 'data-analyst'],
  'Production Engineering': ['manufacturing-engineer', 'quality-engineer', 'mechanical-design-engineer', 'automotive-engineer', 'process-engineer'],

  // Civil & Environmental
  'Civil Engineering': ['structural-engineer', 'construction-manager', 'environmental-engineer', 'transportation-engineer', 'quality-engineer', 'data-analyst'],
  'Environmental Engineering': ['environmental-engineer', 'environmental-health-safety', 'structural-engineer', 'construction-manager', 'data-analyst'],

  // Chemical, Biotech, Biomedical & Materials
  'Chemical Engineering': ['process-engineer', 'chemical-rd-scientist', 'environmental-health-safety', 'quality-engineer', 'data-analyst'],
  'Biotechnology': ['biotech-research', 'biomedical-engineer', 'clinical-research', 'pharma-production', 'data-analyst', 'ai-ml-engineer', 'process-engineer'],
  'Biomedical Engineering': ['biomedical-engineer', 'biotech-research', 'clinical-research', 'instrumentation-engineer', 'embedded-systems-engineer', 'data-analyst'],
  'Petroleum Engineering': ['process-engineer', 'mechanical-design-engineer', 'environmental-health-safety', 'quality-engineer', 'data-analyst'],
  'Mining Engineering': ['process-engineer', 'mechanical-design-engineer', 'environmental-health-safety', 'quality-engineer', 'data-analyst'],
  'Marine Engineering': ['mechanical-design-engineer', 'power-systems-engineer', 'quality-engineer', 'embedded-systems-engineer', 'data-analyst'],
  'Textile Engineering': ['manufacturing-engineer', 'quality-engineer', 'process-engineer', 'data-analyst'],

  // Computing & Sciences
  'Mathematics & Computing': ['data-analyst', 'ai-ml-engineer', 'backend-developer', 'fullstack-developer', 'frontend-developer', 'cloud-engineer'],
  'Physics': ['data-analyst', 'ai-ml-engineer', 'embedded-systems-engineer', 'biotech-research'],
  'MCA (Computer Applications)': ['fullstack-developer', 'frontend-developer', 'backend-developer', 'mobile-developer', 'data-analyst', 'cloud-engineer', 'devops-engineer'],
  'BCA (Computer Applications)': ['fullstack-developer', 'frontend-developer', 'backend-developer', 'mobile-developer', 'data-analyst', 'cloud-engineer', 'devops-engineer'],
  'Other': industryRoles.map(r => r.id)
};

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

  // Sync userProfile skills and career interest when user profile loads
  useEffect(() => {
    if (userProfile) {
      if (userProfile.skills?.length > 0 && selectedSkills.length === 0) {
        setSelectedSkills(userProfile.skills);
      }
      if (userProfile.career_interest && !careerInterest) {
        setCareerInterest(userProfile.career_interest);
      }
    }
  }, [userProfile?.uid]);

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
      if (currentUser) {
        const analysis = await getLatestAnalysis(currentUser.uid);
        setLastAnalysis(analysis);
      }
    };
    loadLastAnalysis();
  }, [currentUser]);

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
    
    if (selectedSkills.length === 0 || !careerInterest) {
      setError('Please select a dream career and at least one skill before analyzing');
      return;
    }

    setAnalyzing(true);

    try {
      await updateUserProfile(currentUser.uid, {
        skills: selectedSkills,
        career_interest: careerInterest
      });

      const selectedRole = industryRoles.find(r => r.id === careerInterest);
      
      const analysisResult = await analyzeT7LearningHub(
        selectedSkills,
        selectedRole,
        industryRoles,
        resumeFile,
        userProfile?.geminiApiKey,
        userProfile?.geminiModel
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
      const selectedRole = industryRoles.find(r => r.role_name === lastAnalysis.career_role) || industryRoles[0];
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
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-18 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-zinc-900 text-lg">T7 Learning Hub</span>
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            {/* Live Gemini Model Selector Pill */}
            <div className="hidden sm:block">
              <ModelSelector
                variant="pill"
                currentModel={userProfile?.geminiModel || 'auto'}
                onModelChange={(modelId) => updateUserProfile(currentUser.uid, { geminiModel: modelId })}
                apiKey={userProfile?.geminiApiKey}
                onOpenKeySettings={() => {
                  setIsProfileModalOpen(true);
                  setProfileModalEditMode(true);
                }}
              />
            </div>


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

        {/* Compact YouTube Learning Tracker & T7 Sync Widget */}
        <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 rounded-2xl shadow-xl border border-zinc-800 text-white transition-all hover:border-zinc-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30 flex-shrink-0 border border-red-500/30">
                <Youtube className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-white text-base">YouTube Learning Tracker</h3>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {videoLearning.length > 0 ? 'Extension Synced' : 'Ready to Sync'}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>
                    <strong className="text-white font-bold">{videoLearning.length}</strong> videos analyzed
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-white font-bold">{ytSkills.length}</strong> skills detected
                  </span>
                  {userProfile?.t7Id && (
                    <>
                      <span>•</span>
                      <span>
                        T7 ID: <strong className="text-amber-300 font-mono font-bold">{userProfile.t7Id}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {userProfile?.t7Id && (
                <button
                  type="button"
                  onClick={copyT7Id}
                  className={`px-3 py-2 font-bold rounded-xl transition-all flex items-center gap-1.5 text-xs cursor-pointer ${
                    copied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white border border-white/10'
                  }`}
                  title="Copy T7 Account ID"
                >
                  {copied ? (
                    <><CheckCircle className="w-3.5 h-3.5" /> Copied ID</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy ID</>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsYouTubeModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-red-600/30 flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer"
              >
                <span>View Full Tracker & Skills</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

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
                      <span className="text-zinc-900 font-bold">{selectedSkills.length}</span> selected
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-zinc-400">
                  {allSkills.length} total skills
                </span>
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
                    {selectedSkills.map(skill => {
                      const isFromYt = ytSkills.some(ys => ys.toLowerCase() === skill.toLowerCase());
                      return (
                        <span
                          key={skill}
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
                  {filteredSkills.map(skill => (
                    <button
                      key={skill}
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
                  <span>Analyzing skills{resumeFile ? ' + resume' : ''}...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  <span>Analyze My Profile</span>
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
                                      {matchedJobSkills.length > 0 ? matchedJobSkills.map(skill => (
                                        <span key={skill} className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" /> {skill}
                                        </span>
                                      )) : <span className="text-xs text-zinc-400 font-medium italic">No matching skills selected yet</span>}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">❌ Skills Missing (Click to Learn)</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {missingJobSkills.length > 0 ? missingJobSkills.map(skill => (
                                        <a
                                          key={skill}
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
