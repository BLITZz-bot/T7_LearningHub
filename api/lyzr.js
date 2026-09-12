/**
 * Vercel Serverless Function: /api/lyzr
 *
 * Secure server-side proxy for all LYZR AI Agent calls.
 * LYZR_API_KEY is stored as a server-only env var — NEVER sent to the browser.
 *
 * All agents are ROLE-BASED — analysis is driven entirely by the student's
 * selected career role, not any hardcoded company names.
 *
 * Supported actions (POST body):
 *   { action: 'analyzeProfile', payload: { skills, role, branch, year, cgpa, resumeBase64, mimeType, userId } }
 *   { action: 'analyzeResume',  payload: { resumeBase64, mimeType, targetRole, userId } }
 *   { action: 'chatTutor',      payload: { message, sessionId, studentContext, userId } }
 *   { action: 'validateSkill',  payload: { skill, level, answers, userId } }
 */

const LYZR_BASE = 'https://agent.api.lyzr.ai/v3/inference/chat/';

/**
 * Core LYZR agent caller — sends a message to a specific agent
 */
async function callLyzrAgent(agentId, apiKey, userId, message, sessionId) {
  const res = await fetch(LYZR_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      user_id: userId || 't7_student',
      agent_id: agentId,
      message: message,
      session_id: sessionId || `session_${Date.now()}`,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || err?.detail || `LYZR agent error (${res.status})`);
  }

  const data = await res.json();
  // LYZR response can be in .response or .message field
  return data?.response || data?.message || data;
}

/**
 * Safely parse JSON from LYZR response (strips markdown code fences if present)
 */
