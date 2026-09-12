/**
 * Results Page - Robust Detailed Roadmap Display
 * Handles multiple data formats from Gemini AI
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// import LearningActivityGraph from './LearningActivityGraph';
import { 
  LogOut, ArrowLeft, Check, Calendar, ChevronDown, Download, Target, Sparkles,
  Trophy, Rocket, BookOpen, Zap, Clock, Code, ExternalLink, CheckCircle,
  GraduationCap, Briefcase, Play, AlertTriangle, Linkedin, FileText,
  Youtube, Globe, TrendingUp, Award, X, Home, Lightbulb, Copy, ArrowRight
} from 'lucide-react';
import { analyzeResumeOnly } from '../../services/geminiService';
import { getLatestAnalysis, getVideoLearning, getVideoLearningSkills } from '../../services/apiService';
import { industryRoles } from '../../data/industrySkills';
import YouTubeTrackerModal from './YouTubeTrackerModal';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [expandedMonth, setExpandedMonth] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [viewMode, setViewMode] = useState('skill'); // 'skill' or 'academic'

  // YouTube Tracker & Extension Sync state
  const [videoLearning, setVideoLearning] = useState([]);
  const [ytSkills, setYtSkills] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [copiedT7, setCopiedT7] = useState(false);

  const loadVideoLearningData = async () => {
    if (!currentUser?.uid && !userProfile?.t7Id) return;
    setLoadingVideos(true);
    try {
      let videos = [];
      let skills = [];
      if (currentUser?.uid) {
        videos = await getVideoLearning(currentUser.uid);
        skills = await getVideoLearningSkills(currentUser.uid);
      }
      if (videos.length === 0 && userProfile?.t7Id) {
        const t7Videos = await getVideoLearning(userProfile.t7Id);
        if (t7Videos.length > 0) {
          videos = t7Videos;
          skills = await getVideoLearningSkills(userProfile.t7Id);
        }
      }
      setVideoLearning(videos);
      setYtSkills(skills);
    } catch (err) {
      console.error('Error loading video learning in Results:', err);
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
      setCopiedT7(true);
      setTimeout(() => setCopiedT7(false), 2000);
    }
  };

  const locationState = location.state || {};
  const [analysis, setAnalysis] = useState(locationState.analysis || null);
  const [role, setRole] = useState(locationState.role || null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(!locationState.analysis);

  // Keep track that student is currently on the Results page
  useEffect(() => {
    if (currentUser?.uid) {
      localStorage.setItem(`t7_student_view_${currentUser.uid}`, 'results');
    }
  }, [currentUser?.uid]);

  // If no analysis was passed via location.state (e.g. reload or direct navigation), fetch latest from Supabase
  useEffect(() => {
    const fetchLatestIfMissing = async () => {
      if (!analysis && currentUser?.uid) {
        setLoadingAnalysis(true);
        try {
          const latest = await getLatestAnalysis(currentUser.uid);
          if (latest) {
            setAnalysis(latest);
            const foundRole = industryRoles.find(
              r => r.role_name === latest.career_role || r.id === latest.career_role
            ) || { role_name: latest.career_role || 'Target Role', description: '' };
            setRole(foundRole);
          }
        } catch (err) {
          console.error('Error loading latest analysis in Results:', err);
        } finally {
          setLoadingAnalysis(false);
        }
      }
    };
    fetchLatestIfMissing();
  }, [currentUser?.uid, analysis]);

  // Back to setup handler: sets student view to 'setup' so next reload/login opens setup
  const handleBackToSetup = () => {
    if (currentUser?.uid) {
      localStorage.setItem(`t7_student_view_${currentUser.uid}`, 'setup');
    }
    navigate('/dashboard');
  };

  // Local state for standalone ATS testing within the Results page
  const [localAtsAnalysis, setLocalAtsAnalysis] = useState(null);
  const [localResumeMeta, setLocalResumeMeta] = useState(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');

  useEffect(() => {
    if (analysis) {
      if (analysis.ats_analysis && !localAtsAnalysis) setLocalAtsAnalysis(analysis.ats_analysis);
      if (analysis.resume_meta && !localResumeMeta) setLocalResumeMeta(analysis.resume_meta);
    }
  }, [analysis]);

  if (loadingAnalysis) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-zinc-100 flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-zinc-800 font-bold text-lg">Loading your career roadmap...</p>
          <p className="text-zinc-500 text-sm mt-1">Retrieving your personalized learning plan</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-zinc-100 max-w-md">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-zinc-800 text-xl font-bold mb-2">No analysis completed yet</p>
          <p className="text-zinc-500 mb-6 text-sm">Select your dream role and skills on the dashboard to generate your AI roadmap.</p>
          <button onClick={handleBackToSetup} className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl shadow-lg hover:bg-zinc-800 transition cursor-pointer">
            Go to Career Setup
          </button>
        </div>
      </div>
    );
  }

  // Use passed skills, or fall back to profile skills, or analysis matched skills
  const userSkills = locationState.userSkills || userProfile?.skills || analysis.matched_skills || [];

  // Extract data with fallbacks for different formats
  const readiness_score = analysis.readiness_score || 0;
  const score_breakdown = analysis.score_breakdown || {};
  const honest_assessment = analysis.honest_assessment || '';
  const matched_skills = analysis.matched_skills || [];
  const missing_skills = analysis.missing_skills || [];
  const skill_priority_order = analysis.skill_priority_order || analysis.recommended_skills || [];
  const learning_roadmap = analysis.learning_roadmap || [];
  const quick_wins = analysis.quick_wins || [];
  const resume_tips = analysis.resume_tips || [];
  const linkedin_tips = analysis.linkedin_tips || [];
  const motivation = analysis.motivation || '';
  const final_outcome = analysis.final_outcome || analysis.final_goal || '';

  const ats_analysis = localAtsAnalysis;
  const resume_meta = localResumeMeta;

  const handleAtsUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setResumeError('Resume file must be under 10MB.');
      e.target.value = '';
      return;
    }

    setResumeError('');
    setIsParsingResume(true);

    try {
      // customApiKey is null → server uses GEMINI_API_KEY from env (never exposed to browser)
      const result = await analyzeResumeOnly(file, role, null);
      setLocalAtsAnalysis(result.ats_analysis);
      setLocalResumeMeta(result.resume_meta);
    } catch (err) {
      console.error('Standalone ATS Error', err);
      setResumeError(`Analysis failed: ${err.message}`);
    } finally {
      setIsParsingResume(false);
      e.target.value = '';
    }
  };

  // Portfolio: user's ACTUAL skills as completed, AI-identified gaps as in-progress
  const portfolioCourses = [
    ...userSkills.slice(0, 6).map((skill) => ({
      name: typeof skill === 'string' ? skill : skill.name || skill,
      progress: 100,
      status: 'Completed',
      hours: Math.floor(Math.random() * 8) + 8,
    })),
    ...missing_skills.slice(0, 4).map((skill, index) => ({
      name: typeof skill === 'string' ? skill : skill.name || skill,
      progress: [30, 45, 60, 75][index % 4],
      status: 'In Progress',
      hours: Math.floor(Math.random() * 8) + 2,
    })),
  ];

  const totalPortfolioCourses = portfolioCourses.length;
  const completedPortfolioCourses = portfolioCourses.filter((c) => c.status === 'Completed').length;
  const inProgressPortfolioCourses = portfolioCourses.filter((c) => c.status === 'In Progress').length;
  const avgPortfolioProgress = totalPortfolioCourses > 0
    ? Math.round(portfolioCourses.reduce((sum, c) => sum + c.progress, 0) / totalPortfolioCourses)
    : 0;

  // Show the user's actual skills as strengths, AI gaps as learning targets
  const strengthCourses = userSkills.slice(0, 4).map(s => typeof s === 'string' ? s : s.name || s);
  const learningCourses = missing_skills.slice(0, 4).map(s => typeof s === 'string' ? s : s.name || s);

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getAtsTone = (score) => {
    if (score >= 75) {
      return {
        text: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100'
      };
    }
    if (score >= 55) {
      return {
        text: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100'
      };
    }
    return {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100'
    };
  };

  const downloadPortfolio = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    const style = `
      body{font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;color:#1f2937;margin:0;padding:24px;}
      .print-container{max-width:1000px;margin:0 auto;}
      .print-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
      .print-header h1{font-size:1.9rem;margin:0;}
      .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:18px;margin-bottom:18px;box-shadow:0 2px 10px rgba(15,23,42,0.05);}
      .stat-bar{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px;}
      .stat-item{background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:10px;text-align:center;}
      .stat-item h3{margin:0;font-size:1.3rem;color:#1f2937;}
      .stat-item p{margin:0;font-size:0.8rem;color:#64748b;}
      .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:12px;}
      .course-card{border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fff;}
      .course-card h4{margin:0 0 6px;color:#0f172a;}
      .course-card p{margin:0;font-size:0.82rem;color:#475569;}
      .progress-bar{height:8px;background:#e2e8f0;border-radius:999px;margin-top:8px;overflow:hidden;}
      .progress-fill{height:100%;background:linear-gradient(90deg,#0ea5e9,#6366f1);}
    `;

    const summaryCards = `
      <div class="stat-bar">
        <div class="stat-item"><h3>${completedPortfolioCourses}</h3><p>Completed</p></div>
        <div class="stat-item"><h3>${inProgressPortfolioCourses}</h3><p>In Progress</p></div>
        <div class="stat-item"><h3>${avgPortfolioProgress}%</h3><p>Avg Progress</p></div>
      </div>
      <div class="stat-bar">
        <div class="stat-item"><h3>${strengthCourses[0] || '—'}</h3><p>Top Skill</p></div>
        <div class="stat-item"><h3>${learningCourses[0] || '—'}</h3><p>Top In-progress</p></div>
        <div class="stat-item"><h3>${Math.min(100, avgPortfolioProgress + 15)}%</h3><p>Weekly Goal</p></div>
      </div>
    `;

    const courseCards = portfolioCourses.map((course) => `
      <div class="course-card">
        <h4>${course.name}</h4>
        <p>Status: ${course.status}</p>
        <p>${course.hours}h logged</p>
        <div class="progress-bar"><div class="progress-fill" style="width:${course.progress}%"></div></div>
        <p style="margin-top:6px;font-size:0.75rem;color:#94a3b8;">${course.progress}% complete</p>
      </div>
    `).join('');

    const printHtml = `<!doctype html><html><head><title>Portfolio Report</title><style>${style}</style></head><body><div class="print-container"><div class="print-header"><h1>Portfolio Dashboard</h1><button onclick="window.print()" style="padding:8px 12px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;">Print</button></div><div class="card"><h2>Learning Portfolio</h2><p>A career-ready view of your course progress and expertise.</p>${summaryCards}<div class="row">${courseCards}</div></div></div></body></html>`;

    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 200);
    setTimeout(() => printWindow.close(), 400);
  };

  // Helper to generate roadmap.sh links for skills
  const getRoadmapLink = (skill) => {
    const skillMap = {
      'react': 'react',
      'reactjs': 'react',
      'react.js': 'react',
      'javascript': 'javascript',
      'js': 'javascript',
      'typescript': 'typescript',
      'ts': 'typescript',
      'python': 'python',
      'java': 'java',
      'node': 'nodejs',
      'nodejs': 'nodejs',
      'node.js': 'nodejs',
      'express': 'nodejs',
      'angular': 'angular',
      'vue': 'vue',
      'vuejs': 'vue',
      'vue.js': 'vue',
      'frontend': 'frontend',
      'backend': 'backend',
      'full stack': 'full-stack',
      'fullstack': 'full-stack',
      'devops': 'devops',
      'docker': 'docker',
      'kubernetes': 'kubernetes',
      'k8s': 'kubernetes',
      'aws': 'aws',
      'mongodb': 'mongodb',
      'sql': 'sql',
      'postgresql': 'postgresql',
      'postgres': 'postgresql',
      'mysql': 'sql',
      'graphql': 'graphql',
      'git': 'git-github',
      'github': 'git-github',
      'android': 'android',
      'flutter': 'flutter',
      'react native': 'react-native',
      'machine learning': 'mlops',
      'ml': 'mlops',
      'data science': 'data-analyst',
      'data analyst': 'data-analyst',
      'cyber security': 'cyber-security',
      'blockchain': 'blockchain',
      'golang': 'golang',
      'go': 'golang',
      'rust': 'rust',
      'c++': 'cpp',
      'cpp': 'cpp',
      'system design': 'system-design',
      'software architecture': 'software-architect',
      'dsa': 'datastructures-and-algorithms',
      'data structures': 'datastructures-and-algorithms',
      'algorithms': 'datastructures-and-algorithms',
      'api': 'api-design',
      'rest api': 'api-design',
      'linux': 'linux',
      'computer science': 'computer-science',
      'ai': 'ai-engineer'
    };
    
    const normalizedSkill = skill.toLowerCase().trim();
    const roadmapPath = skillMap[normalizedSkill];
    if (roadmapPath) {
      return `https://roadmap.sh/${roadmapPath}`;
    }
    // Try partial match
    for (const [key, value] of Object.entries(skillMap)) {
      if (normalizedSkill.includes(key) || key.includes(normalizedSkill)) {
        return `https://roadmap.sh/${value}`;
      }
    }
    return null;
  };

  // Helper to safely render resources (handles both string and object formats)
  const renderResource = (resource, index) => {
    if (typeof resource === 'string') {
      return (
        <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="font-medium text-blue-800 text-base">{resource}</p>
        </div>
      );
    }
    return (
      <div key={index} className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {resource.type?.toLowerCase().includes('youtube') ? (
            <Youtube className="w-6 h-6 text-red-600" />
          ) : (
            <Globe className="w-6 h-6 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-zinc-900 text-base">{resource.name}</p>
          {resource.type && <p className="text-sm text-zinc-500">{resource.type}</p>}
          {resource.url && <p className="text-sm text-blue-600 truncate">{resource.url}</p>}
          {resource.why && <p className="text-sm text-red-600 mt-1">💡 {resource.why}</p>}
          {resource.how_to_use && <p className="text-sm text-zinc-600 mt-1">📝 {resource.how_to_use}</p>}
        </div>
      </div>
    );
  };

  // Helper to safely render projects
  const renderProject = (project, index) => {
    if (typeof project === 'string') {
      return (
        <div key={index} className="p-5 bg-purple-50 rounded-xl border border-purple-100">
          <h5 className="font-bold text-purple-800 text-lg">🛠️ {project}</h5>
        </div>
      );
    }
    return (
      <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 mb-4">
        <h5 className="font-bold text-purple-900 text-xl mb-3">🛠️ {project.name}</h5>
        {project.description && <p className="text-purple-800 text-base mb-4">{project.description}</p>}
        
        {project.features?.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-purple-600 mb-2">FEATURES:</p>
            <div className="flex flex-wrap gap-2">
              {project.features.map((f, j) => (
                <span key={j} className="text-sm bg-white text-purple-700 px-3 py-1.5 rounded border border-purple-200">{f}</span>
              ))}
            </div>
          </div>
        )}

        {project.tech_stack?.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-purple-600 mb-2">TECH STACK:</p>
            <div className="flex flex-wrap gap-2">
              {project.tech_stack.map((t, j) => (
                <span key={j} className="text-sm bg-purple-900 text-white px-3 py-1.5 rounded font-medium">{t}</span>
              ))}
            </div>
          </div>
        )}

        {project.skills_practiced?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-purple-600 mb-1">SKILLS PRACTICED:</p>
            <div className="flex flex-wrap gap-1">
              {project.skills_practiced.map((s, j) => (
                <span key={j} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">{s}</span>
              ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          {project.time_required && (
            <div className="bg-white rounded-lg p-2 border border-purple-100">
              <span className="text-purple-600">⏱️ Time:</span> {project.time_required}
            </div>
          )}
          {project.deploy_on && (
            <div className="bg-white rounded-lg p-2 border border-purple-100">
              <span className="text-purple-600">🚀 Deploy:</span> {project.deploy_on}
            </div>
          )}
        </div>

        {project.github_tips && <p className="text-xs text-purple-700 mt-2">📁 {project.github_tips}</p>}

        {project.interview_talking_points?.length > 0 && (
          <div className="mt-3 bg-white rounded-lg p-3 border border-purple-100">
            <p className="text-xs font-semibold text-purple-600 mb-1">🎤 INTERVIEW TALKING POINTS:</p>
            <ul className="space-y-1">
              {project.interview_talking_points.map((point, j) => (
                <li key={j} className="text-xs text-zinc-600 flex items-start gap-1">
                  <span>•</span> {point}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Helper to render week content
  const renderWeek = (week, index) => {
    const weekLabel = typeof week.week === 'number' ? `Week ${week.week}` : week.week;
    const theme = week.theme || week.topic || '';
    const tasks = week.daily_tasks || week.tasks || [];

    return (
      <div key={index} className="bg-zinc-50 rounded-xl p-5 border border-zinc-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-4 py-1.5 bg-zinc-900 text-white text-base font-bold rounded-lg">{weekLabel}</span>
          {theme && <span className="font-semibold text-zinc-800 text-lg">{theme}</span>}
        </div>
        
        {/* Daily Tasks - handles both formats */}
        {tasks.length > 0 && (
          <div className="space-y-2 mb-4">
            {tasks.map((task, j) => {
              if (typeof task === 'string') {
                return (
                  <div key={j} className="flex items-start gap-2 text-base text-zinc-700">
                    <Play className="w-4 h-4 mt-1 text-zinc-400 flex-shrink-0" />
                    {task}
                  </div>
                );
              }
              return (
                <div key={j} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-zinc-100">
                  <span className="text-sm font-bold text-zinc-500 w-16">{task.day}</span>
                  <span className="flex-1 text-base text-zinc-700">{task.task}</span>
                  {task.duration && <span className="text-sm text-zinc-400">{task.duration}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Coding Problems */}
        {week.coding_problems && (
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-purple-800 text-base flex items-center gap-2">
                <Code className="w-5 h-5" /> Coding Practice
              </span>
              <span className="text-sm bg-purple-200 text-purple-800 px-3 py-1 rounded font-medium">
                {week.coding_problems.count} problems • {week.coding_problems.difficulty}
              </span>
            </div>
            {week.coding_problems.topics?.length > 0 && (
              <p className="text-sm text-purple-600 mb-3">Topics: {week.coding_problems.topics.join(', ')}</p>
            )}
            {week.coding_problems.must_solve?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {week.coding_problems.must_solve.map((prob, k) => (
                  <span key={k} className="text-sm bg-white text-purple-700 px-3 py-1.5 rounded border border-purple-200">{prob}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Checkpoint */}
        {week.checkpoint && (
          <div className="mt-4 flex items-start gap-2 text-base">
            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-emerald-700 font-medium">{week.checkpoint}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-18 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBackToSetup} 
              title="Back to Career Setup"
              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-zinc-900 text-xl">Your Career Development Roadmap</span>
                <p className="text-sm text-zinc-500">{role?.role_name || analysis.career_role}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Toggle Switch - right side, green active */}
            <div className="hidden md:flex items-center bg-zinc-100/60 backdrop-blur-sm p-1 rounded-2xl border border-zinc-200/70 shadow-inner">
              <button
                onClick={() => setViewMode('skill')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  viewMode === 'skill'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Skill Lab
              </button>
              <button
                onClick={() => navigate('/academic')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  viewMode === 'academic'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                    : 'text-zinc-500 hover:text-violet-600'
                }`}
              >
                🎓 T7 Tutor
              </button>
            </div>
            <button 
              onClick={handleBackToSetup} 
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              Update Skills / Setup
            </button>
            <button onClick={logout} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Score Hero */}
        <div className="bg-zinc-900 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8">
            {/* Score Circle */}
            <div className="flex-shrink-0">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="14" fill="none" />
                  <circle cx="80" cy="80" r="70"
                    stroke={readiness_score >= 70 ? '#10b981' : readiness_score >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="14" fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - readiness_score / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-white">{readiness_score}%</span>
                  <span className="text-zinc-400 text-base">Ready</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 text-white">
              <h1 className="text-3xl font-black mb-3">{role?.role_name || analysis.career_role}</h1>
              
              {honest_assessment && (
                <p className="text-zinc-300 mb-5 text-base bg-zinc-800/50 p-4 rounded-xl">💬 {honest_assessment}</p>
              )}

              {Object.keys(score_breakdown).length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-5">
                  {score_breakdown.technical_skills !== undefined && (
                    <div className="bg-zinc-800 rounded-xl p-4 text-center">
                      <p className={`text-3xl font-black ${getScoreColor(score_breakdown.technical_skills)}`}>{score_breakdown.technical_skills}%</p>
                      <p className="text-sm text-zinc-400">Technical</p>
                    </div>
                  )}
                  {score_breakdown.projects !== undefined && (
                    <div className="bg-zinc-800 rounded-xl p-4 text-center">
                      <p className={`text-3xl font-black ${getScoreColor(score_breakdown.projects)}`}>{score_breakdown.projects}%</p>
                      <p className="text-sm text-zinc-400">Projects</p>
                    </div>
                  )}
                  {score_breakdown.interview_readiness !== undefined && (
                    <div className="bg-zinc-800 rounded-xl p-4 text-center">
                      <p className={`text-3xl font-black ${getScoreColor(score_breakdown.interview_readiness)}`}>{score_breakdown.interview_readiness}%</p>
                      <p className="text-sm text-zinc-400">Interview</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-base font-medium">
                  ✓ {matched_skills.length} skills matched
                </span>
                <span className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-base font-medium">
                  📚 {missing_skills.length} to learn
                </span>
                <span className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-base font-medium">
                  📅 {learning_roadmap.length} months plan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact YouTube Learning Tracker & T7 Sync Banner */}
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
                    copiedT7 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white border border-white/10'
                  }`}
                  title="Copy T7 Account ID"
                >
                  {copiedT7 ? (
                    <><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Copied ID</>
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

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-2 mb-6 shadow-lg border border-zinc-100">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'home', icon: Home, label: 'Home' },
              { id: 'roadmap', icon: Rocket, label: 'Roadmap' },
              { id: 'skills', icon: Target, label: 'Skills' },
              { id: 'ats', icon: FileText, label: 'ATS Resume' },
              { id: 'youtube', icon: Youtube, label: 'YouTube Tracker' },
              { id: 'tips', icon: Briefcase, label: 'Career Tips' },
              { id: 'portfolio', icon: Code, label: 'Portfolio' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all whitespace-nowrap flex-1 justify-center ${
                  activeTab === tab.id
                    ? 'bg-zinc-900 text-white shadow-md'
                    : 'bg-transparent text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Learning Activity + Course Manager Grid - Below Navigation */}
        {activeTab === 'home' && (
          <div className="grid lg:grid-cols-3 gap-5 mb-6">
            {/* Learning Activity Graph - Compact Version */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-lg border border-zinc-100">
              {/* Header with Stats */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Learning Activity
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Track your daily progress
                </p>
              </div>
              
              {/* Compact Stats */}
              <div className="flex gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-600">
                    {(() => {
                      let total = 0;
                      for (let i = 0; i < 365; i++) {
                        total += Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0;
                      }
                      return total;
                    })()}
                  </p>
                  <p className="text-[10px] text-zinc-500">Hours</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600">
                    {(() => {
                      let days = 0;
                      for (let i = 0; i < 365; i++) {
                        if (Math.random() > 0.7) days++;
                      }
                      return days;
                    })()}
                  </p>
                  <p className="text-[10px] text-zinc-500">Days</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-600">
                    {Math.floor(Math.random() * 15)}
                  </p>
                  <p className="text-[10px] text-zinc-500">Streak</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mb-3 text-[10px] text-zinc-500">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-zinc-100 border border-zinc-200"></div>
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-200 border border-emerald-300"></div>
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-emerald-500"></div>
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600 border border-emerald-700"></div>
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-800 border border-emerald-900"></div>
              </div>
              <span>More</span>
            </div>
            
            {/* Activity Grid - Compact */}
            <div className="overflow-x-auto pb-2">
              <div className="inline-flex gap-0.5 min-w-full">
                {(() => {
                  const weeks = [];
                  const today = new Date();
                  const startDate = new Date(today);
                  startDate.setDate(today.getDate() - 364);
                  
                  let dayCounter = 0;
                  
                  for (let week = 0; week < 53; week++) {
                    const weekDays = [];
                    
                    for (let day = 0; day < 7; day++) {
                      if (dayCounter >= 365) break;
                      
                      const currentDate = new Date(startDate);
                      currentDate.setDate(startDate.getDate() + dayCounter);
                      
                      if (week === 0 && day < startDate.getDay()) {
                        weekDays.push(null);
                        continue;
                      }
                      
                      const hours = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0;
                      const level = hours === 0 ? 0 : hours <= 1 ? 1 : hours <= 2 ? 2 : hours <= 3 ? 3 : 4;
                      
                      weekDays.push({
                        date: currentDate.toISOString().split('T')[0],
                        hours: hours,
                        level: level,
                        activity: hours > 0 ? ['Coding', 'Reading', 'Practice'][Math.floor(Math.random() * 3)] : null
                      });
                      
                      dayCounter++;
                    }
                    
                    weeks.push(weekDays);
                    if (dayCounter >= 365) break;
                  }
                  
                  return weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-0.5">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                        const day = week[dayIndex];
                        
                        if (!day) {
                          return <div key={dayIndex} className="w-2.5 h-2.5"></div>;
                        }
                        
                        const levelColors = {
                          0: 'bg-zinc-100 border border-zinc-200',
                          1: 'bg-emerald-200 border border-emerald-300',
                          2: 'bg-emerald-400 border border-emerald-500',
                          3: 'bg-emerald-600 border border-emerald-700',
                          4: 'bg-emerald-800 border border-emerald-900'
                        };
                        
                        const dateObj = new Date(day.date);
                        const formattedDate = dateObj.toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric'
                        });
                        
                        return (
                          <div
                            key={dayIndex}
                            className={`w-2.5 h-2.5 rounded-sm ${levelColors[day.level]} transition-all hover:ring-1 hover:ring-emerald-500 cursor-pointer group relative`}
                            title={`${day.hours} hours - ${formattedDate}`}
                          >
                            {/* Compact Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                              {day.hours}h · {formattedDate}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Month Labels - Compact */}
            <div className="flex justify-between mt-2 text-[10px] text-zinc-400 px-1">
              <span>Jan</span>
              <span>Mar</span>
              <span>May</span>
              <span>Jul</span>
              <span>Sep</span>
              <span>Nov</span>
            </div>

            {/* Compact Learning Snapshot */}
            <div className="mt-4 border-t border-zinc-100 pt-4">
              <h4 className="font-semibold text-zinc-800 mb-3">Learning Snapshot</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                  <p className="text-xs text-zinc-500 mb-1">Recommended focus</p>
                  <p className="font-semibold text-zinc-900">{missing_skills[0] ? `Improve ${missing_skills[0]}` : 'Strengthen your fundamentals'}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                  <p className="text-xs text-zinc-500 mb-1">Matched skills</p>
                  <p className="font-semibold text-zinc-900">{matched_skills.length} skills</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                  <p className="text-xs text-zinc-500 mb-1">Missing skills</p>
                  <p className="font-semibold text-zinc-900">{missing_skills.length} skills</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                  <p className="text-xs text-zinc-500 mb-1">Next milestone</p>
                  <p className="font-semibold text-zinc-900">Complete {missing_skills.slice(0, 2).join(' + ') || 'your roadmap'}</p>
                </div>
              </div>
            </div>

            {ats_analysis && (
              <div className={`mt-4 rounded-2xl border p-4 ${getAtsTone(ats_analysis.score).bg} ${getAtsTone(ats_analysis.score).border}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-zinc-900 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      ATS Resume Snapshot
                    </h4>
                    <p className="text-sm text-zinc-600 mt-1">
                      {resume_meta?.file_name || 'Uploaded resume'} checked against {role?.role_name || analysis.career_role}
                    </p>
                  </div>
                  <div className={`text-3xl font-black ${getAtsTone(ats_analysis.score).text}`}>
                    {ats_analysis.score}%
                  </div>
                </div>
                <p className="text-sm text-zinc-700 mt-3">{ats_analysis.summary}</p>
                {ats_analysis.keyword_gaps?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Top keyword gaps</p>
                    <div className="flex flex-wrap gap-2">
                      {ats_analysis.keyword_gaps.slice(0, 4).map((gap, index) => (
                        <span key={index} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 border border-zinc-200">
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Course Manager Section */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-zinc-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Recommended Courses
              </h2>
            </div>

            <div className="space-y-3">
              {/* Generate course recommendations based on missing skills */}
              {(() => {
                // Course database with real links
                const courseDatabase = {
                  'react': {
                    name: 'React - The Complete Guide',
                    platform: 'Udemy',
                    url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
                    icon: '⚛️',
                    color: 'blue'
                  },
                  'javascript': {
                    name: 'JavaScript: Complete Course',
                    platform: 'freeCodeCamp',
                    url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
                    icon: '📜',
                    color: 'yellow'
                  },
                  'node.js': {
                    name: 'Node.js Developer Course',
                    platform: 'Udemy',
                    url: 'https://www.udemy.com/course/the-complete-nodejs-developer-course-2/',
                    icon: '🟢',
                    color: 'green'
                  },
                  'nodejs': {
                    name: 'Node.js Developer Course',
                    platform: 'Udemy',
                    url: 'https://www.udemy.com/course/the-complete-nodejs-developer-course-2/',
                    icon: '🟢',
                    color: 'green'
                  },
                  'python': {
                    name: 'Python for Everybody',
                    platform: 'Coursera',
                    url: 'https://www.coursera.org/specializations/python',
                    icon: '🐍',
                    color: 'emerald'
                  },
                  'dsa': {
                    name: 'Data Structures & Algorithms',
                    platform: 'freeCodeCamp',
                    url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
                    icon: '🧩',
                    color: 'purple'
                  },
                  'data structures': {
                    name: 'Data Structures & Algorithms',
                    platform: 'freeCodeCamp',
                    url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
                    icon: '🧩',
                    color: 'purple'
                  },
                  'algorithms': {
                    name: 'Algorithms Specialization',
                    platform: 'Coursera',
                    url: 'https://www.coursera.org/specializations/algorithms',
                    icon: '🧮',
                    color: 'purple'
                  },
                  'system design': {
                    name: 'System Design Interview',
                    platform: 'ByteByteGo',
                    url: 'https://bytebytego.com/',
                    icon: '🏗️',
                    color: 'pink'
                  },
                  'typescript': {
                    name: 'TypeScript Complete Course',
                    platform: 'Scrimba',
                    url: 'https://scrimba.com/learn/typescript',
                    icon: '📘',
                    color: 'blue'
                  },
                  'mongodb': {
                    name: 'MongoDB University',
                    platform: 'MongoDB',
                    url: 'https://learn.mongodb.com/',
                    icon: '🍃',
                    color: 'green'
                  },
                  'sql': {
                    name: 'SQL for Data Science',
                    platform: 'Coursera',
                    url: 'https://www.coursera.org/learn/sql-for-data-science',
                    icon: '🗄️',
                    color: 'blue'
                  },
                  'docker': {
                    name: 'Docker Mastery',
                    platform: 'Udemy',
                    url: 'https://www.udemy.com/course/docker-mastery/',
                    icon: '🐳',
                    color: 'cyan'
                  },
                  'git': {
                    name: 'Git & GitHub Crash Course',
                    platform: 'freeCodeCamp',
                    url: 'https://www.freecodecamp.org/news/git-and-github-crash-course/',
                    icon: '📦',
                    color: 'orange'
                  },
                  'aws': {
                    name: 'AWS Certified Developer',
                    platform: 'AWS Training',
                    url: 'https://aws.amazon.com/training/',
                    icon: '☁️',
                    color: 'amber'
                  },
                  'express': {
                    name: 'Express.js Fundamentals',
                    platform: 'freeCodeCamp',
                    url: 'https://www.freecodecamp.org/news/free-8-hour-node-express-course/',
                    icon: '🚂',
                    color: 'zinc'
                  },
                  'html': {
                    name: 'Learn HTML',
                    platform: 'YouTube',
                    url: 'https://www.youtube.com/results?search_query=html+tutorial',
                    icon: '📺',
                    color: 'red'
                  },
                  'css': {
                    name: 'Learn CSS',
                    platform: 'YouTube',
                    url: 'https://www.youtube.com/results?search_query=css+tutorial',
                    icon: '📺',
                    color: 'red'
                  }
                };

                // Map missing skills to courses
                const recommendedCourses = missing_skills
                  .slice(0, 4) // Show top 4
                  .map(skill => {
                    const normalizedSkill = skill.toLowerCase().trim();
                    const course = courseDatabase[normalizedSkill] || {
                      name: `Learn ${skill}`,
                      platform: 'YouTube',
                      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + ' tutorial')}`,
                      icon: '📺',
                      color: 'red'
                    };
                    return { ...course, skill };
                  });

                const colorClasses = {
                  blue: 'bg-blue-50 border-blue-100 hover:bg-blue-100',
                  yellow: 'bg-yellow-50 border-yellow-100 hover:bg-yellow-100',
                  green: 'bg-green-50 border-green-100 hover:bg-green-100',
                  emerald: 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100',
                  purple: 'bg-purple-50 border-purple-100 hover:bg-purple-100',
                  pink: 'bg-pink-50 border-pink-100 hover:bg-pink-100',
                  cyan: 'bg-cyan-50 border-cyan-100 hover:bg-cyan-100',
                  orange: 'bg-orange-50 border-orange-100 hover:bg-orange-100',
                  amber: 'bg-amber-50 border-amber-100 hover:bg-amber-100',
                  zinc: 'bg-zinc-50 border-zinc-100 hover:bg-zinc-100',
                  red: 'bg-red-50 border-red-100 hover:bg-red-100'
                };

                return recommendedCourses.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 mb-2">FOR YOUR MISSING SKILLS</p>
                    <div className="space-y-2">
                      {recommendedCourses.map((course, idx) => (
                        <a
                          key={idx}
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`block p-3 rounded-lg border transition-all cursor-pointer ${colorClasses[course.color]}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 flex items-start gap-2">
                              <span className="text-xl">{course.icon}</span>
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-zinc-900 mb-0.5">{course.name}</p>
                                <p className="text-xs text-zinc-600">{course.platform}</p>
                                <p className="text-xs text-zinc-500 mt-1">Learn: {course.skill}</p>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-zinc-400 flex-shrink-0 ml-2" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-semibold text-zinc-900">All caught up!</p>
                    <p className="text-sm text-zinc-500">You have all the required skills</p>
                  </div>
                );
              })()}

              {/* Additional Resources */}
              {missing_skills.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-100">
                  <p className="text-xs font-semibold text-zinc-500 mb-2">MORE PLATFORMS</p>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="https://www.udemy.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-100 transition-colors text-center"
                    >
                      <p className="text-xs font-semibold text-purple-900">Udemy</p>
                    </a>
                    <a
                      href="https://www.coursera.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors text-center"
                    >
                      <p className="text-xs font-semibold text-blue-900">Coursera</p>
                    </a>
                    <a
                      href="https://www.freecodecamp.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-green-50 hover:bg-green-100 rounded-lg border border-green-100 transition-colors text-center"
                    >
                      <p className="text-xs font-semibold text-green-900">freeCodeCamp</p>
                    </a>
                    <a
                      href="https://scrimba.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-100 transition-colors text-center"
                    >
                      <p className="text-xs font-semibold text-orange-900">Scrimba</p>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}


        {/* TAB: Roadmap */}
        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            {motivation && (
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-100 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                  <h3 className="font-bold text-emerald-800 text-xl">You've Got This! 💪</h3>
                </div>
                <p className="text-emerald-700 text-lg">{motivation}</p>
              </div>
            )}

            {/* Quick Access Roadmaps from roadmap.sh */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" /> Explore Detailed Roadmaps
                </h2>
                <a 
                  href="https://roadmap.sh" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  Visit roadmap.sh <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-base text-zinc-600 mb-5">📚 Interactive learning paths created by the community. Click to explore in-depth roadmaps:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                { name: 'Frontend', path: 'frontend', color: 'bg-blue-500', pdf: '/roadmaps/frontend.pdf' },
                { name: 'Backend', path: 'backend', color: 'bg-emerald-500', pdf: '/roadmaps/backend.pdf' },
                { name: 'React', path: 'react', color: 'bg-cyan-500', pdf: '/roadmaps/react.pdf' },
                { name: 'JavaScript', path: 'javascript', color: 'bg-yellow-500', pdf: '/roadmaps/javascript.pdf' },
                { name: 'Python', path: 'python', color: 'bg-green-500', pdf: '/roadmaps/python.pdf' },
                { name: 'Node.js', path: 'nodejs', color: 'bg-lime-600', pdf: '/roadmaps/nodejs.pdf' },
                { name: 'DSA', path: 'datastructures-and-algorithms', color: 'bg-purple-500', pdf: '/roadmaps/datastructures-and-algorithms.pdf' },
                { name: 'System Design', path: 'system-design', color: 'bg-pink-500', pdf: '/roadmaps/system-design.pdf' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => setSelectedRoadmap({ name: item.name, path: item.path, pdf: item.pdf })}
                  className="flex items-center gap-3 p-4 bg-zinc-50 hover:bg-zinc-100 rounded-xl border border-zinc-200 transition-all hover:shadow-md group"
                >
                  <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-800 text-base">{item.name}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
                </button>
              ))}
                
              </div>
            </div>

            {/* Learning Resources */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border border-purple-100 mb-6">
              <h2 className="font-bold text-zinc-900 text-xl mb-5 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" /> Free Learning Platforms
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'freeCodeCamp', url: 'https://freecodecamp.org', desc: 'Full-stack curriculum', icon: '💻' },
                  { name: 'LeetCode', url: 'https://leetcode.com', desc: 'DSA & Interview prep', icon: '🧩' },
                  { name: 'The Odin Project', url: 'https://theodinproject.com', desc: 'Web Development', icon: '🌐' },
                  { name: 'CS50', url: 'https://cs50.harvard.edu', desc: 'Harvard CS Course', icon: '🎓' },
                  { name: 'Scrimba', url: 'https://scrimba.com', desc: 'Interactive coding', icon: '🎬' },
                  { name: 'GeeksforGeeks', url: 'https://geeksforgeeks.org', desc: 'DSA & Tutorials', icon: '📚' },
                ].map((platform) => (
                  <a
                    key={platform.name}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-purple-100 hover:shadow-md transition-all group"
                  >
                    <span className="text-3xl">{platform.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-zinc-800 text-base">{platform.name}</p>
                      <p className="text-sm text-zinc-500">{platform.desc}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-zinc-400 group-hover:text-purple-500" />
                  </a>
                ))}
              </div>
            </div>

            {/* Study Tips */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100 mb-6">
              <h2 className="font-bold text-zinc-900 text-xl mb-5 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-500" /> How to Use This Roadmap Effectively
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0">1</div>
                    <div>
                      <p className="font-semibold text-zinc-800 text-base">Follow the Order</p>
                      <p className="text-sm text-zinc-600">Each month builds on the previous. Don't skip ahead!</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0">2</div>
                    <div>
                      <p className="font-semibold text-zinc-800 text-base">Build Projects</p>
                      <p className="text-sm text-zinc-600">Projects {'>'} Tutorials. Actually code, don't just watch.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0">3</div>
                    <div>
                      <p className="font-semibold text-zinc-800 text-base">Solve Daily Problems</p>
                      <p className="text-sm text-zinc-600">2-3 LeetCode problems daily. Start easy, go to medium.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0">4</div>
                    <div>
                      <p className="font-semibold text-zinc-800 text-base">Track Progress</p>
                      <p className="text-sm text-zinc-600">Use the checklists. Tick off completed items.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0">5</div>
                    <div>
                      <p className="font-semibold text-zinc-800 text-base">Join Communities</p>
                      <p className="text-sm text-zinc-600">Discord, Reddit, Twitter. Learn with others!</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0">6</div>
                    <div>
                      <p className="font-semibold text-zinc-800 text-base">Stay Consistent</p>
                      <p className="text-sm text-zinc-600">2 hours daily {'>'} 10 hours on weekends. Consistency wins.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {learning_roadmap.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-zinc-200">
                <Rocket className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500">No roadmap data available. Try analyzing again.</p>
              </div>
            ) : (
              learning_roadmap.map((phase, index) => {
                // Handle both data formats
                const skills = phase.skills_covered || phase.skills || [];
                const weeks = phase.weeks || [];
                const resources = phase.resources || [];
                const projects = phase.projects || [];
                const milestones = phase.milestones || phase.end_of_month_checklist || [];
                const mistakes = phase.mistakes_to_avoid || [];
                const interviewPrep = phase.interview_prep;

                return (
                  <div key={index} className="bg-white border-2 border-zinc-100 rounded-2xl overflow-hidden shadow-lg">
                    {/* Month Header */}
                    <button
                      onClick={() => setExpandedMonth(expandedMonth === index ? -1 : index)}
                      className="w-full p-6 hover:bg-zinc-50 transition-colors flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl ${
                          index === 0 ? 'bg-zinc-900' : 'bg-zinc-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-900 text-xl">
                            {phase.month}{phase.title ? `: ${phase.title}` : phase.focus ? `: ${phase.focus}` : ''}
                          </h3>
                          <p className="text-zinc-500 text-base">{phase.goal || phase.theme || `Focus: ${phase.focus || 'Learning'}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {phase.hours_per_week && (
                          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-lg">
                            <Clock className="w-5 h-5 text-zinc-500" />
                            <span className="text-base font-medium text-zinc-700">{phase.hours_per_week} hrs/week</span>
                          </div>
                        )}
                        <ChevronDown className={`w-6 h-6 text-zinc-400 transition-transform ${expandedMonth === index ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {expandedMonth === index && (
                      <div className="p-6 border-t-2 border-zinc-100 space-y-6">
                        {/* Daily Schedule */}
                        {phase.daily_schedule && (
                          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                            <h4 className="font-bold text-blue-800 text-lg mb-4 flex items-center gap-2">
                              <Clock className="w-5 h-5" /> Daily Study Schedule
                            </h4>
                            <div className="grid sm:grid-cols-2 gap-4">
                              {phase.daily_schedule.weekdays && (
                                <div className="bg-white rounded-lg p-4">
                                  <p className="text-sm font-semibold text-blue-600 mb-2">📅 WEEKDAYS</p>
                                  <p className="text-base text-zinc-700">{phase.daily_schedule.weekdays}</p>
                                </div>
                              )}
                              {phase.daily_schedule.weekends && (
                                <div className="bg-white rounded-lg p-4">
                                  <p className="text-sm font-semibold text-blue-600 mb-2">🏠 WEEKENDS</p>
                                  <p className="text-base text-zinc-700">{phase.daily_schedule.weekends}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Skills */}
                        {skills.length > 0 && (
                          <div>
                            <h4 className="font-bold text-zinc-800 text-lg mb-4 flex items-center gap-2">
                              <Target className="w-5 h-5" /> Skills to Master
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {skills.map((skill, i) => {
                                const roadmapUrl = getRoadmapLink(skill);
                                return roadmapUrl ? (
                                  <a
                                    key={i}
                                    href={roadmapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-base font-semibold hover:bg-zinc-700 transition-colors flex items-center gap-2 group"
                                  >
                                    {skill}
                                    <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                                  </a>
                                ) : (
                                  <span key={i} className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-base font-semibold">{skill}</span>
                                );
                              })}
                            </div>
                            <p className="text-sm text-zinc-500 mt-3 flex items-center gap-1">
                              <ExternalLink className="w-4 h-4" /> Click on skills to view detailed roadmap on roadmap.sh
                            </p>
                          </div>
                        )}

                        {/* Weeks */}
                        {weeks.length > 0 && (
                          <div>
                            <h4 className="font-bold text-zinc-800 text-lg mb-4 flex items-center gap-2">
                              <Calendar className="w-5 h-5" /> Week-by-Week Plan
                            </h4>
                            <div className="space-y-4">
                              {weeks.map((week, i) => renderWeek(week, i))}
                            </div>
                          </div>
                        )}

                        {/* Resources */}
                        {resources.length > 0 && (
                          <div>
                            <h4 className="font-bold text-zinc-800 text-lg mb-4 flex items-center gap-2">
                              <BookOpen className="w-5 h-5" /> Free Resources
                            </h4>
                            <div className="grid sm:grid-cols-2 gap-4">
                              {resources.map((res, i) => renderResource(res, i))}
                            </div>
                          </div>
                        )}

                        {/* Projects */}
                        {projects.length > 0 && (
                          <div>
                            <h4 className="font-bold text-zinc-800 text-lg mb-4 flex items-center gap-2">
                              <Code className="w-5 h-5" /> Portfolio Projects
                            </h4>
                            {projects.map((proj, i) => renderProject(proj, i))}
                          </div>
                        )}

                        {/* Interview Prep */}
                        {interviewPrep && (
                          <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                            <h4 className="font-bold text-amber-800 text-lg mb-4 flex items-center gap-2">
                              <Briefcase className="w-5 h-5" /> Interview Preparation
                            </h4>
                            
                            {typeof interviewPrep === 'string' ? (
                              <p className="text-base text-amber-700">{interviewPrep}</p>
                            ) : (
                              <>
                                {interviewPrep.concepts_to_master?.length > 0 && (
                                  <div className="mb-4">
                                    <p className="text-sm font-semibold text-amber-600 mb-2">MASTER THESE:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {interviewPrep.concepts_to_master.map((c, i) => (
                                        <span key={i} className="text-sm bg-white text-amber-700 px-3 py-1.5 rounded border border-amber-200">{c}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {interviewPrep.common_questions?.length > 0 && (
                                  <div className="space-y-3">
                                    {interviewPrep.common_questions.map((q, i) => (
                                      <div key={i} className="bg-white rounded-lg p-4 border border-amber-100">
                                        <p className="font-medium text-zinc-900 text-base mb-2">❓ {q.question}</p>
                                        <p className="text-sm text-amber-700">💡 {q.how_to_answer}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {interviewPrep.practice_tip && (
                                  <p className="text-base text-amber-700 mt-4">🎯 {interviewPrep.practice_tip}</p>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Mistakes */}
                        {mistakes.length > 0 && (
                          <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                            <h4 className="font-bold text-red-800 text-lg mb-4 flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5" /> Avoid These Mistakes
                            </h4>
                            <ul className="space-y-3">
                              {mistakes.map((m, i) => (
                                <li key={i} className="flex items-start gap-3 text-base text-red-700">
                                  <span className="text-red-500 text-lg">✗</span> {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Milestones */}
                        {milestones.length > 0 && (
                          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                            <h4 className="font-bold text-emerald-800 text-lg mb-4 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5" /> End of Month Checklist
                            </h4>
                            <ul className="space-y-3">
                              {milestones.map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-base text-emerald-700">
                                  <span className="w-6 h-6 rounded border-2 border-emerald-300 flex-shrink-0 mt-0.5"></span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Final Outcome */}
            {final_outcome && (
              <div className="bg-zinc-900 rounded-2xl p-8 text-white text-center">
                <Award className="w-14 h-14 mx-auto mb-4 text-amber-400" />
                <h3 className="text-2xl font-bold mb-3">🎓 After This Roadmap</h3>
                <p className="text-zinc-300 text-lg">{final_outcome}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: Skills */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            {/* Priority Order */}
            {skill_priority_order.length > 0 && (
              <div className="bg-gradient-to-r from-indigo-50 via-cyan-50 to-emerald-50 rounded-3xl p-6 shadow-2xl border border-indigo-100">
                <h2 className="font-bold text-zinc-900 text-2xl mb-5 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-indigo-500" /> Skills Priority Order
                </h2>
                <p className="text-sm text-zinc-500 mb-4">Level-up plan with stepwise focus. Follow the ranked list to maximize learning velocity.</p>
                <div className="relative">
                  <div className="absolute left-8 top-14 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 via-cyan-300 to-emerald-300"></div>
                  <div className="space-y-4">
                    {skill_priority_order.map((item, i) => {
                      const isObject = typeof item === 'object';
                      const gradientBadge = i % 3 === 0 ? 'from-indigo-500 to-blue-400' : i % 3 === 1 ? 'from-emerald-500 to-teal-400' : 'from-amber-500 to-orange-400';
                      return (
                        <div key={i} className="relative flex items-start gap-4 p-4 bg-white/90 backdrop-blur-sm border border-white shadow-sm rounded-2xl hover:shadow-lg transition-shadow">
                          <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradientBadge} flex items-center justify-center text-white font-extrabold text-lg`}>
                              {i + 1}
                            </div>
                          </div>

                          <div className="flex-1">
                            <h4 className="font-bold text-zinc-900 text-lg leading-tight">{isObject ? item.skill : item}</h4>
                            {isObject && item.reason && <p className="text-zinc-600 mt-1 text-sm">{item.reason}</p>}

                            {isObject && (
                              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                {item.time_to_learn && (
                                  <div className="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-600 font-semibold">⏱️ {item.time_to_learn}</div>
                                )}
                                {item.difficulty && (
                                  <div className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 font-semibold">📊 {item.difficulty}</div>
                                )}
                                <div className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">✅ {matched_skills.includes(isObject ? item.skill : item) ? 'Acquired' : 'Pending'}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
                <h2 className="font-bold text-zinc-900 text-xl mb-5 flex items-center gap-2">
                  <Check className="w-6 h-6 text-emerald-500" /> Skills You Have ✅
                </h2>
                <div className="flex flex-wrap gap-3">
                  {matched_skills.map((skill, i) => (
                    <span key={i} className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-base font-semibold border border-emerald-100">{skill}</span>
                  ))}
                  {matched_skills.length === 0 && <p className="text-zinc-500 text-base">No matched skills</p>}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
                <h2 className="font-bold text-zinc-900 text-xl mb-5 flex items-center gap-2">
                  <Target className="w-6 h-6 text-amber-500" /> Skills to Learn 📚
                </h2>
                <div className="flex flex-wrap gap-3">
                  {missing_skills.map((skill, i) => (
                    <span key={i} className="px-5 py-2.5 bg-amber-50 text-amber-700 rounded-xl text-base font-semibold border border-amber-100">{skill}</span>
                  ))}
                  {missing_skills.length === 0 && <p className="text-zinc-500 text-base">No missing skills!</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ats' && (
          <div className="space-y-6">
            {!ats_analysis ? (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-zinc-100 text-center max-w-md mx-auto mt-8">
                <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-zinc-900">Test Your Resume</h2>
                <p className="text-zinc-500 mt-2 mb-6 text-sm">
                  Upload your resume here to instantly compare it against the <span className="font-semibold text-zinc-800">{role?.role_name || 'selected'}</span> role requirements and get an ATS score and missing keywords.
                </p>
                
                {resumeError && (
                  <div className="mb-4 text-sm text-red-600 bg-red-50 py-2 px-3 rounded-lg border border-red-100">
                    {resumeError}
                  </div>
                )}

                <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 rounded-xl hover:bg-zinc-50 hover:border-emerald-400 transition-colors cursor-pointer overflow-hidden group">
                  {isParsingResume ? (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin mb-2"></div>
                      <span className="text-sm font-semibold text-emerald-600">Analyzing Resume...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-zinc-100 group-hover:bg-emerald-100 rounded-full flex items-center justify-center mb-2 transition-colors">
                        <FileText className="w-5 h-5 text-zinc-500 group-hover:text-emerald-500" />
                      </div>
                      <span className="text-sm font-semibold text-zinc-700">Click to upload PDF/DOCX</span>
                      <span className="text-xs text-zinc-400 mt-1">Max 10MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleAtsUpload}
                    disabled={isParsingResume}
                  />
                </label>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">ATS Resume Review</p>
                      <h2 className="text-3xl font-black text-zinc-900 mt-1">
                        {resume_meta?.file_name || 'Uploaded Resume'}
                      </h2>
                      <p className="text-zinc-600 mt-2">{ats_analysis.summary}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <label className="cursor-pointer bg-white px-5 py-2.5 rounded-xl text-sm font-bold text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition-colors flex items-center gap-2">
                        {isParsingResume ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin"></div>
                            Analyzing...
                          </>
                        ) : (
                          "Test Another Resume"
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          onChange={handleAtsUpload}
                          disabled={isParsingResume}
                        />
                      </label>
                      <div className={`rounded-3xl px-8 py-6 text-center ${getAtsTone(ats_analysis.score).bg} ${getAtsTone(ats_analysis.score).border} border`}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1">ATS Score</p>
                        <p className={`text-5xl font-black ${getAtsTone(ats_analysis.score).text}`}>{ats_analysis.score}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(ats_analysis.section_scores || {}).map(([key, value]) => (
                    <div key={key} className="bg-white rounded-2xl p-5 shadow-lg border border-zinc-100">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        {key.replace('_', ' ')}
                      </p>
                      <p className={`text-3xl font-black mt-2 ${getScoreColor(value)}`}>{value}%</p>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
                    <h3 className="font-bold text-zinc-900 text-xl mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      What is working
                    </h3>
                    <ul className="space-y-3">
                      {(ats_analysis.strengths || []).map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-zinc-700">
                          <span className="text-emerald-500">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
                    <h3 className="font-bold text-zinc-900 text-xl mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Fix next
                    </h3>
                    <ul className="space-y-3">
                      {(ats_analysis.issues || []).map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-zinc-700">
                          <span className="text-amber-500">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
                    <h3 className="font-bold text-zinc-900 text-xl mb-4">Missing Keywords</h3>
                    <div className="flex flex-wrap gap-3">
                      {(ats_analysis.keyword_gaps || []).map((keyword, index) => (
                        <span key={index} className="px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
                    <h3 className="font-bold text-zinc-900 text-xl mb-4">Suggested Keywords</h3>
                    <div className="flex flex-wrap gap-3">
                      {(ats_analysis.suggested_keywords || []).map((keyword, index) => (
                        <span key={index} className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-100">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
                  <h3 className="font-bold text-zinc-900 text-xl mb-4">Rewrite Suggestions</h3>
                  <div className="space-y-3">
                    {(ats_analysis.rewrite_suggestions || []).map((suggestion, index) => (
                      <div key={index} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-zinc-700">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bridge ATS Gaps with YouTube Learning */}
                <div className="bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 rounded-2xl p-5 text-white border border-zinc-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-600/30">
                      <Youtube className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">Bridge ATS Keyword Gaps with YouTube Learning</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Watch video tutorials for your missing skills using your T7 ID (<span className="font-mono text-amber-300 font-bold">{userProfile?.t7Id || 'T7-XXXXXX'}</span>) to automatically credit verified skills to your profile!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsYouTubeModalOpen(true)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer flex-shrink-0"
                  >
                    <span>Track Video Skills</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: YouTube Learning Tracker */}
        {activeTab === 'youtube' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-800 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30 flex-shrink-0 border border-red-500/30">
                    <Youtube className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-black text-white">YouTube Learning & Skill Sync</h2>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {videoLearning.length > 0 ? 'Extension Synced' : 'Ready to Sync'}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm mt-1 max-w-xl">
                      Watch technical tutorials on YouTube — the T7 Chrome Extension auto-extracts skills and synchronizes them directly into your career readiness score.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {userProfile?.t7Id && (
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-xl border border-white/15">
                      <span className="text-xs text-zinc-400 font-medium">Your T7 ID:</span>
                      <span className="font-mono font-black text-amber-300 text-base">{userProfile.t7Id}</span>
                      <button
                        type="button"
                        onClick={copyT7Id}
                        className="ml-1 text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                        title="Copy ID"
                      >
                        {copiedT7 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedT7 ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsYouTubeModalOpen(true)}
                    className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Open Full YT Dashboard</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Videos Analyzed</p>
                  <p className="text-3xl font-black text-white mt-1">{videoLearning.length}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Skills Extracted</p>
                  <p className="text-3xl font-black text-emerald-400 mt-1">{ytSkills.length}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 col-span-2 sm:col-span-1">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pairing Status</p>
                  <p className="text-base font-bold text-amber-300 mt-1">Chrome Extension Ready</p>
                </div>
              </div>
            </div>

            {/* Video Learning Activity List */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-600" />
                  Recent Synced Videos
                </h3>
                <button
                  onClick={() => setIsYouTubeModalOpen(true)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All in Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {videoLearning.length > 0 ? (
                <div className="space-y-3">
                  {videoLearning.slice(0, 5).map((vid, idx) => (
                    <div key={idx} className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-zinc-900 text-sm">{vid.title || 'Educational Video'}</h4>
                        {vid.topSkills && vid.topSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {vid.topSkills.map((s, si) => (
                              <span key={si} className="px-2 py-0.5 bg-white border border-zinc-200 text-zinc-700 text-xs rounded-md font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {vid.videoId && (
                        <a
                          href={`https://www.youtube.com/watch?v=${vid.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 flex items-center gap-1 self-start sm:self-auto flex-shrink-0"
                        >
                          <span>Watch</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-red-100">
                    <Youtube className="w-7 h-7 text-red-600" />
                  </div>
                  <h4 className="font-bold text-zinc-900 text-base">No YouTube videos synced yet</h4>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-4">
                    Install the T7 Chrome Extension, pair with your T7 ID (<span className="font-mono font-bold text-zinc-800">{userProfile?.t7Id || 'T7-XXXXXX'}</span>), and click "Sync to Dashboard" while watching videos!
                  </p>
                  <button
                    onClick={() => setIsYouTubeModalOpen(true)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
                  >
                    How to Pair Extension
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Career Tips */}
        {activeTab === 'tips' && (
          <div className="space-y-6">
            {/* Quick Wins */}
            {quick_wins.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
                <h2 className="font-bold text-zinc-900 text-xl mb-5 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-amber-500" /> Quick Wins (Do These Today!)
                </h2>
                <div className="space-y-4">
                  {quick_wins.map((win, i) => {
                    const isObject = typeof win === 'object';
                    return (
                      <div key={i} className="flex items-start gap-5 p-5 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">{i + 1}</div>
                        <div>
                          <p className="font-semibold text-zinc-900 text-lg">{isObject ? win.task : win}</p>
                          {isObject && win.time && <p className="text-base text-amber-600">⏱️ {win.time}</p>}
                          {isObject && win.impact && <p className="text-base text-zinc-600">💡 {win.impact}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interview Preparation Guide */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border border-purple-100">
              <h2 className="font-bold text-zinc-900 text-xl mb-5 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-purple-600" /> Interview Preparation Guide
              </h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-white rounded-xl p-5 border border-purple-100">
                  <h3 className="font-bold text-purple-800 mb-4 text-base">📝 Before the Interview</h3>
                  <ul className="space-y-3 text-base text-zinc-700">
                    <li className="flex items-start gap-2"><span className="text-purple-500">•</span> Research the company thoroughly - products, culture, recent news</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500">•</span> Practice explaining your projects in 2-3 minutes</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500">•</span> Prepare 3-4 questions to ask the interviewer</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500">•</span> Review your resume - be ready to discuss everything on it</li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-5 border border-purple-100">
                  <h3 className="font-bold text-purple-800 mb-4 text-base">💬 During the Interview</h3>
                  <ul className="space-y-3 text-base text-zinc-700">
                    <li className="flex items-start gap-2"><span className="text-purple-500">•</span> Use STAR method for behavioral questions</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500">•</span> Think aloud during coding problems</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500">•</span> Ask clarifying questions before solving</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500">•</span> It's okay to say "I don't know, but I would..."</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Common HR Questions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
              <h2 className="font-bold text-zinc-900 text-xl mb-5 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-600" /> Common HR Questions & How to Answer
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <p className="font-semibold text-zinc-900 text-lg mb-2">❓ "Tell me about yourself"</p>
                  <p className="text-base text-blue-700">💡 Use the Present-Past-Future formula: Current situation → Past experiences → Future goals. Keep it under 2 minutes. Focus on professional journey, not personal life.</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <p className="font-semibold text-zinc-900 text-lg mb-2">❓ "Why do you want to work here?"</p>
                  <p className="text-base text-blue-700">💡 Research the company! Mention specific products, values, or initiatives. Connect your skills to their needs. Show genuine enthusiasm.</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <p className="font-semibold text-zinc-900 text-lg mb-2">❓ "What's your biggest weakness?"</p>
                  <p className="text-base text-blue-700">💡 Be genuine but strategic. Pick a real weakness, explain what you're doing to improve it. Never say "I'm a perfectionist" or "I work too hard."</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <p className="font-semibold text-zinc-900 text-lg mb-2">❓ "Where do you see yourself in 5 years?"</p>
                  <p className="text-base text-blue-700">💡 Show ambition but be realistic. Focus on skill growth and contributions. Align your goals with the company's trajectory.</p>
                </div>
              </div>
            </div>

            {resume_tips.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
                <h2 className="font-bold text-zinc-900 text-xl mb-5 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-500" /> Resume Tips
                </h2>
                <ul className="space-y-3">
                  {resume_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-700 text-base">
                      <span className="text-blue-500">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resume Writing Guide (Always Show) */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
              <h2 className="font-bold text-zinc-900 text-xl mb-5 flex items-center gap-2">
                <FileText className="w-6 h-6 text-emerald-500" /> Resume Writing Essentials
              </h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <h3 className="font-bold text-emerald-800 mb-4 text-base">✅ DO's</h3>
                  <ul className="space-y-3 text-base text-zinc-700">
                    <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> Use action verbs: Built, Developed, Implemented, Led</li>
                    <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> Quantify achievements: "Improved load time by 40%"</li>
                    <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> Keep it to 1 page for freshers</li>
                    <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> Add GitHub and LinkedIn links</li>
                    <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> Tailor resume for each job application</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-red-800 mb-4 text-base">❌ DON'Ts</h3>
                  <ul className="space-y-3 text-base text-zinc-700">
                    <li className="flex items-start gap-2"><span className="text-red-500">•</span> Don't include photo or personal details</li>
                    <li className="flex items-start gap-2"><span className="text-red-500">•</span> Avoid generic objectives like "seeking a challenging role"</li>
                    <li className="flex items-start gap-2"><span className="text-red-500">•</span> Don't list every technology - focus on relevant ones</li>
                    <li className="flex items-start gap-2"><span className="text-red-500">•</span> Never lie about skills or experience</li>
                    <li className="flex items-start gap-2"><span className="text-red-500">•</span> Avoid fancy fonts or excessive colors</li>
                  </ul>
                </div>
              </div>
            </div>

            {linkedin_tips.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
                <h2 className="font-bold text-zinc-900 text-xl mb-5 flex items-center gap-2">
                  <Linkedin className="w-6 h-6 text-blue-600" /> LinkedIn Tips
                </h2>
                <ul className="space-y-3">
                  {linkedin_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-700 text-base">
                      <span className="text-blue-600">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* LinkedIn Optimization (Always Show) */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 shadow-lg border border-blue-100">
              <h2 className="font-bold text-zinc-900 text-xl mb-5 flex items-center gap-2">
                <Linkedin className="w-6 h-6 text-blue-700" /> LinkedIn Profile Optimization
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 border border-blue-100">
                  <h3 className="font-bold text-blue-800 mb-3 text-base">📸 Profile Photo</h3>
                  <p className="text-sm text-zinc-600">Professional headshot, plain background, good lighting, smile naturally. Profiles with photos get 21x more views.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-blue-100">
                  <h3 className="font-bold text-blue-800 mb-3 text-base">✍️ Headline</h3>
                  <p className="text-sm text-zinc-600">Don't just put "Student" - add value! Example: "CSE Student | React Developer | Building AI-powered apps"</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-blue-100">
                  <h3 className="font-bold text-blue-800 mb-3 text-base">📝 About Section</h3>
                  <p className="text-sm text-zinc-600">Tell your story in first person. Include skills, achievements, and what you're looking for. Add a call-to-action.</p>
                </div>
              </div>
              <div className="mt-5 bg-white rounded-xl p-5 border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-3 text-base">🚀 Pro Tips to Stand Out</h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-zinc-600">
                  <p>• Post about your projects and learnings weekly</p>
                  <p>• Engage with posts from your target companies</p>
                  <p>• Get recommendations from professors/mentors</p>
                  <p>• Join groups related to your career interest</p>
                  <p>• Use keywords recruiters search for in your profile</p>
                  <p>• Connect with alumni working at dream companies</p>
                </div>
              </div>
            </div>

            {/* Networking Tips */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
              <h2 className="font-bold text-zinc-900 text-xl mb-5 flex items-center gap-2">
                <Globe className="w-6 h-6 text-purple-500" /> Networking & Job Search Strategy
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-5 p-5 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-zinc-900 text-lg">Build in Public</p>
                    <p className="text-base text-zinc-600">Share your learning journey on Twitter/LinkedIn. Tweet about what you're building. People notice consistent effort.</p>
                  </div>
                </div>
                <div className="flex items-start gap-5 p-5 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-zinc-900 text-lg">Cold Email Strategy</p>
                    <p className="text-base text-zinc-600">Research the person, personalize your email, be specific about why you're reaching out, and always provide value first.</p>
                  </div>
                </div>
                <div className="flex items-start gap-5 p-5 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold text-zinc-900 text-lg">Contribute to Open Source</p>
                    <p className="text-base text-zinc-600">Start with "good first issues" on GitHub. It shows collaboration skills and gets you noticed by maintainers (often working at top companies).</p>
                  </div>
                </div>
                <div className="flex items-start gap-5 p-5 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">4</div>
                  <div>
                    <p className="font-semibold text-zinc-900 text-lg">Attend Tech Events</p>
                    <p className="text-base text-zinc-600">Hackathons, meetups, webinars. In-person events are goldmines for networking. Follow up within 24 hours of meeting someone.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mental Health & Motivation */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-amber-100">
              <h2 className="font-bold text-zinc-900 text-xl mb-5 flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-600" /> Stay Motivated During Placements
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-amber-100">
                    <p className="font-medium text-zinc-900 text-base">🎯 Set Small Daily Goals</p>
                    <p className="text-sm text-zinc-600">Solve 3 problems, learn 1 concept, apply to 2 jobs</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-amber-100">
                    <p className="font-medium text-zinc-900 text-base">📊 Track Your Progress</p>
                    <p className="text-sm text-zinc-600">Maintain a spreadsheet of applications and learnings</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-amber-100">
                    <p className="font-medium text-zinc-900 text-base">👥 Find Study Buddies</p>
                    <p className="text-sm text-zinc-600">Prepare with friends, do mock interviews together</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-amber-100">
                    <p className="font-medium text-zinc-900 text-base">😴 Take Care of Health</p>
                    <p className="text-sm text-zinc-600">Sleep 7-8 hours, exercise, take breaks from screens</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-amber-100">
                    <p className="font-medium text-zinc-900 text-base">🚫 Handle Rejections</p>
                    <p className="text-sm text-zinc-600">Every "No" is practice for the right "Yes". Learn & move on.</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-amber-100">
                    <p className="font-medium text-zinc-900 text-base">🏆 Celebrate Small Wins</p>
                    <p className="text-sm text-zinc-600">Completed a project? Solved 100 problems? Celebrate!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Portfolio Generator */}
        {activeTab === 'portfolio' && (
          <div id="portfolioPrintable" className="space-y-6">
            <div className="rounded-2xl bg-white p-4 border border-zinc-200 shadow-sm flex flex-wrap items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Portfolio Dashboard</h2>
                <p className="text-sm text-zinc-500">A quick export of the current learning portfolio view.</p>
              </div>
              <button
                onClick={downloadPortfolio}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Portfolio
              </button>
            </div>
            {/* Learning Portfolio Dashboard */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 shadow-lg border border-blue-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-bold text-zinc-900 text-2xl">Learning Portfolio</h2>
                  <p className="text-zinc-600 text-sm">A career-ready view of your course progress and expertise.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm border border-blue-100">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm">✓</span>
                    <div>
                      <p className="text-xl font-semibold text-emerald-700">{completedPortfolioCourses}</p>
                      <p className="text-xs text-zinc-500">Completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm border border-blue-100">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-sm">⌛</span>
                    <div>
                      <p className="text-xl font-semibold text-amber-600">{inProgressPortfolioCourses}</p>
                      <p className="text-xs text-zinc-500">In Progress</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm border border-blue-100">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-sm">%</span>
                    <div>
                      <p className="text-xl font-semibold text-purple-700">{avgPortfolioProgress}%</p>
                      <p className="text-xs text-zinc-500">Avg Progress</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                <div className="p-3 bg-white rounded-xl border border-blue-100 text-center">
                  <p className="text-xs text-zinc-500">Top Skill</p>
                  <p className="text-sm font-semibold text-zinc-900">{strengthCourses[0] || 'No data yet'}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-100 text-center">
                  <p className="text-xs text-zinc-500">Top In-progress</p>
                  <p className="text-sm font-semibold text-zinc-900">{learningCourses[0] || 'None'}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-100 text-center">
                  <p className="text-xs text-zinc-500">Weekly goal</p>
                  <p className="text-sm font-semibold text-zinc-900">{Math.min(100, avgPortfolioProgress + 15)}%</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-100 text-center">
                  <p className="text-xs text-zinc-500">Next milestone</p>
                  <p className="text-sm font-semibold text-zinc-900">Complete {learningCourses[0] || 'a course'}</p>
                </div>
              </div>
            </div>

            {/* Course Completion Roadmap */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-xl mb-3">Course Completion Roadmap</h3>
              <p className="text-sm text-zinc-500 mb-4">Your prioritized course journey with progress tags and status indicators.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolioCourses.map((course, idx) => (
                  <div key={`${course.name}-${idx}`} className="p-4 rounded-xl border border-zinc-100 bg-zinc-50 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900 text-lg">{course.name}</p>
                        <p className="text-xs text-zinc-500">{course.status}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${course.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {course.progress}%
                      </span>
                    </div>
                    <div className="mt-3 h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${course.progress}%` }}></div>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">{course.hours} hrs tracked</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Progress Detail */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
              <h3 className="font-bold text-zinc-900 text-xl mb-4">Detailed Course Progress</h3>
              <div className="space-y-3">
                {portfolioCourses.length === 0 ? (
                  <p className="text-zinc-500">No course progress found. Complete skill mapping first.</p>
                ) : (
                  portfolioCourses.map((course, idx) => (
                    <div key={`${course.name}-${idx}`} className="p-3 rounded-lg border border-zinc-200">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold text-zinc-800">{course.name}</p>
                        <span className={`text-xs font-semibold ${course.status === 'Completed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {course.status}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden mb-1">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700" style={{ width: `${course.progress}%` }}></div>
                      </div>
                      <p className="text-xs text-zinc-500">{course.progress}% complete • {course.hours}h logged</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Removed template galleries and generator UI to keep portfolio focused on personal course progress */}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          {/* This section intentionally kept minimal: primary navigation at the top and download in portfolio tab */}
        </div>

        {/* Roadmap Inline Modal */}
        {selectedRoadmap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-zinc-700" />
                  <h3 className="font-bold text-zinc-900 text-lg">{selectedRoadmap.name} Roadmap</h3>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`https://roadmap.sh/${selectedRoadmap.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    Visit roadmap.sh <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setSelectedRoadmap(null)}
                    className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* PDF Viewer */}
              {selectedRoadmap.pdf ? (
                <iframe
                  src={selectedRoadmap.pdf}
                  className="flex-1 w-full border-0"
                  title={`${selectedRoadmap.name} Roadmap PDF`}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 gap-5">
                  <p className="text-zinc-500 text-base">PDF not available for this roadmap.</p>
                  <a
                    href={`https://roadmap.sh/${selectedRoadmap.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl"
                  >
                    Open on roadmap.sh <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full-Screen YouTube Learning Tracker & Extension Sync Modal */}
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
      </main>
    </div>
  );
};

export default Results;
