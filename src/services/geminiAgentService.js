


/**
 * Gemini AI Agent Service — T7 Learning Hub
 *
 * All multi-agent operations are proxied through /api/gemini-agent
 * (or legacy /api/lyzr fallback), keeping API keys strictly server-side.
 * Powered by LangGraph + Google Gemini (default: gemini-3.6-flash).
 *
 * Agents:
 *   ProfileAnalyzerAgent  → analyzeStudentProfile()   Placement readiness & phased roadmap
 *   ResumeOptimizerAgent  → analyzeResumeGeminiAgent() ATS audit, keyword gaps & bullet rewrites
 *   TutorBotAgent         → callGeminiTutor()         Context-aware conversational tutor
 *   SkillValidatorAgent   → generateSkillQuiz()       Role-calibrated skill quizzes
 *                           gradeSkillQuiz()          Skill quiz grading & verification
 */

// ─── Safe Internal Proxy Caller (Zero Unsafe JSON Parsing) ───────────────────
const callAgentProxy = async (action, payload = {}) => {
  let res;
  try {
    res = await fetch('/api/gemini-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
  } catch (netErr) {
    throw new Error('Unable to connect to AI server. Please check your internet connection.');
  }

  // Safe parsing: NEVER call res.json() without checking res.ok first!
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let errJson = null;
    try {
      errJson = JSON.parse(text);
    } catch {}

    if (res.status === 504 || text.includes('FUNCTION_INVOCATION_TIMEOUT') || text.includes('An error occurred')) {
      throw new Error('AI analysis timed out on the server. The model is taking longer than expected. Please try again.');
    }

    if (errJson?.error === 'GEMINI_NOT_CONFIGURED') {
      throw new Error('Google Gemini API key is missing. Please add GEMINI_API_KEY to your environment settings.');
    }

    throw new Error(errJson?.error || errJson?.detail || errJson?.message || `AI service error (${res.status})`);
  }

  try {
    return await res.json();
  } catch (parseErr) {
    throw new Error('Invalid response received from AI service. Please retry.');
  }
};

