/**
 * Results Page - Robust Detailed Roadmap Display
 * Handles multiple data formats from Gemini AI
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut, ArrowLeft, Check, Calendar, ChevronDown, Download, Target, Sparkles,
  Trophy, Rocket, BookOpen, Zap, Clock, Code, Code2, ExternalLink, CheckCircle,
  GraduationCap, Briefcase, Play, AlertTriangle, Linkedin, FileText,
  Youtube, Globe, TrendingUp, Award, X, Home, Lightbulb, Copy, ArrowRight,
  Upload, RefreshCw
} from 'lucide-react';
import { analyzeResumeGemini } from '../../services/geminiAtsService';
import { getLatestAnalysis, getVideoLearning, getVideoLearningSkills, saveResumeScan, getResumeHistory, fetchQuizActivity, saveSkillCertification, fetchSkillCertifications } from '../../services/apiService';
import { getCourseRecommendations, generateSkillCertificationExam } from '../../services/geminiAgentService';
import { industryRoles } from '../../data/industrySkills';
import YouTubeTrackerModal from './YouTubeTrackerModal';
import T7AiMentor from './T7AiMentor';
import FullJobMarketView from './FullJobMarketView';
import CodeArena from './CodeArena';

const CircularRing = ({ percentage, label, colorClass, size = 100, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} stroke="rgba(0,0,0,0.1)" strokeWidth={strokeWidth} fill="none" className="dark:stroke-white/10" />
          <circle cx={size/2} cy={size/2} r={radius}
            className={colorClass}
            stroke="currentColor"
            strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-zinc-900 dark:text-white">{percentage}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-center max-w-[80px] leading-tight">{label}</span>
    </div>
  );
};


const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [expandedMonth, setExpandedMonth] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [selectedVideoCourse, setSelectedVideoCourse] = useState(null);
  const [viewMode, setViewMode] = useState('skill'); // 'skill' or 'academic'

  // YouTube Tracker & Extension Sync state
  const [videoLearning, setVideoLearning] = useState([]);
  const [ytSkills, setYtSkills] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [copiedT7, setCopiedT7] = useState(false);
  const [copiedRewriteIndex, setCopiedRewriteIndex] = useState(null);
  
  // Quiz Activity tracking
  const [quizActivities, setQuizActivities] = useState([]);

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
    const loadQuizActivity = async () => {
      if (currentUser?.uid) {
        const activities = await fetchQuizActivity(currentUser.uid);
        setQuizActivities(activities || []);
      } else if (userProfile?.t7Id) {
        const activities = await fetchQuizActivity(userProfile.t7Id);
        setQuizActivities(activities || []);
      }
    };
    loadQuizActivity();

    // Sync verified certifications and exam scores from Supabase
    const loadCertifications = async () => {
      const uid = currentUser?.uid || userProfile?.t7Id;
      if (!uid) return;
      try {
        const dbCerts = await fetchSkillCertifications(uid);
        if (dbCerts && typeof dbCerts === 'object' && Object.keys(dbCerts).length > 0) {
          setCertifications(prev => {
            const merged = { ...prev, ...dbCerts };
            try {
              localStorage.setItem(`t7_skill_certifications_${uid}`, JSON.stringify(merged));
            } catch (_) {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('Could not load certifications from Supabase:', err);
      }
    };
    loadCertifications();
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

  // ESC key dismiss for Video Course modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedVideoCourse) {
        setSelectedVideoCourse(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVideoCourse]);

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
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [viewJobsMode, setViewJobsMode] = useState(false);
  const [atsHistory, setAtsHistory] = useState([]);

  // AI Recommended Courses with Pedagogical Rationale
  const [aiCourses, setAiCourses] = useState([]);
  const [loadingAiCourses, setLoadingAiCourses] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState({ 0: true });

  const toggleCourseExpand = (idx) => {
    setExpandedCourses(prev => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const [selectedPlatformSkill, setSelectedPlatformSkill] = useState('');

  // ─── Skill Certification Exams State ─────────────────────────────────────────
  const [certifications, setCertifications] = useState(() => {
    try {
      const uid = currentUser?.uid || 'guest';
      const saved = localStorage.getItem(`t7_skill_certifications_${uid}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [skillExamTiers, setSkillExamTiers] = useState({});
  const [activeExamSkill, setActiveExamSkill] = useState(null);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examLoading, setExamLoading] = useState(false);
  const [examError, setExamError] = useState('');
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentExamIndex, setCurrentExamIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState({});
  const [examTimeLeft, setExamTimeLeft] = useState(720);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScoreResult, setExamScoreResult] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showReviewExplanations, setShowReviewExplanations] = useState(false);

  const OFFICIAL_DOCS = {
    'react native': 'https://reactnative.dev/docs/getting-started',
    'react': 'https://react.dev/learn',
    'kotlin': 'https://kotlinlang.org/docs/home.html',
    'android': 'https://developer.android.com/guide',
    'android sdk': 'https://developer.android.com/guide',
    'firebase': 'https://firebase.google.com/docs/guides',
    'java': 'https://dev.java/learn/',
    'spring boot': 'https://spring.io/guides',
    'spring': 'https://spring.io/guides',
    'python': 'https://docs.python.org/3/tutorial/',
    'docker': 'https://docs.docker.com/get-started/',
    'kubernetes': 'https://kubernetes.io/docs/tutorials/',
    'javascript': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    'typescript': 'https://www.typescriptlang.org/docs/',
    'html': 'https://developer.mozilla.org/en-US/docs/Learn/HTML',
    'css': 'https://developer.mozilla.org/en-US/docs/Learn/CSS',
    'node.js': 'https://nodejs.org/en/learn',
    'nodejs': 'https://nodejs.org/en/learn',
    'sql': 'https://www.w3schools.com/sql/',
    'mongodb': 'https://www.mongodb.com/docs/manual/tutorial/',
    'git': 'https://git-scm.com/doc',
    'system design': 'https://github.com/donnemartin/system-design-primer',
    'dsa': 'https://www.geeksforgeeks.org/data-structures/',
    'data structures': 'https://www.geeksforgeeks.org/data-structures/',
    'c++': 'https://en.cppreference.com/w/',
    'c': 'https://en.cppreference.com/w/c',
    'aws': 'https://aws.amazon.com/getting-started/',
    'gcp': 'https://cloud.google.com/docs',
    'flutter': 'https://docs.flutter.dev/',
    'swift': 'https://developer.apple.com/swift/',
    'vue': 'https://vuejs.org/guide/introduction.html',
    'angular': 'https://angular.dev/',
    'next.js': 'https://nextjs.org/docs',
    'express': 'https://expressjs.com/',
    'tailwind': 'https://tailwindcss.com/docs',
  };

  const getOfficialDocUrl = (skill) => {
    const key = (skill || '').toLowerCase().trim();
    if (OFFICIAL_DOCS[key]) return OFFICIAL_DOCS[key];
    for (const [k, v] of Object.entries(OFFICIAL_DOCS)) {
      if (key.includes(k) || k.includes(key)) return v;
    }
    return `https://devdocs.io/`;
  };

  const getPlatformRecommendation = (skillName) => {
    const s = (skillName || '').toLowerCase();
    if (['react native', 'android', 'kotlin', 'flutter', 'firebase', 'docker', 'kubernetes'].some(k => s.includes(k))) {
      return {
        best: 'official-docs',
        reason: 'Authoritative getting started & API guide',
      };
    }
    if (['dsa', 'data structures', 'algorithms', 'sql', 'system design'].some(k => s.includes(k))) {
      return {
        best: 'geeksforgeeks',
        reason: 'Placement interview questions & notes',
      };
    }
    if (['react', 'javascript', 'python', 'java', 'spring', 'html', 'css', 'node'].some(k => s.includes(k))) {
      return {
        best: 'freecodecamp',
        reason: '100% free full-length masterclass',
      };
    }
    return {
      best: 'github',
      reason: 'Open-source starter projects & cheat sheets',
    };
  };

  const getCuratedCourseForSkill = (skillName) => {
    if (!skillName) return null;
    const clean = typeof skillName === 'string' ? skillName.trim() : (skillName?.name || skillName?.skill || '').trim();
    if (!clean) return null;
    const lower = clean.toLowerCase();

    // 1. Check if AI recommended courses already fetched for student has this skill
    const foundAi = aiCourses.find(c => {
      const cSkill = (c.skill || '').toLowerCase();
      return cSkill === lower || lower.includes(cSkill) || cSkill.includes(lower);
    });
    if (foundAi) {
      return {
        ...foundAi,
        skill: foundAi.skill || clean,
        roadmapUrl: getRoadmapLink(clean),
        docUrl: getOfficialDocUrl(clean)
      };
    }

    // 2. Comprehensive Curated Knowledge Base with exact video channels, concepts & pedagogical reasons
    const curatedCatalog = {
      'kotlin': {
        course_title: 'Kotlin Course for Beginners',
        platform: 'YouTube',
        instructor_channel: 'freeCodeCamp.org',
        duration: '12 hours',
        difficulty_level: 'Beginner',
        direct_url: 'https://www.youtube.com/watch?v=F9UC958504w',
        key_topics: ['Variables and Data Types', 'Control Flow', 'Object-Oriented Programming', 'Null Safety', 'Collections'],
        why_recommended: 'This course provides a comprehensive deep dive into Kotlin syntax and modern development practices. It is highly recommended for its clear pacing and focus on building functional applications from scratch, making it ideal for students preparing for technical interviews.'
      },
      'react native': {
        course_title: 'React Native Crash Course 2025 - Build Mobile Apps',
        platform: 'YouTube',
        instructor_channel: 'freeCodeCamp.org',
        duration: '10 hours',
        difficulty_level: 'Beginner to Intermediate',
        direct_url: 'https://www.youtube.com/watch?v=0-S5a0eXPoc',
        key_topics: ['Core Components & JSX', 'React Navigation 6', 'State Management & Hooks', 'Flexbox & Mobile UI Layouts', 'Native Device APIs & Storage'],
        why_recommended: 'Covers cross-platform iOS and Android mobile development from ground zero with real production architecture, responsive UI components, and state management.'
      },
      'expo': {
        course_title: 'Expo & React Native Crash Course for Beginners',
        platform: 'YouTube',
        instructor_channel: 'Traversy Media',
        duration: '4.5 hours',
        difficulty_level: 'Beginner',
        direct_url: 'https://www.youtube.com/watch?v=gvkqT_Uoahw',
        key_topics: ['Expo Router & File-based Routing', 'EAS Build & Cloud Deployment', 'Device Hardware Permissions', 'Expo Go Testing Workflow'],
        why_recommended: 'The cleanest, fastest way to master mobile development without managing heavy Android Studio or Xcode build configurations.'
      },
      'java': {
        course_title: 'Java Full Course for Beginners',
        platform: 'YouTube',
        instructor_channel: 'freeCodeCamp.org',
        duration: '10 hours',
        difficulty_level: 'Beginner to Intermediate',
        direct_url: 'https://www.youtube.com/watch?v=A74TOX803D0',
        key_topics: ['OOP Principles & Polymorphism', 'Java Collections Framework', 'Generics & Exception Handling', 'Multithreading & Streams API', 'JVM Memory Management'],
        why_recommended: 'An exceptional, highly pedagogical course that clearly connects core syntax with real enterprise OOP design and placement coding assessments.'
      },
      'python': {
        course_title: 'Python for Beginners - Full Course',
        platform: 'YouTube',
        instructor_channel: 'Programming with Mosh',
        duration: '6 hours',
        difficulty_level: 'Beginner',
        direct_url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
        key_topics: ['Python Data Types & Slicing', 'Functions & Modular Architecture', 'Exception Handling & File I/O', 'Object-Oriented Programming', 'Popular Standard Libraries'],
        why_recommended: 'Mosh is renowned for crystal-clear visuals and real-world coding exercises that instill clean coding habits from the very first lesson.'
      },
      'react': {
        course_title: 'React 19 / 18 Full Course - Beginner to Pro',
        platform: 'YouTube',
        instructor_channel: 'freeCodeCamp.org',
        duration: '12 hours',
        difficulty_level: 'Beginner to Intermediate',
        direct_url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
        key_topics: ['Component Architecture & Props', 'useState, useEffect, useMemo & useCallback', 'Custom Hooks & Context API', 'React Router v6', 'Performance & Render Cycles'],
        why_recommended: 'Thoroughly covers the mental model of React and modern hooks, ensuring students can both code dynamic applications and ace technical architecture questions.'
      },
      'typescript': {
        course_title: 'TypeScript Full Course for Beginners',
        platform: 'YouTube',
        instructor_channel: 'Dave Gray',
        duration: '8 hours',
        difficulty_level: 'Beginner to Intermediate',
        direct_url: 'https://www.youtube.com/watch?v=gieEQFIfgYc',
        key_topics: ['Static Typing & Type Inference', 'Interfaces vs Type Aliases', 'Generics & Utility Types', 'Discriminated Unions & Type Guards', 'tsconfig & Modern Tooling'],
        why_recommended: 'Explains strict typing with practical code refactoring, showing how TypeScript eliminates bugs before code ever hits production.'
      },
      'node.js': {
        course_title: 'Node.js and Express.js - Full Course',
        platform: 'YouTube',
        instructor_channel: 'freeCodeCamp.org',
        duration: '8.5 hours',
        difficulty_level: 'Intermediate',
        direct_url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
        key_topics: ['Event Loop & Non-Blocking I/O', 'Express Routing & Middleware Stack', 'RESTful API Architecture', 'JWT Authentication & Security', 'Database Connection & Queries'],
        why_recommended: 'Delivers full clarity on how the Node runtime handles asynchronous traffic, request-response pipelines, and production backend services.'
      },
      'nodejs': {
        course_title: 'Node.js and Express.js - Full Course',
        platform: 'YouTube',
        instructor_channel: 'freeCodeCamp.org',
        duration: '8.5 hours',
        difficulty_level: 'Intermediate',
        direct_url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
        key_topics: ['Event Loop & Non-Blocking I/O', 'Express Routing & Middleware Stack', 'RESTful API Architecture', 'JWT Authentication & Security', 'Database Connection & Queries'],
        why_recommended: 'Delivers full clarity on how the Node runtime handles asynchronous traffic, request-response pipelines, and production backend services.'
      },
      'sql': {
        course_title: 'SQL Tutorial - Full Database Course for Beginners',
        platform: 'YouTube',
        instructor_channel: 'freeCodeCamp.org',
        duration: '4.5 hours',
        difficulty_level: 'Beginner',
        direct_url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
        key_topics: ['Relational Schema & Keys', 'INNER / LEFT / RIGHT Joins', 'GROUP BY & Aggregate Functions', 'Subqueries & Nested Queries', 'Index Optimization Basics'],
        why_recommended: 'Mike Dane breaks down query mechanics visually, preparing students directly for university placement database screening tests.'
      },
      'docker': {
        course_title: 'Docker Tutorial for Beginners',
        platform: 'YouTube',
        instructor_channel: 'TechWorld with Nana',
        duration: '3.5 hours',
        difficulty_level: 'Beginner',
        direct_url: 'https://www.youtube.com/watch?v=3c-iBn73dDE',
        key_topics: ['Containers vs Virtual Machines', 'Writing Dockerfiles', 'Docker Compose Multi-Container Orchestration', 'Image Layers & Volumes', 'Docker Hub & Registries'],
        why_recommended: 'Nana uses top-tier whiteboard diagrams to make container concepts effortless to grasp and immediately applicable to microservices.'
      },
      'git': {
        course_title: 'Git and GitHub for Beginners - Crash Course',
        platform: 'YouTube',
        instructor_channel: 'freeCodeCamp.org',
        duration: '2 hours',
        difficulty_level: 'Beginner',
        direct_url: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
        key_topics: ['Staging, Commits & History', 'Branching & Fast-Forward Merges', 'Resolving Merge Conflicts', 'Pull Requests & Code Reviews', 'Git Rebase & Remote Tracking'],
        why_recommended: 'Explains version control visually and practically, covering the exact collaborative git hygiene expected on day 1 at top tech companies.'
      },
      'redux': {
        course_title: 'Redux Toolkit Tutorial for Beginners',
        platform: 'YouTube',
        instructor_channel: 'Dave Gray',
        duration: '5 hours',
        difficulty_level: 'Intermediate',
        direct_url: 'https://www.youtube.com/watch?v=NqzdVN2tyvQ',
        key_topics: ['Redux Store & Slices', 'useSelector & useDispatch Hooks', 'createAsyncThunk for Async APIs', 'RTK Query Data Fetching', 'Normalized State Structures'],
        why_recommended: 'Eliminates outdated legacy Redux boilerplate by teaching modern Redux Toolkit (RTK) and RTK Query patterns used in current production web apps.'
      },
      'android': {
        course_title: 'Android App Development Course for Beginners with Kotlin',
        platform: 'YouTube',
        instructor_channel: 'freeCodeCamp.org',
        duration: '11 hours',
        difficulty_level: 'Beginner to Intermediate',
        direct_url: 'https://www.youtube.com/watch?v=fis26HvvDII',
        key_topics: ['Android Studio & Emulators', 'Jetpack Compose UI', 'Activities, Fragments & Lifecycle', 'ViewModel & LiveData', 'Networking with Retrofit'],
        why_recommended: 'Modern, project-based guide to building native Android applications with Jetpack Compose and clean architecture.'
      },
      'data structures': {
        course_title: 'Data Structures and Algorithms for Beginners',
        platform: 'YouTube',
        instructor_channel: 'freeCodeCamp.org',
        duration: '8 hours',
        difficulty_level: 'Intermediate',
        direct_url: 'https://www.youtube.com/watch?v=8hly31xKli0',
        key_topics: ['Big-O Asymptotic Complexity', 'Arrays, Linked Lists & Stacks', 'Trees, Heaps & Graphs', 'Sorting & Binary Search', 'Dynamic Programming Fundamentals'],
        why_recommended: 'Taught by experienced technical interviewers with step-by-step memory pointer visualizations and algorithm walkthroughs.'
      },
      'dsa': {
        course_title: 'Data Structures and Algorithms for Beginners',
        platform: 'YouTube',
        instructor_channel: 'freeCodeCamp.org',
        duration: '8 hours',
        difficulty_level: 'Intermediate',
        direct_url: 'https://www.youtube.com/watch?v=8hly31xKli0',
        key_topics: ['Big-O Asymptotic Complexity', 'Arrays, Linked Lists & Stacks', 'Trees, Heaps & Graphs', 'Sorting & Binary Search', 'Dynamic Programming Fundamentals'],
        why_recommended: 'Taught by experienced technical interviewers with step-by-step memory pointer visualizations and algorithm walkthroughs.'
      }
    };

    // Find in curated catalog
    for (const [key, item] of Object.entries(curatedCatalog)) {
      if (lower === key || lower.includes(key) || key.includes(lower)) {
        return {
          skill: clean,
          roadmapUrl: getRoadmapLink(clean),
          docUrl: getOfficialDocUrl(clean),
          ...item
        };
      }
    }

    // 3. Dynamic Smart Fallback for any other skill
    return {
      skill: clean,
      course_title: `${clean} Complete Masterclass & Tutorial 2025`,
      platform: 'YouTube',
      instructor_channel: 'Top Tech Educators & freeCodeCamp',
      duration: '8 hours',
      difficulty_level: 'Beginner to Intermediate',
      direct_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(clean + ' full course masterclass tutorial')}`,
      key_topics: [
        `${clean} Fundamentals & Core Syntax`,
        'Architecture & Best Practices',
        'Hands-on Project Implementation',
        'Common Pitfalls & Debugging',
        'Placement & Interview Preparation'
      ],
      why_recommended: `This curated masterclass provides a complete, structured pathway to mastering ${clean}. It emphasizes practical code implementation, industry standard best practices, and interview-readiness from day one.`,
      roadmapUrl: getRoadmapLink(clean),
      docUrl: getOfficialDocUrl(clean)
    };
  };

  useEffect(() => {
    if (!analysis) return;
    const rawMissing = analysis.missing_skills || analysis.skills_missing || [];
    const missing = rawMissing
      .map(s => (typeof s === 'string' ? s : (s?.skill || s?.name || '')).trim())
      .filter(Boolean);

    if (missing.length === 0) {
      setAiCourses([]);
      return;
    }

    const targetSkills = missing.slice(0, 4);
    const roleName = analysis?.career_role || role?.role_name || '';
    const cacheKey = `t7_courses_eval_v2_${roleName ? roleName.toLowerCase().replace(/\s+/g, '_') : 'custom'}_${targetSkills.slice().sort().join('_').toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAiCourses(parsed);
          return;
        }
      } catch (_) {}
    }

    let isMounted = true;
    const fetchCourses = async () => {
      setLoadingAiCourses(true);
      try {
        const recommendations = await getCourseRecommendations({
          skills: targetSkills,
          targetRole: roleName,
          userId: currentUser?.uid || userProfile?.t7Id,
        });
        if (isMounted && recommendations && recommendations.length > 0) {
          setAiCourses(recommendations);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(recommendations));
          } catch (_) {}
        }
      } catch (err) {
        console.error('Failed to load AI course recommendations:', err);
      } finally {
        if (isMounted) setLoadingAiCourses(false);
      }
    };

    fetchCourses();
    return () => { isMounted = false; };
  }, [
    analysis?.career_role,
    role?.role_name,
    currentUser?.uid,
    userProfile?.t7Id,
    (analysis?.missing_skills || analysis?.skills_missing || []).join(','),
  ]);


  const fetchAtsHistory = async () => {
    if (!currentUser?.uid) return;
    try {
      const history = await getResumeHistory(currentUser.uid, 5);
      setAtsHistory(history || []);
    } catch (e) {
      console.warn("Failed to fetch ATS history:", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'ats') {
      fetchAtsHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    const storageKey = currentUser?.uid ? `t7_ats_analysis_${currentUser.uid}` : 't7_ats_analysis_guest';
    const metaKey = currentUser?.uid ? `t7_resume_meta_${currentUser.uid}` : 't7_resume_meta_guest';

    if (analysis?.ats_analysis && !localAtsAnalysis) {
      setLocalAtsAnalysis(analysis.ats_analysis);
    } else if (!localAtsAnalysis) {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          setLocalAtsAnalysis(JSON.parse(cached));
        } catch (_) {}
      }
    }

    if (analysis?.resume_meta && !localResumeMeta) {
      setLocalResumeMeta(analysis.resume_meta);
    } else if (!localResumeMeta) {
      const cachedMeta = localStorage.getItem(metaKey);
      if (cachedMeta) {
        try {
          setLocalResumeMeta(JSON.parse(cachedMeta));
        } catch (_) {}
      }
    }
  }, [analysis, currentUser?.uid]);

  // 12-minute Countdown Timer Effect for Skill Exam (Must be before any early returns)
  useEffect(() => {
    if (!examModalOpen || examLoading || examSubmitted || examQuestions.length === 0) return;

    if (examTimeLeft <= 0) {
      handleGradeSkillExam();
      return;
    }

    const timer = setInterval(() => {
      setExamTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGradeSkillExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examModalOpen, examLoading, examSubmitted, examQuestions.length, examTimeLeft]);

  const handleStartSkillExam = async (skillName, tier = 'Intermediate') => {
    setActiveExamSkill({ skill: skillName, difficulty: tier });
    setExamModalOpen(true);
    setExamLoading(true);
    setExamError('');
    setExamQuestions([]);
    setCurrentExamIndex(0);
    setExamAnswers({});
    setExamTimeLeft(720); // 12 minutes
    setExamSubmitted(false);
    setExamScoreResult(null);
    setShowSubmitConfirm(false);
    setShowReviewExplanations(false);

    try {
      const examData = await generateSkillCertificationExam({
        skill: skillName,
        difficulty: tier,
        role: role?.role_name || analysis?.career_role || 'Software Engineer',
        userId: currentUser?.uid,
      });

      if (!examData?.questions || examData.questions.length === 0) {
        throw new Error('No exam questions returned from AI. Please try again.');
      }

      setExamQuestions(examData.questions);
    } catch (err) {
      console.error('Skill exam generation error:', err);
      setExamError(err.message || 'Failed to generate skill certification exam. Please retry.');
    } finally {
      setExamLoading(false);
    }
  };

  const handleGradeSkillExam = () => {
    if (!examQuestions || examQuestions.length === 0) return;

    let correctCount = 0;
    const pillarScores = {};

    examQuestions.forEach((q, idx) => {
      const selected = examAnswers[idx];
      const isCorrect = selected !== undefined && Number(selected) === Number(q.correctAnswerIndex);
      if (isCorrect) correctCount++;

      const p = q.pillar || 'General Knowledge';
      if (!pillarScores[p]) pillarScores[p] = { correct: 0, total: 0 };
      pillarScores[p].total++;
      if (isCorrect) pillarScores[p].correct++;
    });

    const scorePercent = Math.round((correctCount / examQuestions.length) * 100);
    const passed = scorePercent >= 80;
    const cleanSkill = activeExamSkill?.skill || 'Skill';
    const credentialId = `T7-${cleanSkill.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = {
      score: scorePercent,
      correctCount,
      totalCount: examQuestions.length,
      passed,
      pillarScores,
      tier: activeExamSkill?.difficulty || 'Intermediate',
      skill: cleanSkill,
      passedAt: new Date().toISOString(),
      credentialId,
    };

    setExamScoreResult(result);
    setExamSubmitted(true);
    setShowSubmitConfirm(false);

    const uid = currentUser?.uid || 'guest';
    const updated = {
      ...certifications,
      [cleanSkill.toLowerCase()]: {
        skill: cleanSkill,
        tier: activeExamSkill?.difficulty || 'Intermediate',
        score: scorePercent,
        passed,
        passedAt: passed ? result.passedAt : null,
        attemptedAt: result.passedAt,
        credentialId: passed ? credentialId : null,
      },
      [cleanSkill]: {
        skill: cleanSkill,
        tier: activeExamSkill?.difficulty || 'Intermediate',
        score: scorePercent,
        passed,
        passedAt: passed ? result.passedAt : null,
        attemptedAt: result.passedAt,
        credentialId: passed ? credentialId : null,
      },
    };
    setCertifications(updated);
    try {
      localStorage.setItem(`t7_skill_certifications_${uid}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save skill certification:', e);
    }

    // Persist verified certification / attempt directly to Supabase
    const targetUserId = currentUser?.uid || userProfile?.t7Id;
    if (targetUserId) {
      saveSkillCertification(targetUserId, {
        skill: cleanSkill,
        tier: activeExamSkill?.difficulty || 'Intermediate',
        score: scorePercent,
        passed,
        credentialId: passed ? credentialId : null,
        pillarScores,
        attemptedAt: result.passedAt,
        passedAt: passed ? result.passedAt : null,
      }).catch(err => console.warn('Supabase certification sync note:', err));
    }
  };

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
  const readiness_score = typeof analysis.readiness_score === 'number'
    ? analysis.readiness_score
    : (typeof analysis.readiness_score === 'object' && analysis.readiness_score !== null
      ? (analysis.readiness_score.overall ?? 0)
      : 0);

  const score_breakdown = typeof analysis.readiness_score === 'object' && analysis.readiness_score !== null
    ? {
      technical_skills: analysis.readiness_score.technical ?? analysis.readiness_score.overall ?? 0,
      resume_quality: analysis.readiness_score.resume ?? analysis.readiness_score.overall ?? 0,
      market_fit: analysis.readiness_score.market_fit ?? analysis.readiness_score.overall ?? 0,
      profile_completeness: analysis.readiness_score.profile_completeness ?? analysis.readiness_score.overall ?? 0,
    }
    : (analysis.score_breakdown || {});

  const honest_assessment = analysis.honest_assessment || '';
  const matched_skills = analysis.matched_skills || analysis.skills_have || [];
  const raw_missing = analysis.missing_skills || analysis.skills_missing || [];
  const missing_skills = raw_missing.map(s => typeof s === 'string' ? s : (s?.skill || s?.name || '')).filter(Boolean);
  const skill_priority_order = analysis.skill_priority_order || missing_skills || [];
  const raw_roadmap = analysis.learning_roadmap || analysis.roadmap || [];
  const learning_roadmap = raw_roadmap.map((p, idx) => ({
    phase: p.phase || `Phase ${idx + 1}`,
    month: p.phase || `Phase ${idx + 1}`,
    title: p.milestone || p.title || p.focus || `Phase ${idx + 1}`,
    focus: p.milestone || p.focus || p.theme || '',
    milestone: p.milestone || '',
    duration: p.duration_weeks ? `${p.duration_weeks} weeks` : (p.duration || '4 weeks'),
    duration_weeks: p.duration_weeks || 4,
    skills_covered: p.skills_covered || p.skills || [],
    skills: p.skills_covered || p.skills || [],
    ...p
  }));
  const quick_wins = analysis.quick_wins || [];
  const resume_tips = analysis.resume_tips || [];
  const linkedin_tips = analysis.linkedin_tips || [];
  const motivation = analysis.motivation || '';
  const final_outcome = analysis.final_outcome || analysis.final_goal || '';

  const ats_analysis = localAtsAnalysis || analysis?.ats_analysis || null;
  const resume_meta = localResumeMeta || analysis?.resume_meta || null;

  const atsScore = ats_analysis
    ? (typeof ats_analysis.overall_readiness === 'number'
        ? ats_analysis.overall_readiness
        : typeof ats_analysis.score === 'number'
          ? ats_analysis.score
          : typeof ats_analysis.score === 'object' && ats_analysis.score !== null
            ? (ats_analysis.score.score ?? ats_analysis.score.overall ?? null)
            : typeof ats_analysis.ats_score === 'number'
              ? ats_analysis.ats_score
              : null)
    : null;


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
      // Direct Gemini Analysis
      const result = await analyzeResumeGemini({
        resumeFile: file,
        targetRole: role?.role_name || null,
        userId: currentUser?.uid,
        studentContext: {
          cgpa: userProfile?.cgpa || '',
          year: userProfile?.passoutYear || '',
          branch: userProfile?.branch || ''
        }
      });
      setLocalAtsAnalysis(result.ats_analysis);
      setLocalResumeMeta(result.resume_meta);

      if (currentUser?.uid) {
        await saveResumeScan(currentUser.uid, result.ats_analysis, analysis?.id, result.resume_meta);
        await fetchAtsHistory();
      }

      const storageKey = currentUser?.uid ? `t7_ats_analysis_${currentUser.uid}` : 't7_ats_analysis_guest';
      const metaKey = currentUser?.uid ? `t7_resume_meta_${currentUser.uid}` : 't7_resume_meta_guest';
      try {
        localStorage.setItem(storageKey, JSON.stringify(result.ats_analysis));
        localStorage.setItem(metaKey, JSON.stringify(result.resume_meta));
      } catch (cacheErr) {}
    } catch (err) {
      console.error('Standalone ATS Error', err);
      setResumeError(`Analysis failed: ${err.message}`);
    } finally {
      setIsParsingResume(false);
      e.target.value = '';
    }
  };



  // Portfolio: Option 1 True Exam Progress
  // Core skills start at 75% ('Self-Reported • Unverified').
  // Gap skills start at 0% ('Not Started • Take Exam').
  // When an exam is taken under 80%, progress displays the actual exam score (e.g. 50%).
  // When an exam is passed (>= 80%), progress advances to 100% ('Certified & Verified').
  const portfolioCourses = [
    ...userSkills.slice(0, 6).map((skill) => {
      const skillName = typeof skill === 'string' ? skill : skill.name || skill;
      const cert = certifications[skillName?.toLowerCase()] || certifications[skillName];
      const isCertified = !!(cert && (cert.score >= 80 || cert.passed));
      const hasAttempted = !!(cert && !isCertified && cert.score !== undefined);
      const targetTier = 'Intermediate';
      const latestTier = cert?.tier || targetTier;
      const latestScore = cert?.score !== undefined ? cert.score : null;

      return {
        name: skillName,
        type: 'core',
        progress: isCertified ? 100 : (hasAttempted ? Math.max(0, cert.score) : 75),
        status: isCertified ? 'Certified & Verified' : (hasAttempted ? `Scored: ${cert.score}% • Retake to Certify` : 'Self-Reported • Unverified'),
        certified: isCertified,
        attempted: hasAttempted,
        targetTier,
        latestTier,
        latestScore,
        verifiedTier: cert?.tier || targetTier,
        verifiedScore: latestScore,
        credentialId: cert?.credentialId || null,
        passedAt: cert?.passedAt || null,
      };
    }),
    ...missing_skills.slice(0, 6).map((skill) => {
      const skillName = typeof skill === 'string' ? skill : skill.name || skill;
      const cert = certifications[skillName?.toLowerCase()] || certifications[skillName];
      const isCertified = !!(cert && (cert.score >= 80 || cert.passed));
      const hasAttempted = !!(cert && !isCertified && cert.score !== undefined);
      const targetTier = 'Beginner';
      const latestTier = cert?.tier || targetTier;
      const latestScore = cert?.score !== undefined ? cert.score : null;

      return {
        name: skillName,
        type: 'gap',
        progress: isCertified ? 100 : (hasAttempted ? Math.max(0, cert.score) : 0),
        status: isCertified ? 'Certified & Verified' : (hasAttempted ? `Scored: ${cert.score}% • Retake to Certify` : 'Not Started'),
        certified: isCertified,
        attempted: hasAttempted,
        targetTier,
        latestTier,
        latestScore,
        verifiedTier: cert?.tier || targetTier,
        verifiedScore: latestScore,
        credentialId: cert?.credentialId || null,
        passedAt: cert?.passedAt || null,
      };
    }),
  ];

  const totalPortfolioCourses = portfolioCourses.length;
  const certifiedPortfolioCourses = portfolioCourses.filter((c) => c.certified).length;
  const completedPortfolioCourses = portfolioCourses.filter((c) => c.progress === 100).length;
  const inProgressPortfolioCourses = portfolioCourses.filter((c) => c.progress < 100).length;
  const avgPortfolioProgress = totalPortfolioCourses > 0
    ? Math.round(portfolioCourses.reduce((sum, c) => sum + c.progress, 0) / totalPortfolioCourses)
    : 0;

  // Show the user's actual skills as strengths, AI gaps as learning targets
  const strengthCourses = userSkills.slice(0, 4).map(s => typeof s === 'string' ? s : s.name || s);
  const uncertifiedMissing = missing_skills
    .map(s => typeof s === 'string' ? s : s.name || s)
    .filter(s => !certifications[s?.toLowerCase()] && !certifications[s]);
  const learningCourses = uncertifiedMissing.length > 0
    ? uncertifiedMissing.slice(0, 4)
    : (missing_skills.length > 0 ? [missing_skills[0]] : ['All Certified! 🎉']);
  const allTargetSkills = [
    ...missing_skills.map(s => ({
      name: typeof s === 'string' ? s : s.name || s,
      type: 'gap',
      label: 'Target Gap Skill',
    })),
    ...userSkills.map(s => ({
      name: typeof s === 'string' ? s : s.name || s,
      type: 'core',
      label: 'Core Strength Skill',
    })),
  ].filter((item, idx, self) =>
    item.name && idx === self.findIndex(t => t.name.toLowerCase() === item.name.toLowerCase())
  );

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

    const studentName = userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Candidate';
    const targetCareerRole = role?.role_name || analysis?.career_role || 'Software Engineering Professional';
    const reportDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const style = `
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background: #f8fafc;
        color: #0f172a;
        margin: 0;
        padding: 24px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print-bar {
        max-width: 1060px;
        margin: 0 auto 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #0f172a;
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 14px;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
      }
      .no-print-bar h3 { margin: 0; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
      .no-print-bar .btn-group { display: flex; align-items: center; gap: 8px; }
      .btn-print {
        background: #2563eb;
        color: #ffffff;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: background 0.2s;
      }
      .btn-print:hover { background: #1d4ed8; }
      .btn-close {
        background: #334155;
        color: #ffffff;
        border: none;
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-close:hover { background: #475569; }

      .print-container { max-width: 1060px; margin: 0 auto; }
      
      .document-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 28px;
        box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
      }

      /* Header */
      .header-section {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        border-bottom: 2px solid #f1f5f9;
        padding-bottom: 20px;
        margin-bottom: 24px;
        gap: 20px;
      }
      .brand-title { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
      .brand-badge {
        background: #4f46e5;
        color: #ffffff;
        font-size: 11px;
        font-weight: 800;
        padding: 4px 8px;
        border-radius: 6px;
        letter-spacing: 0.5px;
      }
      .main-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
      .sub-title { font-size: 13px; color: #64748b; margin: 4px 0 0; }

      .student-badge-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px 18px;
        text-align: right;
        min-width: 240px;
      }
      .student-name { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; }
      .student-role { font-size: 12px; font-weight: 600; color: #4f46e5; margin: 2px 0 0; }
      .report-date { font-size: 11px; color: #94a3b8; margin: 4px 0 0; }

      /* Summary KPI Cards */
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 24px;
      }
      .stat-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 14px;
        text-align: center;
      }
      .stat-card.emerald { background: #f0fdf4; border-color: #bbf7d0; }
      .stat-card.amber { background: #fffbeb; border-color: #fde68a; }
      .stat-card.indigo { background: #eef2ff; border-color: #c7d2fe; }
      .stat-card.purple { background: #faf5ff; border-color: #e9d5ff; }

      .stat-num { font-size: 24px; font-weight: 900; margin: 0; line-height: 1.2; }
      .stat-card.emerald .stat-num { color: #15803d; }
      .stat-card.amber .stat-num { color: #b45309; }
      .stat-card.indigo .stat-num { color: #4338ca; }
      .stat-card.purple .stat-num { color: #7e22ce; }
      .stat-lbl { font-size: 11px; font-weight: 700; color: #64748b; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px; }

      /* Section Heading */
      .section-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }
      .section-heading h3 { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; }
      .section-heading span { font-size: 12px; font-weight: 600; color: #64748b; }

      /* Courses Grid */
      .courses-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
      }
      .course-card {
        border-radius: 14px;
        padding: 14px 16px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 115px;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .course-card.certified {
        border: 1.5px solid #10b981;
        background: #f0fdf4;
      }
      .course-card.attempted {
        border: 1.5px solid #f43f5e;
        background: #fff1f2;
      }
      .course-card.core-unverified {
        border: 1px solid #c7d2fe;
        background: #faf5ff;
      }
      .course-card.gap-unstarted {
        border: 1px solid #e2e8f0;
        background: #ffffff;
      }

      .card-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
      }
      .card-name { font-size: 15px; font-weight: 800; color: #0f172a; margin: 0; }
      .card-badge {
        font-size: 10px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 999px;
        white-space: nowrap;
      }
      .card-badge.verified { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
      .card-badge.attempted { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
      .card-badge.core { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
      .card-badge.gap { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

      .card-status-line {
        font-size: 11px;
        font-weight: 600;
        margin: 0 0 10px;
      }
      .card-status-line.verified { color: #15803d; }
      .card-status-line.attempted { color: #be123c; }
      .card-status-line.core { color: #4f46e5; }
      .card-status-line.gap { color: #64748b; }

      .progress-track {
        height: 6px;
        background: #e2e8f0;
        border-radius: 999px;
        overflow: hidden;
        margin: 8px 0 6px;
      }
      .progress-bar-fill { height: 100%; border-radius: 999px; }
      .progress-bar-fill.certified { background: linear-gradient(90deg, #10b981, #059669); }
      .progress-bar-fill.attempted { background: linear-gradient(90deg, #f43f5e, #fb923c); }
      .progress-bar-fill.core { background: linear-gradient(90deg, #3b82f6, #6366f1); }
      .progress-bar-fill.gap { background: #cbd5e1; }

      .card-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 10.5px;
        font-weight: 600;
        color: #64748b;
        margin-top: 4px;
      }
      .cred-id {
        font-family: ui-monospace, monospace;
        background: #dcfce7;
        color: #166534;
        padding: 1px 5px;
        border-radius: 4px;
        font-size: 9.5px;
        font-weight: 700;
        border: 1px solid #bbf7d0;
      }

      .doc-footer {
        margin-top: 24px;
        padding-top: 14px;
        border-top: 1px solid #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 10.5px;
        color: #94a3b8;
      }

      /* Print CSS Rules */
      @page {
        size: A4 portrait;
        margin: 10mm 12mm;
      }
      @media print {
        body { background: #ffffff !important; padding: 0 !important; }
        .no-print-bar { display: none !important; }
        .document-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
        .course-card { break-inside: avoid !important; page-break-inside: avoid !important; }
        .stat-grid { break-inside: avoid !important; page-break-inside: avoid !important; }
        .header-section { break-inside: avoid !important; page-break-inside: avoid !important; }
      }
    `;

    const courseCardsHtml = portfolioCourses.map((course) => {
      const isCertified = course.certified;
      const isAttempted = course.attempted;
      const isCore = course.type === 'core';

      let cardClass = 'gap-unstarted';
      let badgeClass = 'gap';
      let badgeText = 'TARGET SKILL';
      let statusLine = 'Not Started • Pending Assessment';
      let statusClass = 'gap';
      let fillClass = 'gap';
      let progressText = `${course.progress}% progress`;

      if (isCertified) {
        cardClass = 'certified';
        badgeClass = 'verified';
        badgeText = `✓ PASSED [${course.verifiedTier}]`;
        statusLine = `Passed with ${course.verifiedScore}% • Accredited`;
        statusClass = 'verified';
        fillClass = 'certified';
        progressText = '100% Certified Competency';
      } else if (isAttempted) {
        cardClass = 'attempted';
        badgeClass = 'attempted';
        badgeText = `ATTEMPTED [${course.latestTier}]`;
        statusLine = `Latest: ${course.latestScore}% (Passing Cutoff: 80%)`;
        statusClass = 'attempted';
        fillClass = 'attempted';
        progressText = `Scored: ${course.latestScore}% • Retake to Certify`;
      } else if (isCore) {
        cardClass = 'core-unverified';
        badgeClass = 'core';
        badgeText = 'CORE SKILL';
        statusLine = 'Self-Reported • Unverified';
        statusClass = 'core';
        fillClass = 'core';
        progressText = '75% Self-Reported';
      }

      return `
        <div class="course-card ${cardClass}">
          <div>
            <div class="card-top">
              <h4 class="card-name">${course.name}</h4>
              <span class="card-badge ${badgeClass}">${badgeText}</span>
            </div>
            <p class="card-status-line ${statusClass}">${statusLine}</p>
          </div>
          <div>
            <div class="progress-track">
              <div class="progress-bar-fill ${fillClass}" style="width: ${course.progress}%;"></div>
            </div>
            <div class="card-foot">
              <span>${progressText}</span>
              ${course.credentialId ? `<span class="cred-id">ID: ${course.credentialId}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    const printHtml = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${studentName} — Learning Portfolio Report</title>
          <style>${style}</style>
        </head>
        <body>
          <div class="no-print-bar">
            <h3>🎓 T7 Learning Hub — Skill Portfolio Report</h3>
            <div class="btn-group">
              <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
              <button class="btn-close" onclick="window.close()">✕ Close</button>
            </div>
          </div>

          <div class="print-container">
            <div class="document-card">
              <!-- Header -->
              <div class="header-section">
                <div>
                  <div class="brand-title">
                    <span class="brand-badge">T7 ACCREDITATION</span>
                    <span style="font-size:12px;font-weight:700;color:#64748b;letter-spacing:0.5px;">OFFICIAL SKILL VERIFICATION</span>
                  </div>
                  <h1 class="main-title">Learning Portfolio & Course Mastery</h1>
                  <p class="sub-title">A comprehensive competency audit and verified skill completion roadmap.</p>
                </div>
                <div class="student-badge-card">
                  <p class="student-name">${studentName}</p>
                  <p class="student-role">${targetCareerRole}</p>
                  <p class="report-date">Issued: ${reportDate} • ${certifiedPortfolioCourses} of ${totalPortfolioCourses} Verified</p>
                </div>
              </div>

              <!-- Executive KPIs -->
              <div class="stat-grid">
                <div class="stat-card emerald">
                  <p class="stat-num">${certifiedPortfolioCourses}</p>
                  <p class="stat-lbl">Verified Skills (≥80%)</p>
                </div>
                <div class="stat-card amber">
                  <p class="stat-num">${inProgressPortfolioCourses}</p>
                  <p class="stat-lbl">Skills In-Progress</p>
                </div>
                <div class="stat-card indigo">
                  <p class="stat-num">${avgPortfolioProgress}%</p>
                  <p class="stat-lbl">Average Proficiency</p>
                </div>
                <div class="stat-card purple">
                  <p class="stat-num">${totalPortfolioCourses}</p>
                  <p class="stat-lbl">Tracked Competencies</p>
                </div>
              </div>

              <!-- Skills Matrix -->
              <div class="section-heading">
                <h3>Course & Skill Completion Matrix</h3>
                <span>Passing Cutoff: 80% with Official Credential ID</span>
              </div>
              <div class="courses-grid">
                ${courseCardsHtml}
              </div>

              <!-- Footer -->
              <div class="doc-footer">
                <span>Verified by T7 Learning Hub Assessment Engine</span>
                <span>Security Verification: T7-PORT-${Date.now().toString(36).toUpperCase()}</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </body>
      </html>`;

    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
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
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${viewMode === 'skill'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-zinc-400 hover:text-zinc-600'
                  }`}
              >
                Skill Lab
              </button>
              <button
                onClick={() => navigate('/academic')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${viewMode === 'academic'
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
            {/* Score Gauges (Career Placement Readiness + Resume ATS Score) */}
            <div className="flex-shrink-0 flex items-center gap-6 sm:gap-8 justify-center flex-wrap sm:flex-nowrap">
              {/* Career Placement Readiness Gauge */}
              <div className="flex flex-col items-center">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="60" stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
                    <circle cx="72" cy="72" r="60"
                      stroke={readiness_score >= 70 ? '#10b981' : readiness_score >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="12" fill="none"
                      strokeDasharray={`${2 * Math.PI * 60}`}
                      strokeDashoffset={`${2 * Math.PI * 60 * (1 - readiness_score / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white">{readiness_score}%</span>
                    <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider mt-0.5">Role Ready</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-zinc-200 mt-2 text-center">
                  Career Readiness
                </span>
                <span className="text-[11px] text-zinc-400 text-center">
                  {matched_skills.length} of {matched_skills.length + missing_skills.length} skills
                </span>
              </div>

              {/* Resume ATS Score Gauge (Rendered whenever resume scan data is available) */}
              {atsScore !== null && (
                <div className="flex flex-col items-center pl-6 sm:pl-8 border-l border-zinc-800">
                  <div className="relative w-36 h-36">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="72" cy="72" r="60" stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
                      <circle cx="72" cy="72" r="60"
                        stroke={atsScore >= 70 ? '#10b981' : atsScore >= 50 ? '#3b82f6' : '#ef4444'}
                        strokeWidth="12" fill="none"
                        strokeDasharray={`${2 * Math.PI * 60}`}
                        strokeDashoffset={`${2 * Math.PI * 60 * (1 - atsScore / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-white">{atsScore}%</span>
                      <span className="text-blue-400 text-xs font-bold uppercase tracking-wider mt-0.5">ATS Score</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-zinc-200 mt-2 text-center">
                    Resume ATS Score
                  </span>
                  <span className="text-[11px] text-zinc-400 text-center truncate max-w-[130px]" title={resume_meta?.file_name || 'Resume Scan'}>
                    {resume_meta?.file_name || 'Resume Scan'}
                  </span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    Target Career Role
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words" style={{ color: '#ffffff' }}>
                    {role?.role_name || analysis.career_role || 'Target Role'}
                  </h1>
                </div>
                {resume_meta?.file_name && (
                  <span className="self-start sm:self-auto text-xs bg-zinc-800 text-zinc-200 px-3.5 py-1.5 rounded-full border border-zinc-700 flex items-center gap-1.5 shrink-0 shadow-sm">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold">{resume_meta.file_name}</span>
                  </span>
                )}
              </div>

              {/* 4 Circular Rings - 100% Dynamic, Zero hardcoded values */}
              <div className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-700/40 mb-5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  {ats_analysis ? (
                    <>
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>ATS Resume Metrics ({resume_meta?.file_name || 'Scanned Document'})</span>
                    </>
                  ) : (
                    <>
                      <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Career Readiness Metrics</span>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {ats_analysis ? (
                    <>
                      <CircularRing 
                        percentage={ats_analysis?.ats_parseability ?? 0} 
                        label="ATS Parseability" 
                        colorClass="text-blue-400" 
                        size={84} 
                        strokeWidth={7}
                      />
                      <CircularRing 
                        percentage={ats_analysis?.impact_quantification ?? 0} 
                        label="Impact & Quantification" 
                        colorClass="text-purple-400" 
                        size={84} 
                        strokeWidth={7}
                      />
                      <CircularRing 
                        percentage={ats_analysis?.skill_match ?? 0} 
                        label="Skill Match" 
                        colorClass="text-emerald-400" 
                        size={84} 
                        strokeWidth={7}
                      />
                      <CircularRing 
                        percentage={ats_analysis?.formatting_quality ?? 0} 
                        label="Formatting Quality" 
                        colorClass="text-amber-400" 
                        size={84} 
                        strokeWidth={7}
                      />
                    </>
                  ) : (
                    <>
                      <CircularRing 
                        percentage={score_breakdown?.technical_skills ?? score_breakdown?.technical ?? 0} 
                        label="Technical Skills" 
                        colorClass="text-emerald-400" 
                        size={84} 
                        strokeWidth={7}
                      />
                      <CircularRing 
                        percentage={score_breakdown?.resume_quality ?? score_breakdown?.resume ?? 0} 
                        label="Resume Quality" 
                        colorClass="text-blue-400" 
                        size={84} 
                        strokeWidth={7}
                      />
                      <CircularRing 
                        percentage={score_breakdown?.market_fit ?? 0} 
                        label="Market Fit" 
                        colorClass="text-purple-400" 
                        size={84} 
                        strokeWidth={7}
                      />
                      <CircularRing 
                        percentage={score_breakdown?.profile_completeness ?? 0} 
                        label="Profile Completeness" 
                        colorClass="text-amber-400" 
                        size={84} 
                        strokeWidth={7}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Reality Check & Action Plan Message */}
              {(ats_analysis?.reality_check_message || ats_analysis?.action_plan || ats_analysis?.summary || honest_assessment) && (
                <div className="p-4 bg-zinc-800/80 border border-zinc-700/60 rounded-2xl mb-5 shadow-inner">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 mb-1">
                        {ats_analysis ? 'Resume ATS Review & Reality Check' : 'Career Readiness Assessment'}
                      </p>
                      <p className="text-zinc-200 text-sm leading-relaxed">
                        {ats_analysis?.reality_check_message || ats_analysis?.action_plan || ats_analysis?.summary || honest_assessment}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Badges + Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2.5">
                  <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium flex items-center gap-1.5">
                    ✓ {matched_skills.length} skills matched
                  </span>
                  <span className="px-3.5 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium flex items-center gap-1.5">
                    📚 {missing_skills.length} to learn
                  </span>
                  {atsScore !== null && (
                    <span className="px-3.5 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium flex items-center gap-1.5">
                      📄 {atsScore}% ATS resume score
                    </span>
                  )}
                  <span className="px-3.5 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium flex items-center gap-1.5">
                    📅 {learning_roadmap.length} months plan
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewJobsMode(prev => !prev)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" />
                    {viewJobsMode ? 'Hide Jobs' : 'View Jobs'}
                  </button>
                  <button
                    onClick={() => {
                      fetchAtsHistory();
                      setIsCompareModalOpen(true);
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-zinc-400" />
                    Compare Previous
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Job Market View (Triggered by View Jobs button) */}
        {viewJobsMode && (
          <div className="mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                Live Job Market for {role?.role_name || analysis.career_role || 'Target Role'}
              </h2>
              <button
                onClick={() => setViewJobsMode(false)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FullJobMarketView
              careerInterest={role?.id || 'all'}
              userSkills={matched_skills}
            />
          </div>
        )}

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
                  className={`px-3 py-2 font-bold rounded-xl transition-all flex items-center gap-1.5 text-xs cursor-pointer ${copiedT7
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
              { id: 'code-arena', icon: Code2, label: 'Code Arena' },
              { id: 'tips', icon: Briefcase, label: 'Career Tips' },
              { id: 'skill-exams', icon: Award, label: 'Skill Exams' },
              { id: 'portfolio', icon: Code, label: 'Portfolio' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all whitespace-nowrap flex-1 justify-center ${activeTab === tab.id
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
                        if (!quizActivities || quizActivities.length === 0) return 0;
                        return quizActivities.reduce((acc, curr) => acc + (curr.total_score || 0), 0);
                      })()}
                    </p>
                    <p className="text-[10px] text-zinc-500">Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-600">
                      {(() => {
                        if (!quizActivities || quizActivities.length === 0) return 0;
                        const uniqueDays = new Set(quizActivities.map(a => a.date));
                        return uniqueDays.size;
                      })()}
                    </p>
                    <p className="text-[10px] text-zinc-500">Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-amber-600">
                      {(() => {
                        if (!quizActivities || quizActivities.length === 0) return 0;
                        const dates = [...new Set(quizActivities.map(a => a.date))].sort().reverse();
                        let currentStreak = 0;
                        const today = new Date();
                        const todayStr = today.toISOString().split('T')[0];
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        const yesterdayStr = yesterday.toISOString().split('T')[0];

                        let checkDate = null;
                        if (dates.includes(todayStr)) {
                          checkDate = new Date(todayStr);
                        } else if (dates.includes(yesterdayStr)) {
                          checkDate = new Date(yesterdayStr);
                        }

                        if (!checkDate) return 0;

                        for (const dateStr of dates) {
                          if (dateStr === checkDate.toISOString().split('T')[0]) {
                            currentStreak++;
                            checkDate.setDate(checkDate.getDate() - 1);
                          } else {
                            break;
                          }
                        }
                        return currentStreak;
                      })()}
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
                        const dateStr = currentDate.toISOString().split('T')[0];

                        if (week === 0 && day < startDate.getDay()) {
                          weekDays.push(null);
                          continue;
                        }

                        // Fetch from actual Supabase Quiz activities
                        const activityForDate = quizActivities.find(a => a.date === dateStr);
                        const solved = activityForDate ? (activityForDate.questions_solved || 0) : 0;
                        
                        let level = 0;
                        if (solved > 0 && solved <= 2) level = 1;
                        else if (solved > 2 && solved <= 4) level = 2;
                        else if (solved === 5) level = 3;
                        else if (solved > 5) level = 4;

                        weekDays.push({
                          date: dateStr,
                          solved: solved,
                          level: level,
                          activity: solved > 0 ? 'Coding Practice' : null
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
                <div className={`mt-4 rounded-2xl border p-4 ${getAtsTone(typeof ats_analysis.score === 'object' ? ats_analysis.score?.score : ats_analysis.score).bg} ${getAtsTone(typeof ats_analysis.score === 'object' ? ats_analysis.score?.score : ats_analysis.score).border}`}>
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
                    <div className={`text-3xl font-black ${getAtsTone(typeof ats_analysis.score === 'object' ? ats_analysis.score?.score : ats_analysis.score).text}`}>
                      {typeof ats_analysis.score === 'object' ? (ats_analysis.score?.score ?? 0) : ats_analysis.score}%
                    </div>
                  </div>
                  <p className="text-sm text-zinc-700 mt-3">
                    {typeof ats_analysis.summary === 'object' && ats_analysis.summary !== null ? JSON.stringify(ats_analysis.summary) : String(ats_analysis.summary || '')}
                  </p>
                  {ats_analysis.keyword_gaps?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Top keyword gaps</p>
                      <div className="flex flex-wrap gap-2">
                        {ats_analysis.keyword_gaps.slice(0, 4).map((gap, index) => {
                          const gapText = typeof gap === 'object' && gap !== null ? (gap.keyword || gap.name || gap.skill || JSON.stringify(gap)) : String(gap);
                          return (
                            <span key={index} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 border border-zinc-200">
                              {gapText}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Course Manager Section — AI Pedagogical Recommendations */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-zinc-100">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-zinc-900 text-sm sm:text-base flex items-center gap-1.5">
                      Recommended Courses
                    </h2>
                    <p className="text-[11px] text-zinc-500">
                      Click any skill to expand full pedagogical review & video
                    </p>
                  </div>
                </div>
                {missing_skills.length > 0 && (
                  <button
                    onClick={() => {
                      const targetSkills = missing_skills.slice(0, 4);
                      const roleName = analysis?.career_role || role?.role_name || '';
                      const cacheKey = `t7_courses_eval_v2_${roleName ? roleName.toLowerCase().replace(/\s+/g, '_') : 'custom'}_${targetSkills.slice().sort().join('_').toLowerCase()}`;
                      try { localStorage.removeItem(cacheKey); } catch (_) {}
                      setLoadingAiCourses(true);
                      getCourseRecommendations({
                        skills: targetSkills,
                        targetRole: roleName,
                        userId: currentUser?.uid || userProfile?.t7Id,
                        forceRefresh: true,
                      }).then(res => {
                        if (res?.length) {
                          setAiCourses(res);
                          try { localStorage.setItem(cacheKey, JSON.stringify(res)); } catch (_) {}
                        }
                      }).finally(() => setLoadingAiCourses(false));
                    }}
                    disabled={loadingAiCourses}
                    title="Refresh AI Course Recommendations"
                    className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAiCourses ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {loadingAiCourses && aiCourses.length === 0 ? (
                  <div className="space-y-2.5 py-2">
                    <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/60 flex items-center gap-3 animate-pulse">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-blue-900">Gemini AI is analyzing top courses...</p>
                        <p className="text-[10px] text-blue-700/80">Evaluating pedagogical clarity and syllabus depth for your missing skills.</p>
                      </div>
                    </div>
                    {[1, 2].map(n => (
                      <div key={n} className="p-3 rounded-xl border border-zinc-100 bg-zinc-50 animate-pulse space-y-2">
                        <div className="h-4 bg-zinc-200 rounded w-3/4" />
                        <div className="h-3 bg-zinc-200 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : aiCourses.length > 0 ? (
                  <div className="space-y-2.5">
                    {aiCourses.map((course, idx) => {
                      const isExpanded = !!expandedCourses[idx];
                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border transition-all overflow-hidden ${
                            isExpanded
                              ? 'border-blue-200 bg-white shadow-xs ring-1 ring-blue-100'
                              : 'border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-zinc-300'
                          }`}
                        >
                          {/* Accordion Header Bar — Click anywhere to toggle */}
                          <div
                            onClick={() => toggleCourseExpand(idx)}
                            className="p-3 flex items-center justify-between gap-2.5 cursor-pointer select-none transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="flex-shrink-0 px-2 py-0.5 text-[11px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200/80">
                                {course.skill}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs text-zinc-900 truncate leading-snug">
                                  {course.course_title}
                                </p>
                                <p className="text-[11px] text-zinc-500 truncate">
                                  {course.instructor_channel} {course.duration ? `• ${course.duration}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <div
                                className={`p-1 rounded-md text-zinc-400 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-blue-600 bg-blue-50' : 'hover:text-zinc-600'
                                }`}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          {/* Accordion Dropdown Content */}
                          {isExpanded && (
                            <div className="px-3.5 pb-3.5 pt-2 border-t border-zinc-100 space-y-3 bg-zinc-50/30">
                              {/* Metadata Tags */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-50 text-red-700 border border-red-200/80 flex items-center gap-1">
                                  <Youtube className="w-3 h-3 text-red-600" />
                                  {course.platform || 'YouTube'}
                                </span>
                                {course.duration && (
                                  <span className="text-[10px] font-semibold text-zinc-600 flex items-center gap-1 bg-white border border-zinc-200 px-2 py-0.5 rounded-md">
                                    <Clock className="w-3 h-3 text-zinc-500" /> {course.duration}
                                  </span>
                                )}
                                {course.difficulty_level && (
                                  <span className="text-[10px] font-medium text-zinc-600 bg-white border border-zinc-200 px-2 py-0.5 rounded-md">
                                    {course.difficulty_level}
                                  </span>
                                )}
                              </div>

                              {/* Key Topics */}
                              {Array.isArray(course.key_topics) && course.key_topics.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                    Key Concepts Covered
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {course.key_topics.map((topic, tidx) => (
                                      <span
                                        key={tidx}
                                        className="text-[10px] font-medium px-2 py-0.5 bg-white text-zinc-700 rounded-md border border-zinc-200"
                                      >
                                        {topic}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Pedagogical Explanation Box */}
                              {course.why_recommended && (
                                <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/80">
                                  <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                                    Why this video explains {course.skill} best:
                                  </p>
                                  <p className="text-xs text-amber-950 leading-relaxed font-normal">
                                    {course.why_recommended}
                                  </p>
                                </div>
                              )}

                              {/* Full-Width Direct Watch Button */}
                              <a
                                href={course.direct_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2 px-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer group"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Watch Course on {course.platform || 'YouTube'}</span>
                                <ExternalLink className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : missing_skills.length > 0 ? (
                  <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-center space-y-2">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-wide">
                      Missing: {missing_skills.slice(0, 4).join(', ')}
                    </p>
                    <button
                      onClick={() => {
                        const targetSkills = missing_skills.slice(0, 4);
                        const roleName = analysis?.career_role || role?.role_name || '';
                        setLoadingAiCourses(true);
                        getCourseRecommendations({
                          skills: targetSkills,
                          targetRole: roleName,
                          userId: currentUser?.uid || userProfile?.t7Id,
                        }).then(res => {
                          if (res?.length) setAiCourses(res);
                        }).finally(() => setLoadingAiCourses(false));
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Curate Top Courses</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Trophy className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-xs text-zinc-900">All caught up!</p>
                    <p className="text-[11px] text-zinc-500">You meet all core skill requirements.</p>
                  </div>
                )}

                {/* Additional Resources */}
                {missing_skills.length > 0 && (() => {
                  const activeSkill = selectedPlatformSkill && missing_skills.includes(selectedPlatformSkill)
                    ? selectedPlatformSkill
                    : missing_skills[0];
                  const recommendation = getPlatformRecommendation(activeSkill);

                  const platforms = [
                    {
                      id: 'official-docs',
                      name: 'Official Docs & Guide',
                      bg: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900',
                      badgeBg: 'bg-indigo-600 text-white',
                      url: getOfficialDocUrl(activeSkill),
                      subtitle: 'Official Getting Started & Docs',
                    },
                    {
                      id: 'freecodecamp',
                      name: 'freeCodeCamp Masterclass',
                      bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900',
                      badgeBg: 'bg-emerald-600 text-white',
                      url: `https://www.youtube.com/results?search_query=${encodeURIComponent('freeCodeCamp ' + activeSkill + ' course')}`,
                      subtitle: '100% Free Complete Masterclass',
                    },
                    {
                      id: 'geeksforgeeks',
                      name: 'GeeksforGeeks Practice',
                      bg: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-900',
                      badgeBg: 'bg-green-700 text-white',
                      url: `https://www.geeksforgeeks.org/explore?page=1&sortBy=relevance&q=${encodeURIComponent(activeSkill)}`,
                      subtitle: 'Interview Questions & Practice',
                    },
                    {
                      id: 'github',
                      name: 'GitHub Curated Repos',
                      bg: 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-900',
                      badgeBg: 'bg-zinc-800 text-white',
                      url: `https://github.com/topics/${encodeURIComponent(activeSkill.toLowerCase().replace(/\s+/g, '-'))}`,
                      subtitle: 'Awesome Lists & Starter Code',
                    },
                  ];

                  return (
                    <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                          Search Missing Skill on Platforms
                        </p>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          Target: <strong className="text-zinc-800">{activeSkill}</strong>
                        </span>
                      </div>

                      {/* Missing Skill Selector Pills */}
                      {missing_skills.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] text-zinc-400">Skill:</span>
                          {missing_skills.slice(0, 5).map(sk => {
                            const isSelected = sk === activeSkill;
                            return (
                              <button
                                key={sk}
                                onClick={() => setSelectedPlatformSkill(sk)}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-zinc-900 text-white shadow-xs'
                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                }`}
                              >
                                {sk}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Platform Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {platforms.map(p => {
                          const isBest = recommendation.best === p.id;
                          return (
                            <a
                              key={p.id}
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`relative p-2.5 rounded-xl border transition-all text-left group flex flex-col justify-between ${p.bg} ${
                                isBest ? 'ring-2 ring-emerald-500 shadow-xs' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold">{p.name}</span>
                                {isBest && (
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${p.badgeBg}`}>
                                    Best Pick
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] opacity-80 leading-tight">
                                {isBest ? recommendation.reason : p.subtitle}
                              </p>
                              <div className="mt-1.5 flex items-center justify-between text-[10px] opacity-60 group-hover:opacity-100 transition-opacity">
                                <span className="truncate">Search "{activeSkill}"</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0 group-hover:translate-x-0.5 transition-transform ml-1" />
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Code Arena Tab */}
        {activeTab === 'code-arena' && (
          <CodeArena 
            profile={userProfile} 
            targetRole={role?.role_name || analysis?.career_role}
            matchedSkills={matched_skills}
            missingSkills={missing_skills}
          />
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
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl ${index === 0 ? 'bg-zinc-900' : 'bg-zinc-400'
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
                            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                              <h4 className="font-bold text-zinc-800 text-lg flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-600" /> Skills to Master in this Phase
                              </h4>
                              <span className="text-xs text-zinc-500 font-medium">Select Video, roadmap.sh, or Docs for each skill</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {skills.map((skill, i) => {
                                const cleanSkill = typeof skill === 'string' ? skill : (skill?.name || skill?.skill || '');
                                const roadmapUrl = getRoadmapLink(cleanSkill);
                                const docUrl = getOfficialDocUrl(cleanSkill);
                                const courseDetails = getCuratedCourseForSkill(cleanSkill);

                                return (
                                  <div
                                    key={i}
                                    className="p-3.5 bg-zinc-900 text-white rounded-2xl border border-zinc-800 shadow-sm flex flex-col justify-between hover:border-zinc-700 transition-all"
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-2.5">
                                      <span className="font-bold text-sm text-white flex items-center gap-1.5 truncate">
                                        <Target className="w-4 h-4 text-indigo-400 shrink-0" />
                                        <span className="truncate">{cleanSkill}</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedVideoCourse(courseDetails)}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 hover:bg-emerald-500/30 transition cursor-pointer flex items-center gap-1"
                                        title="View why this course was selected & syllabus details"
                                      >
                                        <Lightbulb className="w-2.5 h-2.5 text-amber-300" />
                                        <span>Curated</span>
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-800/80">
                                      {/* 1. Video Course - Opens Recommended Video Details Modal */}
                                      <button
                                        type="button"
                                        onClick={() => setSelectedVideoCourse(courseDetails)}
                                        className="flex-1 min-w-[70px] py-1.5 px-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                                        title={`View recommended video & details for ${cleanSkill}`}
                                      >
                                        <Play className="w-3 h-3 fill-white" />
                                        <span>Video</span>
                                      </button>

                                      {/* 2. roadmap.sh */}
                                      {roadmapUrl && (
                                        <a
                                          href={roadmapUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-1 min-w-[75px] py-1.5 px-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                                          title={`View interactive roadmap for ${cleanSkill} on roadmap.sh`}
                                        >
                                          <Globe className="w-3 h-3" />
                                          <span>Roadmap</span>
                                        </a>
                                      )}

                                      {/* 3. Official Docs */}
                                      <a
                                        href={docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 min-w-[65px] py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition border border-zinc-700 cursor-pointer"
                                        title={`View official documentation & guides for ${cleanSkill}`}
                                      >
                                        <ExternalLink className="w-3 h-3 text-emerald-400" />
                                        <span>Docs</span>
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-xs text-zinc-500 mt-2.5 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                              Choose <strong>Video</strong> for YouTube masterclass, <strong>Roadmap</strong> for roadmap.sh syllabus tree, or <strong>Docs</strong> for official documentation.
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
                <h3 className="text-2xl font-bold text-white mb-3">🎓 After This Roadmap</h3>
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

        {isCompareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Compare Resume Scans</h2>
                  <p className="text-zinc-400 text-sm mt-0.5">Track your readiness score & ATS metric progression across scans</p>
                </div>
                <button onClick={() => setIsCompareModalOpen(false)} className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {atsHistory.length >= 2 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Previous */}
                  <div className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700/50">
                    <h3 className="text-lg font-semibold text-zinc-300 mb-4">Previous Scan</h3>
                    <div className="flex items-center gap-4 mb-6">
                      <CircularRing percentage={atsHistory[1].overall_readiness || atsHistory[1].ats_score || 0} label="ATS Score" colorClass="text-zinc-400" size={80} strokeWidth={6} />
                      <div>
                        <p className="text-sm font-medium text-white">{atsHistory[1].file_name || 'Previous Resume'}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Scanned: {new Date(atsHistory[1].created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Current */}
                  <div className="bg-zinc-800/80 p-6 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <h3 className="text-lg font-bold text-emerald-400 mb-4">Latest Scan</h3>
                    <div className="flex items-center gap-4 mb-6">
                      <CircularRing percentage={atsHistory[0].overall_readiness || atsHistory[0].ats_score || 0} label="ATS Score" colorClass="text-emerald-500" size={80} strokeWidth={6} />
                      <div>
                        <p className="text-sm font-medium text-white">{atsHistory[0].file_name || 'Latest Resume'}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Scanned: {new Date(atsHistory[0].created_at).toLocaleDateString()}</p>
                        <p className="text-sm font-semibold text-emerald-400 mt-2">
                          {(atsHistory[0].overall_readiness || atsHistory[0].ats_score || 0) >= (atsHistory[1].overall_readiness || atsHistory[1].ats_score || 0) ? '+' : ''}
                          {(atsHistory[0].overall_readiness || atsHistory[0].ats_score || 0) - (atsHistory[1].overall_readiness || atsHistory[1].ats_score || 0)}% Score Progression
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 px-6 bg-zinc-800/40 rounded-2xl border border-zinc-700/50">
                  <RefreshCw className="w-12 h-12 text-zinc-500 mx-auto mb-3 animate-spin-slow" />
                  <h3 className="text-lg font-bold text-white mb-1">Previous Scan Not Found Yet</h3>
                  <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">
                    You currently have {atsHistory.length} scan recorded. Upload an updated resume to unlock automatic side-by-side comparison and progress tracking!
                  </p>
                  <label className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition cursor-pointer inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Updated Resume
                    <input type="file" accept=".pdf" className="hidden" onChange={handleAtsUpload} />
                  </label>
                </div>
              )}
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
                    <div className="flex items-center gap-3 flex-wrap">
                      {resumeError && (
                        <div className="w-full text-xs text-red-600 bg-red-50 py-1.5 px-3 rounded-lg border border-red-200">
                          {resumeError}
                        </div>
                      )}

                      <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2">
                        {isParsingResume ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Re-upload Resume</span>
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

                      <button
                        type="button"
                        onClick={() => {
                          const storageKey = currentUser?.uid ? `t7_ats_analysis_${currentUser.uid}` : 't7_ats_analysis_guest';
                          const metaKey = currentUser?.uid ? `t7_resume_meta_${currentUser.uid}` : 't7_resume_meta_guest';
                          localStorage.removeItem(storageKey);
                          localStorage.removeItem(metaKey);
                          setLocalAtsAnalysis(null);
                          setLocalResumeMeta(null);
                        }}
                        className="cursor-pointer bg-white px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center gap-1.5"
                        title="Clear current resume test and upload fresh"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Clear</span>
                      </button>

                      {/* Compare and View Jobs Buttons */}
                      {atsHistory.length >= 2 && (
                        <button
                          type="button"
                          onClick={() => setIsCompareModalOpen(true)}
                          className="cursor-pointer bg-white px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center gap-1.5"
                          title="Compare with previous ATS scan"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                          <span>Compare</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setViewJobsMode(!viewJobsMode)}
                        className="cursor-pointer bg-zinc-900 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{viewJobsMode ? 'Hide Jobs' : 'View Jobs'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {viewJobsMode ? (
                  <FullJobMarketView 
                    careerInterest="all"
                    experienceLevel={ats_analysis.experience_level || 'all'}
                    userSkills={ats_analysis.soft_skills_detected || []}
                  />
                ) : (
                  <div className="bg-[#09090f] rounded-3xl p-8 border border-zinc-800/50 shadow-2xl relative overflow-hidden mt-6">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                    
                    <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                      {/* Left: Overall Gauge */}
                      <div className="flex flex-col items-center justify-center bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 backdrop-blur-xl shrink-0">
                        <CircularRing percentage={ats_analysis.overall_readiness || 0} label="ATS Resume Score" colorClass="text-emerald-400" size={160} strokeWidth={12} />
                        <div className="mt-6 text-center">
                          <p className="text-sm font-semibold text-zinc-400">Target Role</p>
                          <p className="text-lg font-bold text-white mt-1">{role?.role_name || analysis?.career_role || 'Target Role'}</p>
                        </div>
                      </div>

                      {/* Right Side: Rings and Message */}
                      <div className="flex flex-col gap-8 flex-grow">
                        {/* 4 Rings Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 backdrop-blur-xl flex justify-center">
                            <CircularRing percentage={ats_analysis.ats_parseability || 0} label="ATS Parseability" colorClass="text-blue-400" size={100} />
                          </div>
                          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 backdrop-blur-xl flex justify-center">
                            <CircularRing percentage={ats_analysis.impact_quantification || 0} label="Impact & Quant" colorClass="text-purple-400" size={100} />
                          </div>
                          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 backdrop-blur-xl flex justify-center">
                            <CircularRing percentage={ats_analysis.skill_match || 0} label="Skill Match" colorClass="text-amber-400" size={100} />
                          </div>
                          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 backdrop-blur-xl flex justify-center">
                            <CircularRing percentage={ats_analysis.formatting_quality || 0} label="Format Quality" colorClass="text-rose-400" size={100} />
                          </div>
                        </div>

                        {/* Reality Check Message Box */}
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 rounded-3xl border border-zinc-800/80 shadow-inner relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-500"></div>
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                              <Sparkles className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white mb-3">AI Mentor Reality Check</h3>
                              <div className="text-zinc-300 leading-relaxed text-sm md:text-base space-y-4 font-medium">
                                {(ats_analysis.action_plan || "No action plan available.").split('\n').map((line, i) => (
                                  <p key={i}>{line}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Soft Skills Detected */}
                    {ats_analysis.soft_skills_detected && ats_analysis.soft_skills_detected.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-zinc-800/50">
                        <h4 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Soft Skills & Leadership Detected</h4>
                        <div className="flex flex-wrap gap-2">
                          {ats_analysis.soft_skills_detected.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-zinc-200/80">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                    <Zap className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="font-bold text-zinc-900 text-base sm:text-lg">
                      Quick Wins (Do These Today!)
                    </h2>
                    <p className="text-xs text-zinc-500">
                      High-impact action items tailored to your immediate role gaps.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {quick_wins.map((win, i) => {
                    const isObject = typeof win === 'object' && win !== null;
                    return (
                      <div key={i} className="flex items-start gap-3.5 p-3.5 sm:p-4 bg-amber-50/60 rounded-xl border border-amber-200/60 hover:bg-amber-50/90 transition-colors">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 shadow-sm shadow-amber-500/20">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-zinc-900 text-sm sm:text-base leading-snug">
                            {isObject ? win.task : win}
                          </p>
                          {(isObject && (win.time || win.impact)) && (
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs">
                              {win.time && <span className="text-amber-700 font-medium">⏱️ {win.time}</span>}
                              {win.impact && <span className="text-zinc-600">💡 {win.impact}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interview Preparation Guide */}
            <div className="bg-gradient-to-r from-purple-50/60 to-pink-50/60 rounded-2xl p-5 sm:p-6 shadow-sm border border-purple-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <Briefcase className="w-4 h-4" />
                </span>
                <h2 className="font-bold text-zinc-900 text-base sm:text-lg">
                  Interview Preparation Guide
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-xs">
                  <h3 className="font-bold text-purple-900 mb-2.5 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <span>📝</span> Before the Interview
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-zinc-700 leading-relaxed">
                    <li className="flex items-start gap-2"><span className="text-purple-500 font-bold">•</span> Research the company thoroughly — products, culture, and tech stack</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500 font-bold">•</span> Practice explaining your top projects concisely in 2–3 minutes</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500 font-bold">•</span> Prepare 3–4 thoughtful questions to ask the interviewer</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500 font-bold">•</span> Review your resume thoroughly to justify every technology listed</li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-xs">
                  <h3 className="font-bold text-purple-900 mb-2.5 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <span>💬</span> During the Interview
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-zinc-700 leading-relaxed">
                    <li className="flex items-start gap-2"><span className="text-purple-500 font-bold">•</span> Use the STAR method (Situation, Task, Action, Result) for behavioral questions</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500 font-bold">•</span> Think aloud while solving technical coding challenges</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500 font-bold">•</span> Ask clarifying questions regarding edge cases before writing code</li>
                    <li className="flex items-start gap-2"><span className="text-purple-500 font-bold">•</span> State: "I don't know the exact syntax, but here is how I would approach it..."</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Common HR Questions */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-zinc-200/80">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <h2 className="font-bold text-zinc-900 text-base sm:text-lg">
                  Common HR Questions & How to Answer
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-3.5">
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                  <p className="font-semibold text-zinc-900 text-sm mb-1.5">❓ "Tell me about yourself"</p>
                  <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">💡 Use the Present-Past-Future formula: Current role/skills → Key experiences/projects → Future ambition. Keep it under 2 minutes and focus strictly on professional growth.</p>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                  <p className="font-semibold text-zinc-900 text-sm mb-1.5">❓ "Why do you want to work here?"</p>
                  <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">💡 Research the company! Mention specific products, engineering challenges, or company culture. Connect your skill journey directly to their roadmap.</p>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                  <p className="font-semibold text-zinc-900 text-sm mb-1.5">❓ "What is your biggest weakness?"</p>
                  <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">💡 Be genuine and actionable. Pick a real development area and describe the steps you are actively taking to master it. Avoid clichés like "I'm a perfectionist".</p>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                  <p className="font-semibold text-zinc-900 text-sm mb-1.5">❓ "Where do you see yourself in 5 years?"</p>
                  <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">💡 Emphasize mastery, taking ownership of architecture, and mentoring juniors. Align your technical trajectory with the organization's growth.</p>
                </div>
              </div>
            </div>

            {/* Resume Tips (Dynamic) */}
            {resume_tips.length > 0 && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-zinc-200/80">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </span>
                  <h2 className="font-bold text-zinc-900 text-base sm:text-lg">
                    Targeted Resume Tips
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {resume_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-zinc-700 text-xs sm:text-sm leading-relaxed">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{typeof tip === 'object' && tip !== null ? (tip.tip || tip.text || tip.suggestion || JSON.stringify(tip)) : String(tip)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resume Writing Guide (Always Show) */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-zinc-200/80">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <FileText className="w-4 h-4" />
                </span>
                <h2 className="font-bold text-zinc-900 text-base sm:text-lg">
                  Resume Writing Essentials
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-100">
                  <h3 className="font-bold text-emerald-900 mb-2.5 text-xs sm:text-sm uppercase tracking-wider">✅ DO's</h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-zinc-700 leading-relaxed">
                    <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Start bullet points with strong action verbs (Built, Optimized, Architected)</li>
                    <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Quantify achievements with metrics (e.g. "Reduced API latency by 35%")</li>
                    <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Keep layout strictly to 1 page for freshers and early-career engineers</li>
                    <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Ensure live links to your GitHub repositories and deployed live demos</li>
                    <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold">•</span> Tailor technical keywords to match the exact Job Description requirements</li>
                  </ul>
                </div>
                <div className="bg-red-50/40 rounded-xl p-4 border border-red-100">
                  <h3 className="font-bold text-red-900 mb-2.5 text-xs sm:text-sm uppercase tracking-wider">❌ DON'Ts</h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-zinc-700 leading-relaxed">
                    <li className="flex items-start gap-2"><span className="text-red-500 font-bold">•</span> Do NOT include photos, full residential addresses, or personal trivia</li>
                    <li className="flex items-start gap-2"><span className="text-red-500 font-bold">•</span> Avoid generic objectives like "seeking a challenging role to utilize skills"</li>
                    <li className="flex items-start gap-2"><span className="text-red-500 font-bold">•</span> Avoid listing outdated or irrelevant technologies you cannot explain</li>
                    <li className="flex items-start gap-2"><span className="text-red-500 font-bold">•</span> Never exaggerate or falsely claim proficiency in skills you cannot defend</li>
                    <li className="flex items-start gap-2"><span className="text-red-500 font-bold">•</span> Avoid multi-column creative canvas formats that break ATS parsers</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* LinkedIn Tips (Dynamic) */}
            {linkedin_tips.length > 0 && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-zinc-200/80">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                    <Linkedin className="w-4 h-4" />
                  </span>
                  <h2 className="font-bold text-zinc-900 text-base sm:text-lg">
                    LinkedIn Strategy Tips
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {linkedin_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-zinc-700 text-xs sm:text-sm leading-relaxed">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{typeof tip === 'object' && tip !== null ? (tip.tip || tip.text || tip.suggestion || JSON.stringify(tip)) : String(tip)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* LinkedIn Optimization (Always Show) */}
            <div className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-2xl p-5 sm:p-6 shadow-sm border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <Linkedin className="w-4 h-4" />
                </span>
                <h2 className="font-bold text-zinc-900 text-base sm:text-lg">
                  LinkedIn Profile Optimization
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-3.5">
                <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-xs">
                  <h3 className="font-bold text-blue-900 mb-1.5 text-xs sm:text-sm">📸 Profile Picture</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">Clear headshot, neutral background, good lighting. Profiles with clear photos receive up to 21x more views.</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-xs">
                  <h3 className="font-bold text-blue-900 mb-1.5 text-xs sm:text-sm">✍️ Headline Formula</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">Avoid just "Student". Use: <em>"Software Engineer | React Native & Node.js | Building Scalable Cloud Apps"</em>.</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-xs">
                  <h3 className="font-bold text-blue-900 mb-1.5 text-xs sm:text-sm">📝 About Summary</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">Highlight your primary tech stack, impactful projects, open-source work, and what kind of internships/roles you are seeking.</p>
                </div>
              </div>

              <div className="mt-4 bg-white rounded-xl p-4 border border-blue-100 shadow-xs">
                <h3 className="font-bold text-blue-900 mb-2 text-xs sm:text-sm">🚀 Daily Tips to Stand Out to Recruiters</h3>
                <div className="grid sm:grid-cols-2 gap-2 text-xs sm:text-sm text-zinc-600">
                  <p className="flex items-center gap-1.5"><span className="text-blue-500">•</span> Post weekly about your project progress and learnings</p>
                  <p className="flex items-center gap-1.5"><span className="text-blue-500">•</span> Engage meaningfully on posts by target tech companies</p>
                  <p className="flex items-center gap-1.5"><span className="text-blue-500">•</span> Request recommendations from project leads or mentors</p>
                  <p className="flex items-center gap-1.5"><span className="text-blue-500">•</span> Connect with alumni currently working at your dream firms</p>
                </div>
              </div>
            </div>

            {/* Networking Tips */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-zinc-200/80">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                  <Globe className="w-4 h-4" />
                </span>
                <h2 className="font-bold text-zinc-900 text-base sm:text-lg">
                  Networking & Job Search Strategy
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                <div className="flex items-start gap-3 p-3.5 bg-purple-50/40 rounded-xl border border-purple-100">
                  <div className="w-7 h-7 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                  <div>
                    <p className="font-bold text-zinc-900 text-xs sm:text-sm">Build in Public</p>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mt-0.5">Share code snippets and breakthroughs on LinkedIn/X. Engineering managers look for consistent builders.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-purple-50/40 rounded-xl border border-purple-100">
                  <div className="w-7 h-7 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                  <div>
                    <p className="font-bold text-zinc-900 text-xs sm:text-sm">Personalized Cold Outreach</p>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mt-0.5">Research team leads, reference their recent work, demonstrate genuine interest, and ask for brief advice.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-purple-50/40 rounded-xl border border-purple-100">
                  <div className="w-7 h-7 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                  <div>
                    <p className="font-bold text-zinc-900 text-xs sm:text-sm">Open Source Contributions</p>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mt-0.5">Resolve "good first issues" in active repositories. Demonstrates clean Git habits and real code reviews.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-purple-50/40 rounded-xl border border-purple-100">
                  <div className="w-7 h-7 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0">4</div>
                  <div>
                    <p className="font-bold text-zinc-900 text-xs sm:text-sm">Attend Hackathons & Meetups</p>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mt-0.5">Participate in dev events and hackathons. Always send a follow-up connection note within 24 hours.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mental Health & Motivation */}
            <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-2xl p-5 sm:p-6 shadow-sm border border-amber-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <Award className="w-4 h-4" />
                </span>
                <h2 className="font-bold text-zinc-900 text-base sm:text-lg">
                  Placement Motivation & Mental Health
                </h2>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3.5 border border-amber-100 shadow-xs">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">🎯 Small Daily Goals</p>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">Solve 2 challenges, master 1 concept, apply to 2 curated roles every day.</p>
                </div>
                <div className="bg-white rounded-xl p-3.5 border border-amber-100 shadow-xs">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">📊 Track Growth, Not Rejection</p>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">Every rejection sharpens your interview skills for the company that is the right fit.</p>
                </div>
                <div className="bg-white rounded-xl p-3.5 border border-amber-100 shadow-xs">
                  <p className="font-bold text-zinc-900 text-xs sm:text-sm">🏆 Celebrate Consistency</p>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">Consistency beats intensity. Keep your daily streak active and progress will compound.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Skill Certification Exams */}
        {activeTab === 'skill-exams' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-indigo-200 mb-2 border border-white/10">
                    <Award className="w-3.5 h-3.5 text-amber-300" />
                    Official Skill Certification Engine
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Skill Certification Exams</h2>
                  <p className="text-zinc-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                    Test your mastery with 10 dynamic scenario questions across 5 core pillars. Passing with ≥ 70% earns an accredited verification badge that automatically syncs to your Learning Portfolio.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 text-center">
                    <p className="text-2xl font-black text-amber-300">
                      {portfolioCourses.filter(c => c.certified).length}
                    </p>
                    <p className="text-[11px] text-zinc-300 font-medium">Verified Skills</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 text-center">
                    <p className="text-2xl font-black text-emerald-300">70%</p>
                    <p className="text-[11px] text-zinc-300 font-medium">Passing Cutoff</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 text-center">
                    <p className="text-2xl font-black text-cyan-300">10</p>
                    <p className="text-[11px] text-zinc-300 font-medium">Dynamic Qs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Exam Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTargetSkills.map((item, idx) => {
                const cleanName = item.name;
                const cert = certifications[cleanName.toLowerCase()] || certifications[cleanName];
                const isVerified = cert && cert.score >= 70;
                const currentTier = skillExamTiers[cleanName] || cert?.tier || 'Intermediate';

                return (
                  <div
                    key={`${cleanName}-${idx}`}
                    className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                      isVerified
                        ? 'bg-gradient-to-b from-emerald-50/50 to-white border-emerald-200 shadow-sm'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.type === 'gap' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.label}
                        </span>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Verified ({cert.score}%)
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-zinc-400">
                            Not Certified
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-zinc-900 mb-1">{cleanName}</h3>

                      {isVerified ? (
                        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 mb-4 text-xs">
                          <div className="flex items-center justify-between text-emerald-900 font-semibold mb-1">
                            <span>Tier: {cert.tier}</span>
                            <span>Score: {cert.score}%</span>
                          </div>
                          <p className="text-[11px] text-emerald-700 font-mono">Credential ID: {cert.credentialId}</p>
                          <p className="text-[11px] text-emerald-600 mt-1">✓ Synced to Portfolio & PDF Export</p>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 mb-4">
                          Demonstrate your proficiency in {cleanName} across 5 core pillars to unlock 100% completion in your Portfolio.
                        </p>
                      )}

                      {/* Difficulty Tier Selector */}
                      <div className="mb-4">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                          Select Difficulty Tier
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 rounded-xl">
                          {['Beginner', 'Intermediate', 'Advanced'].map(tier => {
                            const isSelected = currentTier === tier;
                            return (
                              <button
                                key={tier}
                                type="button"
                                onClick={() => setSkillExamTiers({ ...skillExamTiers, [cleanName]: tier })}
                                className={`text-xs py-1.5 font-bold rounded-lg transition-all text-center cursor-pointer ${
                                  isSelected
                                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                                    : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                              >
                                {tier}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1.5 px-0.5">
                          {currentTier === 'Beginner' && '🟢 Foundations, core syntax, control flow'}
                          {currentTier === 'Intermediate' && '🟡 Job-ready patterns, collections, error handling'}
                          {currentTier === 'Advanced' && '🔴 Concurrency, performance, internals & architecture'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartSkillExam(cleanName, currentTier)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                        isVerified
                          ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-900/10'
                      }`}
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      {isVerified ? `Retake Exam (${currentTier})` : `Start 10-Question Exam`}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
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
                <div className="flex gap-3 flex-wrap">
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm border border-emerald-100">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">✓</span>
                    <div>
                      <p className="text-xl font-bold text-emerald-700">{certifiedPortfolioCourses}</p>
                      <p className="text-xs text-zinc-500 font-medium">Certified & Verified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm border border-amber-100">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-sm font-bold">⌛</span>
                    <div>
                      <p className="text-xl font-bold text-amber-600">{inProgressPortfolioCourses}</p>
                      <p className="text-xs text-zinc-500 font-medium">In Progress / Unverified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm border border-purple-100">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-sm font-bold">%</span>
                    <div>
                      <p className="text-xl font-bold text-purple-700">{avgPortfolioProgress}%</p>
                      <p className="text-xs text-zinc-500 font-medium">Avg Progress</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                <div className="p-3 bg-white rounded-xl border border-blue-100 text-center">
                  <p className="text-xs text-zinc-500">Top Verified Skill</p>
                  <p className="text-sm font-bold text-emerald-700 truncate">{portfolioCourses.find(c => c.certified)?.name || 'None Yet'}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-100 text-center">
                  <p className="text-xs text-zinc-500">Next Target Skill</p>
                  <p className="text-sm font-semibold text-zinc-900 truncate">{portfolioCourses.find(c => !c.certified)?.name || 'All Certified! 🎉'}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-100 text-center">
                  <p className="text-xs text-zinc-500">Weekly Goal</p>
                  <p className="text-sm font-semibold text-zinc-900">{Math.min(100, avgPortfolioProgress + 15)}%</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-blue-100 text-center">
                  <p className="text-xs text-zinc-500">Next Milestone</p>
                  <p className="text-sm font-semibold text-zinc-900 truncate">Verify {portfolioCourses.find(c => !c.certified)?.name || 'New Skills'}</p>
                </div>
              </div>
            </div>

            {/* Course Completion Roadmap */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-zinc-100">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-zinc-900 text-xl">Course Completion Roadmap</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">Take 10-Question Skill Certification Exams to promote skills from In Progress to 100% Verified.</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full">
                  {certifiedPortfolioCourses} of {totalPortfolioCourses} Verified
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolioCourses.map((course, idx) => (
                  <div key={`${course.name}-${idx}`} className="p-5 rounded-2xl border border-zinc-200/80 bg-white hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-zinc-900 text-base">{course.name}</p>
                            {course.certified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Award className="w-3 h-3 text-emerald-600" />
                                Passed: {course.verifiedScore}% • {course.verifiedTier} Tier
                              </span>
                            ) : course.attempted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <RefreshCw className="w-3 h-3 text-rose-600" />
                                Latest: {course.latestScore}% • {course.latestTier} Tier
                              </span>
                            ) : null}
                          </div>
                          <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            course.certified
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : course.attempted
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : course.type === 'core'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          }`}>
                            {course.certified
                              ? `Passed ${course.verifiedTier} Tier • Score: ${course.verifiedScore}%`
                              : course.attempted
                              ? `Attempted ${course.latestTier} Tier • Score: ${course.latestScore}% (Needs ≥80%)`
                              : course.type === 'core'
                              ? 'Self-Reported • Unverified'
                              : 'Not Started'}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          course.certified
                            ? 'bg-emerald-100 text-emerald-800'
                            : course.attempted
                            ? 'bg-rose-100 text-rose-800'
                            : course.type === 'core'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {course.progress}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3.5 h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            course.certified
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : course.attempted
                              ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                              : course.type === 'core'
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                              : 'bg-zinc-300'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-500">
                        <span className="font-medium text-zinc-500">
                          {course.certified ? 'Verified via Skill Exam' : course.type === 'core' ? 'Core Profile Skill' : 'Target Assessment'}
                        </span>
                        {course.credentialId && (
                          <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">ID: {course.credentialId}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Button: Verify or Retake Exam */}
                    <div className="mt-4 pt-3 border-t border-zinc-100">
                      {course.certified ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                            ✓ {course.verifiedTier} Tier Active
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartSkillExam(course.name, course.verifiedTier === 'Beginner' ? 'Intermediate' : 'Advanced')}
                            className="text-[11px] font-bold text-zinc-600 hover:text-indigo-600 transition cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Upgrade to {course.verifiedTier === 'Beginner' ? 'Intermediate' : 'Advanced'} Tier
                          </button>
                        </div>
                      ) : course.attempted ? (
                        <button
                          type="button"
                          onClick={() => handleStartSkillExam(course.name, course.latestTier || 'Beginner')}
                          className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Retake {course.latestTier} Tier Exam (Latest: {course.latestScore}%) →
                        </button>
                      ) : course.type === 'core' ? (
                        <button
                          type="button"
                          onClick={() => handleStartSkillExam(course.name, course.targetTier)}
                          className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Award className="w-3.5 h-3.5" />
                          Verify Skill with Exam →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartSkillExam(course.name, course.targetTier)}
                          className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          Take Exam to Certify →
                        </button>
                      )}
                    </div>
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
                    <div key={`${course.name}-${idx}`} className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-white transition-all flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-zinc-900 text-sm">{course.name}</p>
                            {course.certified ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                ✓ Passed {course.verifiedTier} Tier ({course.verifiedScore}%)
                              </span>
                            ) : course.attempted ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                Latest: {course.latestScore}% ({course.latestTier} Tier)
                              </span>
                            ) : null}
                          </div>
                          <span className={`text-xs font-bold ${
                            course.certified
                              ? 'text-emerald-700'
                              : course.attempted
                              ? 'text-rose-700'
                              : course.type === 'core'
                              ? 'text-indigo-700'
                              : 'text-zinc-500'
                          }`}>
                            {course.certified
                              ? `Passed: ${course.verifiedScore}%`
                              : course.attempted
                              ? `Scored: ${course.latestScore}% (Needs ≥80%)`
                              : course.status}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-200 overflow-hidden mb-1">
                          <div
                            className={`h-full transition-all duration-500 ${
                              course.certified
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                                : course.attempted
                                ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                                : course.type === 'core'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                : 'bg-zinc-300'
                            }`}
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-zinc-500">
                          {course.certified ? (
                            <span className="text-emerald-700 font-medium">
                              Passed at {course.verifiedTier} Tier with {course.verifiedScore}% • 100% Verified {course.credentialId ? `• ID: ${course.credentialId}` : ''}
                            </span>
                          ) : course.attempted ? (
                            <span className="text-rose-600 font-medium">
                              Latest Exam: Scored {course.latestScore}% on {course.latestTier} Tier • {course.progress}% progress (80% required to certify)
                            </span>
                          ) : (
                            <span>
                              {course.progress}% progress • Complete certification exam to verify (80% passing cutoff)
                            </span>
                          )}
                        </p>
                      </div>

                      {course.certified ? (
                        <button
                          type="button"
                          onClick={() => handleStartSkillExam(course.name, course.verifiedTier === 'Beginner' ? 'Intermediate' : 'Advanced')}
                          className="shrink-0 px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                          Upgrade Tier
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartSkillExam(course.name, course.attempted ? (course.latestTier || 'Beginner') : course.targetTier)}
                          className="shrink-0 px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-800 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Award className="w-3.5 h-3.5 text-indigo-600" />
                          {course.attempted ? 'Retake Exam' : 'Take Exam'}
                        </button>
                      )}
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

        {/* Skill Certification Exam Modal */}
        {examModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4">
            <div className="skill-exam-modal bg-white text-zinc-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-zinc-200 animate-in fade-in zoom-in-95 duration-200" style={{ color: '#09090b' }}>
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/80 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-base sm:text-lg flex items-center gap-2" style={{ color: '#09090b' }}>
                      {activeExamSkill?.skill} Skill Certification
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200" style={{ color: '#4338ca' }}>
                        {activeExamSkill?.difficulty} Tier
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500" style={{ color: '#52525b' }}>Official 10-Question 5-Pillar Assessment • Passing cutoff: 80%</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Timer Pill */}
                  {!examLoading && !examSubmitted && examQuestions.length > 0 && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-xs ${
                      examTimeLeft < 120 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-zinc-200/70 text-zinc-800'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{Math.floor(examTimeLeft / 60)}:{(examTimeLeft % 60).toString().padStart(2, '0')}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!examSubmitted && examQuestions.length > 0) {
                        if (window.confirm('Are you sure you want to exit the exam? Your current progress will be lost.')) {
                          setExamModalOpen(false);
                        }
                      } else {
                        setExamModalOpen(false);
                      }
                    }}
                    className="p-2 rounded-xl hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6" style={{ color: '#09090b' }}>
                {/* 1. Loading State */}
                {examLoading && (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-zinc-900" style={{ color: '#09090b' }}>Generating AI Certification Exam</h4>
                      <p className="text-sm text-zinc-500 max-w-md mt-1" style={{ color: '#52525b' }}>
                        Gemini is crafting 10 real-world scenario questions for <strong style={{ color: '#09090b' }}>{activeExamSkill?.skill}</strong> across 5 core pillars ({activeExamSkill?.difficulty} level)...
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Calibrating dynamic entropy & test cases
                    </div>
                  </div>
                )}

                {/* 2. Error State */}
                {!examLoading && examError && (
                  <div className="p-6 text-center space-y-4 bg-red-50 rounded-2xl border border-red-200">
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
                    <div>
                      <h4 className="text-base font-bold text-red-900">Exam Generation Failed</h4>
                      <p className="text-xs text-red-600 mt-1 max-w-md mx-auto">{examError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartSkillExam(activeExamSkill?.skill, activeExamSkill?.difficulty)}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                    >
                      Retry Generation
                    </button>
                  </div>
                )}

                {/* 3. Active Exam View */}
                {!examLoading && !examError && !examSubmitted && examQuestions.length > 0 && (
                  <div className="space-y-5">
                    {/* Progress Bar & Pillar Indicator */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1.5 font-bold" style={{ color: '#4338ca' }}>
                          🏛️ Pillar: {examQuestions[currentExamIndex]?.pillar || 'Core Concepts'}
                        </span>
                        <span className="text-zinc-500" style={{ color: '#52525b' }}>
                          Question <strong className="text-zinc-900" style={{ color: '#09090b' }}>{currentExamIndex + 1}</strong> of {examQuestions.length}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                          style={{ width: `${((currentExamIndex + 1) / examQuestions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Question Card */}
                    <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200" style={{ color: '#09090b' }}>
                      <h4 className="text-base font-bold text-zinc-900 leading-snug" style={{ color: '#09090b' }}>
                        {examQuestions[currentExamIndex]?.question}
                      </h4>

                      {examQuestions[currentExamIndex]?.codeSnippet && (
                        <pre className="bg-zinc-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto my-3.5 border border-zinc-800 leading-relaxed">
                          <code>{examQuestions[currentExamIndex].codeSnippet}</code>
                        </pre>
                      )}

                      {/* Options */}
                      <div className="space-y-2.5 mt-4">
                        {examQuestions[currentExamIndex]?.options?.map((opt, optIdx) => {
                          const isSelected = examAnswers[currentExamIndex] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => setExamAnswers({ ...examAnswers, [currentExamIndex]: optIdx })}
                              className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-xs ring-1 ring-indigo-500'
                                  : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900'
                              }`}
                            >
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-700'
                              }`} style={{ color: isSelected ? '#ffffff' : '#3f3f46' }}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1 pt-0.5 leading-relaxed font-medium" style={{ color: isSelected ? '#1e1b4b' : '#18181b' }}>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Question Navigation Strip */}
                    <div className="pt-2 border-t border-zinc-100">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-2" style={{ color: '#52525b' }}>
                        <span style={{ color: '#52525b' }}>Jump to question:</span>
                        <span style={{ color: '#52525b' }}>{Object.keys(examAnswers).length} of {examQuestions.length} answered</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {examQuestions.map((_, qIdx) => {
                          const isAnswered = examAnswers[qIdx] !== undefined;
                          const isCurrent = currentExamIndex === qIdx;
                          return (
                            <button
                              key={qIdx}
                              type="button"
                              onClick={() => setCurrentExamIndex(qIdx)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isCurrent
                                  ? 'ring-2 ring-indigo-600 bg-indigo-600 text-white shadow'
                                  : isAnswered
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                            >
                              {qIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Exam Result Scorecard */}
                {!examLoading && examSubmitted && examScoreResult && (
                  <div className="space-y-6">
                    {/* Header Verdict Card */}
                    <div className={`p-6 rounded-2xl border text-center space-y-3 ${
                      examScoreResult.passed
                        ? 'bg-gradient-to-b from-emerald-50 to-white border-emerald-200'
                        : 'bg-gradient-to-b from-amber-50 to-white border-amber-200'
                    }`}>
                      <div className="inline-flex p-3 rounded-full shadow-inner mx-auto">
                        {examScoreResult.passed ? (
                          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl font-black shadow-sm">
                            ✓
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-black shadow-sm">
                            ⌛
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-2xl font-black text-zinc-900" style={{ color: '#09090b' }}>
                          {examScoreResult.passed ? '🎉 Skill Certified & Verified!' : 'Needs Practice'}
                        </h4>
                        <p className="text-sm font-semibold text-zinc-700 mt-1">
                          You scored <span className={examScoreResult.passed ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>{examScoreResult.score}%</span> ({examScoreResult.correctCount} / {examScoreResult.totalCount} correct)
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5" style={{ color: '#52525b' }}>
                          {examScoreResult.passed
                            ? `Accredited ${examScoreResult.tier} competency verified for ${examScoreResult.skill}. Automatically updated in your Learning Portfolio!`
                            : `80% required to pass. You were close! Review your pillar breakdown below and re-test.`}
                        </p>
                      </div>

                      {examScoreResult.passed && (
                        <div className="inline-block px-4 py-2 bg-emerald-100/70 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800">
                          Official Credential ID: <strong>{examScoreResult.credentialId}</strong>
                        </div>
                      )}
                    </div>

                    {/* Pillar Diagnostic Breakdown */}
                    <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200" style={{ color: '#09090b' }}>
                      <h5 className="font-bold text-zinc-900 text-sm mb-3" style={{ color: '#09090b' }}>5-Pillar Competency Diagnostic</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(examScoreResult.pillarScores || {}).map(([pillarName, stat]) => {
                          const pPct = Math.round((stat.correct / stat.total) * 100);
                          const pPassed = pPct >= 50;
                          return (
                            <div key={pillarName} className="p-3 bg-white rounded-xl border border-zinc-200">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-semibold text-zinc-800" style={{ color: '#18181b' }}>{pillarName}</span>
                                <span className={`font-bold ${pPassed ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {stat.correct} / {stat.total} ({pPct}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${pPassed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${pPct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Review Answers Toggle */}
                    <div className="border border-zinc-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowReviewExplanations(!showReviewExplanations)}
                        className="w-full p-4 bg-zinc-50 hover:bg-zinc-100 font-bold text-xs sm:text-sm text-zinc-800 flex items-center justify-between transition cursor-pointer"
                        style={{ color: '#18181b' }}
                      >
                        <span className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          {showReviewExplanations ? 'Hide Question Answers & Explanations' : 'Review All 10 Questions & Explanations'}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showReviewExplanations ? 'rotate-180' : ''}`} />
                      </button>

                      {showReviewExplanations && (
                        <div className="p-4 space-y-4 bg-white max-h-96 overflow-y-auto divide-y divide-zinc-100">
                          {examQuestions.map((q, idx) => {
                            const userAns = examAnswers[idx];
                            const isCorrect = userAns === q.correctAnswerIndex;
                            return (
                              <div key={idx} className="pt-4 first:pt-0 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs font-bold text-zinc-500" style={{ color: '#71717a' }}>Q{idx + 1}. {q.pillar}</span>
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-zinc-900" style={{ color: '#09090b' }}>{q.question}</p>
                                {q.codeSnippet && (
                                  <pre className="bg-zinc-900 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                    <code>{q.codeSnippet}</code>
                                  </pre>
                                )}
                                <div className="space-y-1 text-xs">
                                  {q.options.map((opt, oIdx) => {
                                    const isUserChoice = userAns === oIdx;
                                    const isRightChoice = q.correctAnswerIndex === oIdx;
                                    return (
                                      <div
                                        key={oIdx}
                                        className={`p-2 rounded-lg flex items-center justify-between ${
                                          isRightChoice
                                            ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200'
                                            : isUserChoice
                                            ? 'bg-red-50 text-red-900 font-semibold border border-red-200'
                                            : 'text-zinc-600'
                                        }`}
                                      >
                                        <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                        {isRightChoice && <span className="text-[10px] text-emerald-700 font-bold">✓ Correct Answer</span>}
                                        {isUserChoice && !isRightChoice && <span className="text-[10px] text-red-700 font-bold">Your Choice</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                                <p className="text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 leading-relaxed">
                                  💡 <strong>Rationale:</strong> {q.explanation}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50/80 flex-shrink-0">
                {!examLoading && !examError && !examSubmitted && examQuestions.length > 0 ? (
                  <>
                    <button
                      type="button"
                      disabled={currentExamIndex === 0}
                      onClick={() => setCurrentExamIndex(prev => Math.max(0, prev - 1))}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-900 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      ← Previous
                    </button>

                    <div className="flex items-center gap-2">
                      {currentExamIndex < examQuestions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentExamIndex(prev => prev + 1)}
                          className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          Next →
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => {
                          const answeredCount = Object.keys(examAnswers).length;
                          if (answeredCount < examQuestions.length) {
                            setShowSubmitConfirm(true);
                          } else {
                            handleGradeSkillExam();
                          }
                        }}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Submit Exam
                      </button>
                    </div>
                  </>
                ) : examSubmitted ? (
                  <div className="flex items-center justify-end gap-3 w-full">
                    {examScoreResult?.passed && (
                      <button
                        type="button"
                        onClick={() => {
                          setExamModalOpen(false);
                          setActiveTab('portfolio');
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                      >
                        <Award className="w-4 h-4" />
                        View in Portfolio
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        handleStartSkillExam(activeExamSkill?.skill, activeExamSkill?.difficulty);
                      }}
                      className="px-4 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Retake Exam
                    </button>
                    <button
                      type="button"
                      onClick={() => setExamModalOpen(false)}
                      className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                ) : null}
              </div>

            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150" style={{ zIndex: 9999 }}>
            <div className="skill-exam-modal bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full border border-zinc-200 space-y-4" style={{ color: '#09090b' }}>
              <div className="flex items-center gap-3 text-amber-600">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 text-amber-600" />
                <h4 className="font-bold text-zinc-900 text-base" style={{ color: '#09090b' }}>Submit Certification Exam?</h4>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed" style={{ color: '#52525b' }}>
                You have answered <strong style={{ color: '#09090b' }}>{Object.keys(examAnswers).length}</strong> of <strong style={{ color: '#09090b' }}>{examQuestions.length}</strong> questions. 
                {Object.keys(examAnswers).length < examQuestions.length && (
                  <span className="text-amber-700 block mt-1.5 font-semibold">
                    ⚠️ Warning: You still have {examQuestions.length - Object.keys(examAnswers).length} unanswered question(s).
                  </span>
                )}
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer"
                  style={{ color: '#3f3f46' }}
                >
                  Continue Exam
                </button>
                <button
                  type="button"
                  onClick={handleGradeSkillExam}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  Yes, Submit Final
                </button>
              </div>
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

        {/* Curated Video Course & Multi-Platform Details Modal */}
        {selectedVideoCourse && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            style={{ zIndex: 9999 }}
            onClick={() => setSelectedVideoCourse(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-900"
              style={{ color: '#09090b' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 pb-3 border-b border-zinc-100 flex items-start justify-between gap-3 bg-zinc-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200/80">
                      {selectedVideoCourse.skill}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Recommended
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-zinc-900 leading-snug" style={{ color: '#09090b' }}>
                    {selectedVideoCourse.course_title}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium" style={{ color: '#71717a' }}>
                    {selectedVideoCourse.instructor_channel || 'YouTube'} • {selectedVideoCourse.duration || 'Full Course'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVideoCourse(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-600" />
                    {selectedVideoCourse.platform || 'YouTube'}
                  </span>
                  {selectedVideoCourse.duration && (
                    <span className="px-2.5 py-1 text-xs font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {selectedVideoCourse.duration}
                    </span>
                  )}
                  {selectedVideoCourse.difficulty_level && (
                    <span className="px-2.5 py-1 text-xs font-medium text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg">
                      {selectedVideoCourse.difficulty_level}
                    </span>
                  )}
                </div>

                {/* Key Concepts Covered */}
                {Array.isArray(selectedVideoCourse.key_topics) && selectedVideoCourse.key_topics.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5" style={{ color: '#71717a' }}>
                      KEY CONCEPTS COVERED
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedVideoCourse.key_topics.map((topic, tidx) => (
                        <span
                          key={tidx}
                          className="text-xs font-medium px-2.5 py-1 bg-zinc-50 text-zinc-700 rounded-lg border border-zinc-200"
                          style={{ color: '#3f3f46' }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Why this video explains [Skill] best (Callout box) */}
                {selectedVideoCourse.why_recommended && (
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 space-y-1.5">
                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5" style={{ color: '#78350f' }}>
                      <Lightbulb className="w-4 h-4 text-amber-700 shrink-0" />
                      Why this video explains {selectedVideoCourse.skill} best:
                    </p>
                    <p className="text-xs text-amber-950 leading-relaxed font-normal" style={{ color: '#451a03' }}>
                      {selectedVideoCourse.why_recommended}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  {/* Big Red Watch on YouTube Button */}
                  <a
                    href={selectedVideoCourse.direct_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-md cursor-pointer group"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Watch Course on {selectedVideoCourse.platform || 'YouTube'}</span>
                    <ExternalLink className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                  </a>

                  {/* Multi-portal switch buttons: roadmap.sh & Official Docs */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {selectedVideoCourse.roadmapUrl && (
                      <a
                        href={selectedVideoCourse.roadmapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title={`Open interactive roadmap for ${selectedVideoCourse.skill} on roadmap.sh`}
                      >
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        <span>roadmap.sh</span>
                        <ExternalLink className="w-3 h-3 text-blue-400" />
                      </a>
                    )}
                    {selectedVideoCourse.docUrl && (
                      <a
                        href={selectedVideoCourse.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title={`Open official documentation for ${selectedVideoCourse.skill}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Official Docs</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── T7 AI MENTOR ─────────────────────────────────────────────────
             Floating AI chat available on EVERY tab.
             Knows the student's full profile, ATS results, roadmap & YouTube data.
             Powered by Google Gemini Flash via /api/gemini
        ──────────────────────────────────────────────────────────────────── */}
        <T7AiMentor
          studentContext={{
            // Identity
            name: userProfile?.displayName || userProfile?.name || currentUser?.displayName || '',
            branch: userProfile?.branch || analysis?.branch || '',
            year: userProfile?.year || analysis?.year || '',
            cgpa: userProfile?.cgpa || analysis?.cgpa || '',

            // Career profile (from Gemini Agent)
            targetRole: role?.role_name || analysis?.career_role || '',
            readinessScore: readiness_score,
            honestAssessment: honest_assessment,
            finalOutcome: final_outcome,
            matchedSkills: matched_skills,
            missingSkills: missing_skills,
            roadmap: learning_roadmap,
            quickWins: quick_wins,

            // Granular ATS resume data (from Gemini ATS Analyzer)
            atsScore: ats_analysis?.overall_readiness ?? ats_analysis?.score ?? readiness_score,
            atsParseability: ats_analysis?.ats_parseability ?? null,
            impactQuantification: ats_analysis?.impact_quantification ?? null,
            skillMatch: ats_analysis?.skill_match ?? null,
            formattingQuality: ats_analysis?.formatting_quality ?? null,
            realityCheckMessage: ats_analysis?.reality_check_message || ats_analysis?.action_plan || honest_assessment,
            softSkills: ats_analysis?.soft_skills_detected || ats_analysis?.soft_skills || [],
            atsSummary: typeof ats_analysis?.summary === 'string' ? ats_analysis.summary : (ats_analysis?.reality_check_message || null),
            atsStrengths: ats_analysis?.strengths || [],
            atsGaps: ats_analysis?.gaps || ats_analysis?.issues || [],
            atsKeywordGaps: ats_analysis?.keyword_gaps || ats_analysis?.ats_keyword_gaps || [],
            atsRewrites: ats_analysis?.rewrites || ats_analysis?.rewrite_suggestions || [],
            resumeFileName: resume_meta?.file_name || null,

            // YouTube learning
            videoCount: videoLearning?.length || 0,
            ytSkills: ytSkills || [],
          }}
        />
      </main>
    </div>
  );
};

export default Results;