function safeParseJson(response) {
  if (typeof response === 'object' && response !== null) return response;
  const cleaned = String(response)
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  return JSON.parse(cleaned);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const LYZR_API_KEY    = process.env.LYZR_API_KEY || '';
  const AGENT_PROFILE   = process.env.LYZR_AGENT_PROFILE || '';
  const AGENT_RESUME    = process.env.LYZR_AGENT_RESUME || '';
  const AGENT_TUTOR     = process.env.LYZR_AGENT_TUTOR || '';
  const AGENT_VALIDATOR = process.env.LYZR_AGENT_VALIDATOR || '';

  if (!LYZR_API_KEY) {
    return res.status(503).json({
      error: 'LYZR_NOT_CONFIGURED',
      message: 'LYZR API key not configured on server. Please set LYZR_API_KEY in your environment variables.',
    });
  }

  const { action, payload = {} } = req.body || {};
  const userId = payload.userId || 't7_user';

  try {

    // ── ACTION: analyzeProfile ────────────────────────────────────────────
    // Replaces: analyzeT7LearningHub() in geminiService.js
    // Called from: lyzrAgentService.analyzeStudentProfile()
    // ─────────────────────────────────────────────────────────────────────
    if (action === 'analyzeProfile') {
      if (!AGENT_PROFILE) return res.status(503).json({ error: 'LYZR_NOT_CONFIGURED' });

      const { skills, role, branch, year, cgpa, resumeBase64, mimeType, sessionId } = payload;

      const isBeginnerMode = !skills || skills.length === 0;

      const message = JSON.stringify({
        task: 'ANALYZE_STUDENT_CAREER_PROFILE',
        student_profile: {
          branch: branch || 'Not specified',
          year: year || 'Not specified',
          cgpa: cgpa || 'Not specified',
          // NOTE: YouTube watch history is NOT an input here.
          // It is tracked separately AFTER roadmap starts (ProgressTrackerAgent - Phase 2)
          current_skills: isBeginnerMode ? [] : (skills || []),
          is_beginner: isBeginnerMode,
        },
        target_role: {
          // Role drives everything — no hardcoded company names
          role_name: role?.role_name || 'Software Developer',
          description: role?.description || '',
          required_skills: role?.required_skills || [],
          priority_skills: role?.priority_skills || [],
        },
        resume_provided: !!resumeBase64,
        resume_base64: resumeBase64 || null,
        mime_type: mimeType || null,
        output_instructions: `
Return ONLY a valid JSON object with EXACTLY these fields (no markdown, no explanation):
{
  "career_role": "<role name>",
  "readiness_score": <0-100>,
  "score_breakdown": {
    "technical_skills": <0-100>,
    "resume_quality": <0-100>,
    "market_fit": <0-100>,
    "profile_completeness": <0-100>
  },
  "honest_assessment": "<2-3 sentences honest evaluation>",
  "matched_skills": ["<skill>", ...],
  "missing_skills": ["<skill>", ...],
  "recommended_skills": ["<skill>", ...],
  "skill_priority_order": ["<learn this first>", "<then this>", ...],
  "learning_roadmap": [
    {
      "phase": "<e.g. Month 1>",
      "duration": "<e.g. 4 weeks>",
      "focus": "<main topic>",
      "skills": ["<skill>", ...],
      "milestone": "<what student achieves by end of this phase>"
    }
  ],
  "quick_wins": ["<action 1>", "<action 2>", "<action 3>"],
  "resume_tips": ["<tip>", ...],
  "motivation": "<short encouraging message>",
  "final_outcome": "<what they can achieve after completing roadmap>"
}

${isBeginnerMode
  ? 'IMPORTANT: Student is starting from scratch (0 skills). Generate a complete 6-month Zero-to-Hero foundational roadmap for their target role. Start from the very basics.'
  : 'Analyze the gap between their current skills and the target role requirements. Be honest and specific.'}
Base your analysis on current industry standards and job market expectations for the target role.
`.trim()
      });

      const response = await callLyzrAgent(
        AGENT_PROFILE,
        LYZR_API_KEY,
        userId,
        message,
        sessionId || `profile_${userId}_${Date.now()}`
      );

      const parsed = safeParseJson(response);
      return res.status(200).json({ result: parsed, agent: 'ProfileAnalyzerAgent' });
    }

    // ── ACTION: analyzeResume ─────────────────────────────────────────────
    // Replaces: analyzeResumeOnly() in geminiService.js
    // Called from: lyzrAgentService.analyzeResumeLyzr()
    // ─────────────────────────────────────────────────────────────────────
    if (action === 'analyzeResume') {
      if (!AGENT_RESUME) return res.status(503).json({ error: 'LYZR_NOT_CONFIGURED' });

      const { resumeBase64, mimeType, targetRole, sessionId } = payload;
      if (!resumeBase64) return res.status(400).json({ error: 'resumeBase64 is required' });

      const message = JSON.stringify({
        task: 'ANALYZE_RESUME_FOR_ROLE',
        target_role: targetRole || 'Software Developer',
        // Analysis is ROLE-BASED — what does THIS role require?
        // No hardcoded companies — the role itself defines the requirements
        resume_base64: resumeBase64,
        mime_type: mimeType || 'application/pdf',
        output_instructions: `
Analyze the resume for the target role: "${targetRole || 'Software Developer'}".
Return ONLY a valid JSON object (no markdown, no extra text):
{
  "ats_score": <0-100>,
  "summary": "<2-sentence overall assessment>",
  "what_student_has": [
    { "section": "<e.g. Projects>", "content": "<what it contains>", "quality": "good|average|weak" }
  ],
  "what_is_missing": [
    { "item": "<missing item>", "importance": "critical|important|nice_to_have", "why": "<why it matters for this role>" }
  ],
  "rewrite_suggestions": [
    { "original": "<exact text from resume>", "improved": "<rewritten version>", "reason": "<why this is better>" }
  ],
  "keyword_gaps": ["<keyword missing for this role>", ...],
  "strengths": ["<strength>", ...],
  "issues": ["<issue>", ...]
}
Be SPECIFIC and ROLE-FOCUSED. Every suggestion must directly relate to the target role.
Do NOT give generic resume advice. Tie everything to: "${targetRole || 'Software Developer'}".
`.trim()
      });

      const response = await callLyzrAgent(
        AGENT_RESUME,
        LYZR_API_KEY,
        userId,
        message,
        sessionId || `resume_${userId}_${Date.now()}`
      );

      const parsed = safeParseJson(response);

      // Map to existing Results.jsx ats_analysis format for backward compatibility
      const normalized = {
        ats_score: parsed.ats_score || 0,
        summary: parsed.summary || '',
        what_student_has: parsed.what_student_has || [],
        what_is_missing: parsed.what_is_missing || [],
        rewrite_suggestions: parsed.rewrite_suggestions || [],
        keyword_gaps: parsed.keyword_gaps || [],
        strengths: parsed.strengths || [],
        issues: parsed.issues || [],
        // Legacy fields for backward compat with Results.jsx
        score: parsed.ats_score || 0,
        suggested_keywords: parsed.keyword_gaps || [],
        section_scores: {},
      };

      return res.status(200).json({ result: normalized, agent: 'ResumeOptimizerAgent' });
    }

    // ── ACTION: chatTutor ─────────────────────────────────────────────────
    // Replaces: callGemini() in chatbot.js
    // Called from: chatbot.js → callLyzrTutor()
    // ─────────────────────────────────────────────────────────────────────
    if (action === 'chatTutor') {
      if (!AGENT_TUTOR) return res.status(503).json({ error: 'LYZR_NOT_CONFIGURED' });

      const { message, sessionId, studentContext } = payload;
      if (!message) return res.status(400).json({ error: 'message is required' });

      // Attach student context to message for personalized responses
      const contextualMessage = studentContext
        ? `[Student Context: name=${studentContext.name}, targetRole=${studentContext.career_interest || 'Not set'}, branch=${studentContext.branch || 'Not set'}, year=${studentContext.year || 'Not set'}, readinessScore=${studentContext.readiness_score || 0}%]\n\nStudent: ${message}`
        : message;

      const response = await callLyzrAgent(
        AGENT_TUTOR,
        LYZR_API_KEY,
        userId,
        contextualMessage,
        sessionId || `tutor_${userId}`
      );

      const text = typeof response === 'string' ? response : JSON.stringify(response);
      return res.status(200).json({ text, agent: 'TutorBotAgent' });
    }

    // ── ACTION: validateSkill ─────────────────────────────────────────────
    // New feature: skill quiz generation + grading
    // Called from: lyzrAgentService.generateSkillQuiz() / gradeSkillQuiz()
    // ─────────────────────────────────────────────────────────────────────
    if (action === 'validateSkill') {
      if (!AGENT_VALIDATOR) return res.status(503).json({ error: 'LYZR_NOT_CONFIGURED' });

      const { skill, level, answers, sessionId } = payload;

      const message = answers
        ? JSON.stringify({
            task: 'GRADE_SKILL_QUIZ',
            skill,
            student_level: level || 'intermediate',
            student_answers: answers,
            output_instructions: `
Grade the student's answers and return ONLY valid JSON:
{
  "validation_score": <0-100>,
  "verified_level": "BEGINNER|INTERMEDIATE|ADVANCED|NOT_VERIFIED",
  "passed": <true|false>,
  "feedback": "<specific feedback on what they got right/wrong>",
  "next_steps": ["<what to study next>"]
}
`.trim()
          })
        : JSON.stringify({
            task: 'GENERATE_SKILL_QUIZ',
            skill,
            student_level: level || 'intermediate',
            output_instructions: `
Generate exactly 3 MCQ questions to validate the student's knowledge of "${skill}".
Return ONLY valid JSON:
{
  "questions": [
    {
      "q": "<question text>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "correct": <0-3 index>
    }
  ]
}
`.trim()
          });

      const response = await callLyzrAgent(
        AGENT_VALIDATOR,
        LYZR_API_KEY,
        userId,
        message,
        sessionId || `quiz_${skill}_${userId}_${Date.now()}`
      );

      const parsed = safeParseJson(response);
      return res.status(200).json({ result: parsed, agent: 'SkillValidatorAgent' });
    }

    return res.status(400).json({ error: `Unknown action: "${action}"` });

  } catch (err) {
    console.error('[/api/lyzr] Unhandled error:', err);
    return res.status(500).json({ error: 'LYZR agent error', detail: err.message });
  }
}