// ─── Helper: File → base64 ─────────────────────────────────────────────────────
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result.split(',')[1];
    resolve({ base64, mimeType: file.type });
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 1: Profile Analyzer
// Called from: StudentDashboard.jsx → handleAnalyze()
// ─────────────────────────────────────────────────────────────────────────────
export const analyzeStudentProfile = async ({
  studentSkills = [],
  selectedRole,
  branch = '',
  year = '',
  cgpa = '',
  resumeFile = null,
  userId = null,
  customApiKey = null,
  preferredModel = 'gemini-3.5-flash',
}) => {
  let resumeBase64 = null;
  let mimeType = null;
  if (resumeFile) {
    const encoded = await fileToBase64(resumeFile);
    resumeBase64 = encoded.base64;
    mimeType = encoded.mimeType;
  }

  const data = await callAgentProxy('analyzeProfile', {
    skills: studentSkills,
    role: {
      role_name: selectedRole.role_name,
      description: selectedRole.description,
      required_skills: selectedRole.required_skills,
      priority_skills: selectedRole.priority_skills,
    },
    branch,
    year,
    cgpa,
    resumeBase64,
    mimeType,
    userId,
    sessionId: `profile_${userId}_${Date.now()}`,
    customApiKey,
    preferredModel: preferredModel || 'gemini-3.5-flash',
  });

  const result = data.result || {};

  return {
    ...result,
    career_role: result.career_role || selectedRole.role_name,
    readiness_score: Math.min(100, Math.max(0, result.readiness_score || 0)),
    score_breakdown: result.score_breakdown || {},
    honest_assessment: result.honest_assessment || '',
    matched_skills: result.matched_skills || result.skills_have || [],
    skills_have: result.skills_have || result.matched_skills || [],
    missing_skills: result.missing_skills || [],
    skills_missing: result.skills_missing || [],
    recommended_skills: result.recommended_skills || result.missing_skills || [],
    skill_priority_order: result.skill_priority_order || result.missing_skills || [],
    learning_roadmap: result.learning_roadmap || result.roadmap || [],
    roadmap: result.roadmap || result.learning_roadmap || [],
    quick_wins: result.quick_wins || [],
    resume_tips: result.resume_tips || [],
    linkedin_tips: result.linkedin_tips || [],
    motivation: result.motivation || '',
    final_outcome: result.final_outcome || '',
    clarification_needed: result.clarification_needed || null,
    ats_analysis: result.ats_analysis || null,
    resume_meta: resumeFile
      ? { file_name: resumeFile.name, file_type: resumeFile.type || 'application/pdf' }
      : null,
    _agent: 'Gemini_ProfileAnalyzerAgent',
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 2: Resume Optimizer
// Called from: Results.jsx → handleAtsUpload()
// ─────────────────────────────────────────────────────────────────────────────
export const analyzeResumeGeminiAgent = async ({
  resumeFile,
  targetRole = '',
  userId = null,
  preferredModel = 'gemini-3.5-flash',
}) => {
  if (!resumeFile) throw new Error('Resume file is required');

  const { base64, mimeType } = await fileToBase64(resumeFile);

  const data = await callAgentProxy('analyzeResume', {
    resumeBase64: base64,
    mimeType,
    targetRole: typeof targetRole === 'string' ? targetRole : (targetRole?.role_name || ''),
    userId,
    sessionId: `resume_${userId}_${Date.now()}`,
    preferredModel: preferredModel || 'gemini-3.5-flash',
  });

  const result = data.result || {};

  return {
    ...result,
    ats_analysis: {
      ...result,
      score: result.ats_score ?? result.score ?? 0,
      ats_score: result.ats_score ?? result.score ?? 0,
      summary: result.summary || '',
      strengths: result.strengths || result.audit?.strengths || [],
      audit: result.audit || {},
      gaps: result.gaps || [],
      issues: result.issues || [],
      keyword_gaps: result.keyword_gaps || result.ats_keyword_gaps || [],
      ats_keyword_gaps: result.ats_keyword_gaps || result.keyword_gaps || [],
      suggested_keywords: result.suggested_keywords || result.ats_keyword_gaps || result.keyword_gaps || [],
      rewrites: result.rewrites || result.rewrite_suggestions || [],
      rewrite_suggestions: result.rewrite_suggestions || result.rewrites || [],
      section_scores: result.section_scores || {},
      what_student_has: result.what_student_has || [],
      what_is_missing: result.what_is_missing || [],
      clarification_needed: result.clarification_needed || null,
    },
    resume_meta: {
      file_name: resumeFile.name,
      file_type: resumeFile.type || 'application/pdf',
    },
    _agent: 'Gemini_ResumeOptimizerAgent',
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 3: TutorBot
// Called from: chatbot.js → callGeminiTutor()
// ─────────────────────────────────────────────────────────────────────────────
export const callGeminiTutor = async ({
  message,
  sessionId,
  studentContext = null,
  userId = null,
  preferredModel = 'gemini-3.6-flash',
}) => {
  const data = await callAgentProxy('chatTutor', {
    message,
    sessionId: sessionId || `tutor_${userId || 'anon'}`,
    studentContext,
    userId,
    preferredModel: preferredModel || 'gemini-3.6-flash',
  });
  return data.text || '';
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 4: Skill Validator
// ─────────────────────────────────────────────────────────────────────────────
export const generateSkillQuiz = async ({ skill, level = 'intermediate', userId = null, preferredModel = 'gemini-3.6-flash' }) => {
  const data = await callAgentProxy('validateSkill', {
    skill,
    level,
    answers: null,
    userId,
    sessionId: `quiz_${skill}_${userId}_${Date.now()}`,
    preferredModel: preferredModel || 'gemini-3.6-flash',
  });
  return data.result;
};

export const gradeSkillQuiz = async ({ skill, level, answers, userId = null, preferredModel = 'gemini-3.5-flash' }) => {
  const data = await callAgentProxy('validateSkill', {
    skill,
    level,
    answers,
    userId,
    sessionId: `grade_${skill}_${userId}_${Date.now()}`,
    preferredModel: preferredModel || 'gemini-3.5-flash',
  });
  return data.result;
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 5: Dynamic Course & Video Recommender (Pedagogical Evaluation)
// ─────────────────────────────────────────────────────────────────────────────
export const getCourseRecommendations = async ({
  skills = [],
  targetRole = '',
  userId = null,
  preferredModel = 'gemini-3.5-flash',
  customApiKey = null,
  forceRefresh = false,
}) => {
  if (!skills || skills.length === 0) return [];
  const data = await callAgentProxy('recommendCourses', {
    skills,
    targetRole,
    userId,
    preferredModel,
    customApiKey,
    forceRefresh,
  });
  return data.result?.recommendations || [];
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 6: Skill Certification Exam Agent (10-Question 5-Pillar Assessment)
// ─────────────────────────────────────────────────────────────────────────────
export const generateSkillCertificationExam = async ({
  skill,
  difficulty = 'Intermediate',
  role = '',
  userId = null,
  preferredModel = 'gemini-3.5-flash',
  customApiKey = null,
}) => {
  const data = await callAgentProxy('skillExam', {
    skill,
    difficulty,
    role,
    userId,
    preferredModel,
    customApiKey,
  });
  return data.result;
};

