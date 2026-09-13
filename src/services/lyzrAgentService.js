/**
 * LYZR AI Agent Service — T7 Learning Hub
 *
 * All LYZR agent calls are proxied through /api/lyzr (server-side, key never in browser).
 * This is the ONLY AI service — Gemini has been removed.
 *
 * Agents:
 *   ProfileAnalyzerAgent  → analyzeStudentProfile()   replaces old Gemini roadmap call
 *   ResumeOptimizerAgent  → analyzeResumeLyzr()        replaces old Gemini ATS call
 *   TutorBotAgent         → callLyzrTutor()            replaces old Gemini chatbot call
 *   SkillValidatorAgent   → generateSkillQuiz()        new feature (Phase 2)
 *                           gradeSkillQuiz()
 */

// ─── Internal proxy caller ────────────────────────────────────────────────────
const callLyzrProxy = async (action, payload = {}) => {
  const res = await fetch('/api/lyzr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.detail || data?.message || `LYZR proxy error (${res.status})`);
  return data;
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
}) => {
  let resumeBase64 = null;
  let mimeType = null;
  if (resumeFile) {
    const encoded = await fileToBase64(resumeFile);
    resumeBase64 = encoded.base64;
    mimeType = encoded.mimeType;
  }

  const data = await callLyzrProxy('analyzeProfile', {
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
  });

  const result = data.result;

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
    _agent: 'LYZR_ProfileAnalyzerAgent',
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 2: Resume Optimizer
// Called from: Results.jsx → handleAtsUpload()
// ─────────────────────────────────────────────────────────────────────────────
export const analyzeResumeLyzr = async ({
  resumeFile,
  targetRole = 'Software Developer',
  userId = null,
}) => {
  if (!resumeFile) throw new Error('Resume file is required');

  const { base64, mimeType } = await fileToBase64(resumeFile);

  const data = await callLyzrProxy('analyzeResume', {
    resumeBase64: base64,
    mimeType,
    targetRole: typeof targetRole === 'string' ? targetRole : targetRole?.role_name || 'Software Developer',
    userId,
    sessionId: `resume_${userId}_${Date.now()}`,
  });

  const result = data.result;

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
    _agent: 'LYZR_ResumeOptimizerAgent',
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 3: TutorBot
// Called from: chatbot.js → callLyzrTutor()
// ─────────────────────────────────────────────────────────────────────────────
export const callLyzrTutor = async ({
  message,
  sessionId,
  studentContext = null,
  userId = null,
}) => {
  const data = await callLyzrProxy('chatTutor', {
    message,
    sessionId: sessionId || `tutor_${userId || 'anon'}`,
    studentContext,
    userId,
  });
  return data.text || '';
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 4: Skill Validator — Phase 2
// Called from: SkillValidatorModal (to be built)
// ─────────────────────────────────────────────────────────────────────────────
export const generateSkillQuiz = async ({ skill, level = 'intermediate', userId = null }) => {
  const data = await callLyzrProxy('validateSkill', {
    skill,
    level,
    answers: null,
    userId,
    sessionId: `quiz_${skill}_${userId}_${Date.now()}`,
  });
  return data.result;
};

export const gradeSkillQuiz = async ({ skill, level, answers, userId = null }) => {
  const data = await callLyzrProxy('validateSkill', {
    skill,
    level,
    answers,
    userId,
    sessionId: `grade_${skill}_${userId}_${Date.now()}`,
  });
  return data.result;
};
