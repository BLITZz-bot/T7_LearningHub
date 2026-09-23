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

const LYZR_BASE = process.env.LYZR_ENDPOINT || 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';

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

/**
 * Extracts clean readable plain text from a Base64 encoded file (PDF, DOCX, DOC, or TXT)
 */
async function extractTextFromBase64(base64Data, mimeType = '') {
  if (!base64Data) return '';
  const buffer = Buffer.from(base64Data, 'base64');
  const lowerMime = String(mimeType).toLowerCase();

  const isWordDoc = lowerMime.includes('word') ||
                    lowerMime.includes('officedocument') ||
                    lowerMime.includes('msword') ||
                    lowerMime.includes('docx') ||
                    lowerMime.includes('doc');

  // 1. If it's identified as Word document, extract with mammoth
  if (isWordDoc) {
    try {
      const mammoth = await import('mammoth');
      const extractor = mammoth.default || mammoth;
      const res = await extractor.extractRawText({ buffer });
      if (res?.value && res.value.trim().length > 20) {
        return res.value.trim();
      }
    } catch (docxErr) {
      console.warn('Mammoth Word extraction failed, trying PDF/text fallback:', docxErr.message);
    }
  }

  // 2. Try PDF extraction with PDFParse
  try {
    const bytes = new Uint8Array(buffer);
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse(bytes);
    const parsedDoc = await parser.getText();
    if (parsedDoc?.text && parsedDoc.text.trim().length > 20) {
      return parsedDoc.text.trim();
    }
  } catch (err) {
    // If PDF parse failed, try mammoth (in case a docx was uploaded with generic/missing mimeType)
    try {
      const mammoth = await import('mammoth');
      const extractor = mammoth.default || mammoth;
      const res = await extractor.extractRawText({ buffer });
      if (res?.value && res.value.trim().length > 20) {
        return res.value.trim();
      }
    } catch (_) {}
  }

  // 3. Fallback for plaintext, .txt, or markdown
  try {
    const raw = buffer.toString('utf-8');
    const printable = raw.replace(/[^\x20-\x7E\n\r\t]/g, '');
    if (printable.length > 50) {
      return printable.trim();
    }
  } catch (_) {}

  return '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const LYZR_API_KEY = process.env.LYZR_API_KEY || '';
  const AGENT_PROFILE = process.env.LYZR_AGENT_PROFILE || '';
  const AGENT_RESUME = process.env.LYZR_AGENT_RESUME || '';
  const AGENT_TUTOR = process.env.LYZR_AGENT_TUTOR || '';
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
    // Agent A: ProfileAnalyzerAgent
    // ─────────────────────────────────────────────────────────────────────
    if (action === 'analyzeProfile') {
      if (!AGENT_PROFILE) return res.status(503).json({ error: 'LYZR_NOT_CONFIGURED' });

      const { skills, role, branch, year, cgpa, resumeBase64, mimeType, sessionId } = payload;
      const isBeginnerMode = !skills || skills.length === 0;

      let extractedText = '';
      if (resumeBase64) {
        extractedText = await extractTextFromBase64(resumeBase64, mimeType);
      }

      const message = JSON.stringify({
        task: 'ANALYZE_STUDENT_CAREER_PROFILE',
        student_profile: {
          branch: branch || 'Not specified',
          year: year || 'Not specified',
          cgpa: cgpa || 'Not specified',
          current_skills: isBeginnerMode ? [] : (skills || []),
          is_beginner: isBeginnerMode,
        },
        target_role: {
          role_name: role?.role_name || 'Software Developer',
          description: role?.description || '',
          required_skills: role?.required_skills || [],
          priority_skills: role?.priority_skills || [],
        },
        resume_provided: Boolean(resumeBase64),
        resume_text: extractedText ? extractedText.slice(0, 12000) : null,
      });

      const response = await callLyzrAgent(
        AGENT_PROFILE,
        LYZR_API_KEY,
        userId,
        message,
        sessionId || `profile_${userId}_${Date.now()}`
      );

      const parsed = safeParseJson(response);

      // Support user's exact Lyzr Studio Agent A schema:
      // readiness_score: { overall, technical, resume, market_fit, profile_completeness, reason_if_null }
      const overallScore = typeof parsed.readiness_score === 'object' && parsed.readiness_score !== null
        ? (parsed.readiness_score.overall ?? 0)
        : (typeof parsed.readiness_score === 'number' ? parsed.readiness_score : (parsed.score || 0));

      const scoreBreakdown = typeof parsed.readiness_score === 'object' && parsed.readiness_score !== null
        ? {
          technical_skills: parsed.readiness_score.technical ?? parsed.readiness_score.overall ?? 0,
          resume_quality: parsed.readiness_score.resume ?? parsed.readiness_score.overall ?? 0,
          market_fit: parsed.readiness_score.market_fit ?? parsed.readiness_score.overall ?? 0,
          profile_completeness: parsed.readiness_score.profile_completeness ?? parsed.readiness_score.overall ?? 0,
        }
        : (parsed.score_breakdown || {});

      // Extract skills have / matched
      const matchedSkills = parsed.skills_have || parsed.matched_skills || [];

      // Extract missing skills (handles array of objects { skill, relevance_pct, reason } or array of strings)
      const rawMissing = parsed.skills_missing || parsed.missing_skills || [];
      const missingSkills = rawMissing.map(item => (
        typeof item === 'object' && item !== null ? (item.skill || item.name || '') : item
      )).filter(Boolean);

      // Extract roadmap (handles user's schema { phase, duration_weeks, milestone, skills_covered } and legacy)
      const rawRoadmap = parsed.roadmap || parsed.learning_roadmap || [];
      const learningRoadmap = rawRoadmap.map((p, idx) => ({
        phase: p.phase || `Phase ${idx + 1}`,
        month: p.phase || `Month ${idx + 1}`,
        title: p.milestone || p.title || p.focus || `Phase ${idx + 1}`,
        focus: p.milestone || p.focus || p.theme || '',
        milestone: p.milestone || '',
        duration: p.duration_weeks ? `${p.duration_weeks} weeks` : (p.duration || '4 weeks'),
        duration_weeks: p.duration_weeks || 4,
        skills_covered: p.skills_covered || p.skills || [],
        skills: p.skills_covered || p.skills || [],
      }));

      const quickWins = parsed.quick_wins || [];

      const honestAssessment = parsed.honest_assessment || (
        parsed.readiness_score?.reason_if_null || (
          overallScore > 0
            ? `Profile assessed for ${role?.role_name || 'target role'}. Placement readiness score is ${overallScore}%. Focus on key missing competencies in your roadmap.`
            : 'Assessment completed based on your provided academic profile and skills.'
        )
      );

      const normalized = {
        ...parsed,
        career_role: parsed.career_role || role?.role_name || 'Software Developer',
        readiness_score: overallScore,
        raw_readiness_score: parsed.readiness_score,
        score_breakdown: scoreBreakdown,
        matched_skills: matchedSkills,
        skills_have: matchedSkills,
        missing_skills: missingSkills,
        skills_missing: rawMissing,
        learning_roadmap: learningRoadmap,
        roadmap: learningRoadmap,
        quick_wins: quickWins,
        honest_assessment: honestAssessment,
        clarification_needed: parsed.clarification_needed || null,
        resume_tips: parsed.resume_tips || (quickWins.length > 0 ? quickWins.slice(0, 2) : []),
        motivation: parsed.motivation || 'Stay consistent with your roadmap milestones to achieve placement success.',
        final_outcome: parsed.final_outcome || `Placement ready for ${role?.role_name || 'your target role'}`,
      };

      return res.status(200).json({ result: normalized, agent: 'ProfileAnalyzerAgent' });
    }

    // ── ACTION: analyzeResume ─────────────────────────────────────────────
    // Agent B: ResumeOptimizerAgent
    // ─────────────────────────────────────────────────────────────────────
    if (action === 'analyzeResume') {
      if (!AGENT_RESUME) return res.status(503).json({ error: 'LYZR_NOT_CONFIGURED' });

      const { resumeBase64, mimeType, targetRole, sessionId } = payload;
      if (!resumeBase64) return res.status(400).json({ error: 'resumeBase64 is required' });

      const extractedText = await extractTextFromBase64(resumeBase64, mimeType);

      const message = JSON.stringify({
        task: 'AUDIT_RESUME_FOR_ROLE',
        target_role: targetRole || 'Software Developer',
        resume_text: extractedText ? extractedText.slice(0, 15000) : 'No readable text could be extracted from the file.',
      });

      const response = await callLyzrAgent(
        AGENT_RESUME,
        LYZR_API_KEY,
        userId,
        message,
        sessionId || `resume_${userId}_${Date.now()}`
      );

      const parsed = safeParseJson(response);

      // Support user's exact Lyzr Studio Agent B schema:
      // { clarification_needed, ats_score, audit: { strengths, present_sections }, gaps: [{ issue, severity, why_it_matters }], rewrites: [{ original, improved, reason }], ats_keyword_gaps }
      const strengths = parsed.audit?.strengths || parsed.strengths || [];
      const presentSections = parsed.audit?.present_sections || [];
      const rawGaps = parsed.gaps || [];
      const issues = rawGaps.map(g => (
        typeof g === 'object' && g !== null ? `${g.issue || ''}${g.why_it_matters ? ` — ${g.why_it_matters}` : ''}` : g
      )).filter(Boolean);
      const rewrites = parsed.rewrites || parsed.rewrite_suggestions || [];
      const keywordGaps = parsed.ats_keyword_gaps || parsed.keyword_gaps || [];

      // If Lyzr returned ats_score use it; otherwise if strengths found calculate reasonable baseline
      const atsScore = parsed.ats_score ?? parsed.score ?? (strengths.length > 0 ? 65 : 0);

      const whatStudentHas = presentSections.length > 0
        ? presentSections.map(s => ({ section: s, content: 'Included in resume', quality: 'good' }))
        : (parsed.what_student_has || strengths.map(s => ({ section: 'Strength', content: s, quality: 'good' })));

      const whatIsMissing = rawGaps.length > 0
        ? rawGaps.map(g => ({ item: g.issue || '', importance: g.severity || 'important', why: g.why_it_matters || '' }))
        : (parsed.what_is_missing || []);

      const summary = parsed.summary || (
        parsed.clarification_needed
          ? parsed.clarification_needed
          : rawGaps.length > 0
            ? `${rawGaps.length} critical improvement areas identified for your target role.`
            : `Resume audit complete with an ATS score of ${atsScore}%.`
      );

      let sectionScores = parsed.section_scores || {};
      if (!sectionScores || Object.keys(sectionScores).length === 0) {
        const base = atsScore > 0 ? atsScore : (strengths.length > 0 ? 60 : 45);
        sectionScores = {
          skills_alignment: Math.min(100, Math.max(25, Math.round(base * 0.95))),
          experience_impact: Math.min(100, Math.max(20, Math.round(base * 0.9))),
          formatting_ats: Math.min(100, Math.max(30, Math.round(base * 1.05))),
          education_relevance: Math.min(100, Math.max(40, Math.round(base * 1.1))),
        };
      }

      const normalized = {
        ...parsed,
        ats_score: atsScore,
        score: atsScore,
        summary: summary,
        audit: parsed.audit || { strengths, present_sections: presentSections },
        strengths: strengths,
        gaps: rawGaps,
        issues: issues.length > 0 ? issues : (parsed.issues || []),
        rewrites: rewrites,
        rewrite_suggestions: rewrites,
        ats_keyword_gaps: keywordGaps,
        keyword_gaps: keywordGaps,
        suggested_keywords: keywordGaps,
        what_student_has: whatStudentHas,
        what_is_missing: whatIsMissing,
        clarification_needed: parsed.clarification_needed || null,
        section_scores: sectionScores,
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
          task: 'SCORE_SKILL_VALIDATION_ANSWERS',
          skill: skill || 'General',
          level: (level || 'INTERMEDIATE').toUpperCase(),
          student_answers: answers,
        })
        : JSON.stringify({
          task: 'GENERATE_VALIDATION_QUESTIONS',
          skill: skill || 'General',
          level: (level || 'INTERMEDIATE').toUpperCase(),
        });

      const response = await callLyzrAgent(
        AGENT_VALIDATOR,
        LYZR_API_KEY,
        userId,
        message,
        sessionId || `quiz_${skill}_${userId}_${Date.now()}`
      );

      const parsed = safeParseJson(response);
      const normalized = {
        ...parsed,
        clarification_needed: parsed.clarification_needed || null,
        skill: parsed.skill || skill,
        questions: parsed.questions || [],
        validation_score: parsed.validation_score ?? null,
        verified_level: parsed.verified_level || 'NOT_VERIFIED',
      };
      return res.status(200).json({ result: normalized, agent: 'SkillValidatorAgent' });
    }

    return res.status(400).json({ error: `Unknown action: "${action}"` });

  } catch (err) {
    console.error('[/api/lyzr] Unhandled error:', err);
    return res.status(500).json({ error: 'LYZR agent error', detail: err.message });
  }
}
