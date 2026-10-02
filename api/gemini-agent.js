/**
 * Vercel Serverless Function: /api/gemini-agent
 *
 * T7 Multi-Agent Orchestrator — Unified LangGraph StateGraph + Google Gemini
 *
 * Graph topology:
 *
 *   Input Request
 *         │
 *         ▼
 *    [ router ]
 *         │
 *         ├─ action: 'analyzeProfile' ──► [ profileAnalyzerNode ] ──┐
 *         ├─ action: 'analyzeResume'  ──► [ resumeOptimizerNode ] ──┤
 *         ├─ action: 'chatTutor'      ──► [ chatTutorNode ]       ──┼──► [ normalizerNode ] ──► END
 *         ├─ action: 'quiz'           ──► [ skillValidatorNode ]  ──┤
 *         ├─ action: 'scrapeSkills'   ──► [ skillExtractorNode ]  ──┤
 *         └─ (unrecognized)           ──► [ errorHandlerNode ]   ──┘
 *
 * Key features:
 *  ✅ Each agent is an isolated LangGraph node with typed channels
 *  ✅ Structured output via Zod schemas
 *  ✅ Deterministic scoring (temperature=0) for ATS audits
 *  ✅ Chat session history with RunnableWithMessageHistory
 *  ✅ Multi-model fallback chain (Gemini 3.5 Flash, 3.6 Flash, 3.1 Flash Lite, 3.7, 3.8)
 *  ✅ Auto-repair on schema errors & graceful degradation
 */

import { StateGraph, END } from '@langchain/langgraph';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { z, ZodError } from 'zod';
import { createClient } from '@supabase/supabase-js';

import {
  MODEL_REGISTRY,
  createModel,
  createChatModel,
  createStructuredModel,
  createScoringModel,
  setCors,
  extractTextFromBase64,
} from './_langchain/llm.js';

// ─── Chat Session Store (In-Memory; swap with Redis/Supabase if needed) ─────────
const sessionStore = new Map();

function getOrCreateHistory(sessionId) {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, new InMemoryChatMessageHistory());
  }
  return sessionStore.get(sessionId);
}

// ─── ZOD SCHEMAS ─────────────────────────────────────────────────────────────

// 1. Profile Assessment Schema (100% dynamic from Gemini, no hardcoded defaults)
const ProfileSchema = z.object({
  career_role: z.string(),
  readiness_score: z.number().int().min(0).max(100),
  score_breakdown: z.object({
    technical: z.number().int().min(0).max(100),
    resume: z.number().int().min(0).max(100),
    market_fit: z.number().int().min(0).max(100),
    profile_completeness: z.number().int().min(0).max(100),
  }),
  skills_have: z.array(z.string()),
  skills_missing: z.array(z.string()),
  roadmap: z.array(
    z.object({
      phase: z.number().int(),
      milestone: z.string(),
      title: z.string(),
      duration_weeks: z.number().int(),
      skills_covered: z.array(z.string()),
    })
  ),
  quick_wins: z.array(z.string()),
  honest_assessment: z.string(),
  final_outcome: z.string(),
  motivation: z.string(),
});

// 2. ATS Resume Auditor Schema (Nullable with fallbacks)
const ATSSchema = z.object({
  target_role_detected: z.string().optional().default('Unknown Role'),
  ats_parseability: z.number().int().min(0).max(100).nullable().catch(null).optional(),
  impact_quantification: z.number().int().min(0).max(100).nullable().catch(null).optional(),
  skill_match: z.number().int().min(0).max(100).nullable().catch(null).optional(),
  formatting_quality: z.number().int().min(0).max(100).nullable().catch(null).optional(),
  overall_readiness: z.number().int().min(0).max(100).nullable().catch(null).optional(),
  reality_check_message: z.string().optional().default(''),
  matched_skills: z.array(z.string()).optional().default([]),
  missing_skills: z.array(z.string()).optional().default([]),
  soft_skills_detected: z.array(z.string()).optional().default([]),
  score_breakdown: z.object({
    ats_parseability_reason: z.string().optional().default(''),
    impact_quantification_reason: z.string().optional().default(''),
    skill_match_reason: z.string().optional().default(''),
    formatting_quality_reason: z.string().optional().default(''),
  }).optional().default({
    ats_parseability_reason: '',
    impact_quantification_reason: '',
    skill_match_reason: '',
    formatting_quality_reason: '',
  }),
});

const GRACEFUL_ATS_FALLBACK = (targetRoleText, reason = '') => ({
  target_role_detected: targetRoleText || 'Unknown Role',
  ats_parseability: null,
  impact_quantification: null,
  skill_match: null,
  formatting_quality: null,
  overall_readiness: null,
  reality_check_message: reason
    ? `Analysis could not be completed. Error: ${reason}`
    : 'Analysis could not be completed. Please re-upload your resume or try again.',
  matched_skills: [],
  missing_skills: [],
  soft_skills_detected: [],
  score_breakdown: {
    ats_parseability_reason: '',
    impact_quantification_reason: '',
    skill_match_reason: '',
    formatting_quality_reason: '',
  },
  score: null,
  summary: 'ATS analysis could not be completed.',
  action_plan: 'Please check your Gemini API key and quota, then try again.',
  agent: 'GeminiATSAnalyzer',
  partial_result: true,
  failure_reason: reason,
});

// 3. Coding Challenge & Evaluation Schemas (Hybrid: Code + MCQ - 100% Dynamic)
const QuizQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      id: z.number(),
      type: z.enum(['mcq', 'code']),
      skill: z.string(),
      language: z.string(),
      title: z.string(),
      description: z.string(),
      // Coding questions
      startingCode: z.string().describe('Starter scaffold code for code type, or empty string for mcq'),
      // MCQ questions
      codeSnippet: z.string().describe('Code snippet for mcq output/bug analysis, or empty string'),
      options: z.array(z.string()).describe('Array of 4 options for mcq, or empty array for code'),
      correctAnswerIndex: z.number().int().min(0).max(3).describe('Zero-based index (0, 1, 2, or 3) of the correct answer for mcq, or 0 for code'),
      explanation: z.string().describe('Educational explanation of why the correct answer is right and why others are wrong'),
    })
  ).min(1).max(10),
});

const QuizEvaluationSchema = z.object({
  isCorrect: z.boolean(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  optimalSolution: z.string(),
});

// 4. Job Skill Extraction Schema
const SkillsSchema = z.object({
  skills: z.array(z.string()),
});

// 5. Dynamic Course & Video Recommendation Schema (Pedagogical Evaluation)
const CourseRecommendationSchema = z.object({
  skill: z.string(),
  course_title: z.string(),
  platform: z.string().default('YouTube'),
  instructor_channel: z.string(),
  direct_url: z.string(),
  duration: z.string(),
  why_recommended: z.string(),
  key_topics: z.array(z.string()).default([]),
  difficulty_level: z.string().default('Beginner to Intermediate'),
});

const CoursesListSchema = z.object({
  recommendations: z.array(CourseRecommendationSchema),
});

// 6. Skill Certification Exam Schema (10 Dynamic Scenario Questions across 5 Pillars)
const SkillExamSchema = z.object({
  skill: z.string(),
  difficulty: z.string(),
  questions: z.array(
    z.object({
      id: z.number(),
      pillar: z.string().describe('One of: Syntax & Idioms, OOP & Paradigms, Collections & Data, Concurrency & Async, Architecture & Best Practices'),
      question: z.string().describe('Clear scenario, code-reading problem, or architectural question'),
      codeSnippet: z.string().describe('Optional code snippet or empty string'),
      options: z.array(z.string()).length(4).describe('Exactly 4 distinct, plausible choices'),
      correctAnswerIndex: z.number().int().min(0).max(3).describe('Zero-based index (0, 1, 2, or 3) of the correct answer'),
      explanation: z.string().describe('Educational explanation of why this answer is correct and why other options fail'),
    })
  ).length(10),
});

// In-memory course cache to avoid redundant token spend and ensure sub-second response
const courseCache = new Map();

// ─── SYSTEM PROMPT BUILDER: T7 AI MENTOR ─────────────────────────────────────
function buildMentorSystemPrompt(ctx) {
  const {
    name, branch, year, cgpa, targetRole, readinessScore,
    matchedSkills = [], missingSkills = [],
    atsScore, atsParseability, impactQuantification, skillMatch, formattingQuality,
    realityCheckMessage, softSkills = [], atsSummary,
    atsGaps = [], atsKeywordGaps = [], atsStrengths = [], atsRewrites = [],
    roadmap = [], quickWins = [], videoCount = 0, ytSkills = [],
    honestAssessment, finalOutcome, resumeFileName,
  } = ctx || {};

  const fmt = arr => Array.isArray(arr) ? arr : [];
  const join = arr => fmt(arr).join(', ');
  const toStr = (arr, key) => fmt(arr).map(i => typeof i === 'object' ? (i[key] || JSON.stringify(i)) : i).filter(Boolean).join('\n  - ');

  const roadmapSummary = fmt(roadmap).map((p, i) => {
    const title = p.title || p.milestone || `Phase ${i + 1}`;
    const duration = p.duration || (p.duration_weeks ? `${p.duration_weeks} weeks` : '4 weeks');
    const skills = (p.skills_covered || p.skills || []).join(', ');
    return `  Phase ${i + 1}: ${title} (${duration})${skills ? ` — Skills: ${skills}` : ''}`;
  }).join('\n');

  return `You are T7 AI MENTOR, a personal career coach on the T7 Learning Hub platform.

═══════════════════════════════════════════════════
STUDENT PROFILE
═══════════════════════════════════════════════════
Name: ${name || 'Student'}
Branch: ${branch || 'Not specified'}
Year: ${year || 'Not specified'}
CGPA: ${cgpa || 'Not specified'}
Target Role: ${targetRole || 'Not specified'}

═══════════════════════════════════════════════════
CAREER READINESS
═══════════════════════════════════════════════════
Overall Readiness: ${readinessScore !== undefined ? `${readinessScore}%` : 'Not analyzed yet'}
AI Assessment: ${honestAssessment || 'Not available'}
${finalOutcome ? `Final Goal: ${finalOutcome}` : ''}
Skills They Have: ${join(matchedSkills) || 'None listed'}
Skills Missing: ${join(missingSkills) || 'None listed'}
${quickWins.length > 0 ? `Quick Wins:\n  - ${toStr(quickWins, 'action').split('\n  - ').slice(0, 5).join('\n  - ')}` : ''}

═══════════════════════════════════════════════════
LEARNING ROADMAP
═══════════════════════════════════════════════════
${roadmapSummary || 'No roadmap generated yet'}

═══════════════════════════════════════════════════
ATS RESUME AUDIT
═══════════════════════════════════════════════════
${resumeFileName ? `Resume: ${resumeFileName}` : 'Resume: Not uploaded yet'}
ATS Score: ${atsScore !== undefined ? `${atsScore}%` : 'Not analyzed yet'}
${atsParseability != null ? `Parseability: ${atsParseability}%` : ''}
${impactQuantification != null ? `Impact: ${impactQuantification}%` : ''}
${skillMatch != null ? `Skill Match: ${skillMatch}%` : ''}
${formattingQuality != null ? `Formatting: ${formattingQuality}%` : ''}
Soft Skills: ${join(softSkills) || 'None detected'}
${realityCheckMessage ? `Mentor Reality Check: ${realityCheckMessage}` : ''}
${atsSummary ? `Summary: ${atsSummary}` : ''}
Strengths:\n  - ${toStr(atsStrengths, 'point') || 'Not analyzed yet'}
Issues:\n  - ${toStr(atsGaps, 'issue') || 'Not analyzed yet'}
Missing Keywords: ${join(atsKeywordGaps) || 'Not analyzed yet'}
${atsRewrites.length > 0 ? `Rewrite Suggestions: ${atsRewrites.length} available` : ''}

═══════════════════════════════════════════════════
YOUTUBE LEARNING
═══════════════════════════════════════════════════
Videos Analyzed: ${videoCount}
Skills from Videos: ${join(ytSkills) || 'None yet'}

═══════════════════════════════════════════════════
YOUR ROLE
═══════════════════════════════════════════════════
You are a supportive, honest, highly knowledgeable AI mentor. You:
1. Answer questions about career, skills, resume, roadmap, placement — using the student's actual data above.
2. Give specific, actionable advice (never vague).
3. Are encouraging but HONEST about scores and gaps.
4. Always reference the student's real skills, scores, and role.
5. Keep answers concise with bullet points for steps/lists.
6. Also help with: interview prep, resume bullets, project ideas, LinkedIn, DSA, salary info.

Always address the student by name if available. Every answer should feel custom-made.
Respond in a friendly, mentoring tone. Keep responses focused and practical.`;
}

// ─── LANGGRAPH NODES ─────────────────────────────────────────────────────────

// Node 0: Router
function routerNode(state) {
  return state;
}

function routingFunction(state) {
  const routes = {
    analyzeProfile:    'profileAnalyzer',
    analyzeResume:     'resumeOptimizer',
    chatTutor:         'chatTutor',
    quiz:              'skillValidator',
    validateSkill:     'skillValidator',
    scrapeSkills:      'skillExtractor',
    recommendCourses:  'courseRecommender',
    skillExam:         'skillExamValidator',
    generateSkillExam: 'skillExamValidator',
  };
  return routes[state.action] || 'errorHandler';
}

// Node 1: Profile Analyzer Agent
async function profileAnalyzerNode(state) {
  const { payload } = state;
  const { skills, role, branch, year, cgpa, resumeBase64, mimeType, customApiKey, preferredModel } = payload;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  const isBeginnerMode = !skills || skills.length === 0;

  let resumeText = '';
  if (resumeBase64) resumeText = await extractTextFromBase64(resumeBase64, mimeType);

  const reqSkillsStr = Array.isArray(role?.required_skills)
    ? role.required_skills.map(s => (typeof s === 'string' ? s : s?.name)).filter(Boolean).join(', ')
    : '';
  const prioSkillsStr = Array.isArray(role?.priority_skills)
    ? role.priority_skills.map(s => (typeof s === 'string' ? s : s?.name)).filter(Boolean).join(', ')
    : '';

  const prompt = `You are a senior career coach and AI placement advisor.

Analyze this student's career profile and provide a detailed readiness assessment.

Student Profile:
- Branch: ${branch || 'Not specified'}
- Year: ${year || 'Not specified'}
- CGPA: ${cgpa || 'Not specified'}
- Current Skills: ${isBeginnerMode ? '(Beginner — no skills listed)' : (skills || []).join(', ')}
- Is Beginner: ${isBeginnerMode}

Target Role: ${role?.role_name || ''}
Role Description: ${role?.description || ''}
Required Skills: ${reqSkillsStr}
Priority Skills: ${prioSkillsStr}

${resumeText ? `Resume Text (first 6000 chars):\n${resumeText.slice(0, 6000)}` : 'No resume provided.'}

Provide a complete JSON assessment with:
- career_role: "${role?.role_name || ''}"
- readiness_score: an integer from 0 to 100
- score_breakdown: object with technical, resume, market_fit, profile_completeness (each an integer 0-100)
- skills_have: array of matched skill strings that student already has
- skills_missing: array of important skill strings the student still needs to learn
- roadmap: array of 4 learning phases (each with phase [1-4], milestone, title, duration_weeks [int], skills_covered [string[]])
- quick_wins: array of 3-4 immediate actionable advice strings
- honest_assessment: a concise 2-3 sentence honest evaluation
- final_outcome: the target placement outcome
- motivation: an encouraging closing sentence`;

  const model = createStructuredModel(apiKey, ProfileSchema, preferredModel || 'gemini-3.5-flash');
  const parsed = await model.invoke(prompt);

  const overallScore = parsed.readiness_score;

  const scoreBreakdown = {
    technical_skills: parsed.score_breakdown?.technical ?? overallScore,
    resume_quality: parsed.score_breakdown?.resume ?? overallScore,
    market_fit: parsed.score_breakdown?.market_fit ?? overallScore,
    profile_completeness: parsed.score_breakdown?.profile_completeness ?? overallScore,
  };

  const missingSkills = (parsed.skills_missing || []).map(i =>
    typeof i === 'object' ? (i.skill || '') : i
  ).filter(Boolean);

  const learningRoadmap = (parsed.roadmap || []).map((p, idx) => ({
    phase: p.phase || idx + 1,
    month: `Month ${idx + 1}`,
    title: p.milestone || p.title || `Phase ${idx + 1}`,
    focus: p.milestone || '',
    milestone: p.milestone || '',
    duration: p.duration_weeks ? `${p.duration_weeks} weeks` : '4 weeks',
    duration_weeks: p.duration_weeks || 4,
    skills_covered: p.skills_covered || [],
    skills: p.skills_covered || [],
  }));

  const normalized = {
    ...parsed,
    readiness_score: overallScore,
    raw_readiness_score: overallScore,
    score_breakdown: scoreBreakdown,
    matched_skills: parsed.skills_have || [],
    skills_have: parsed.skills_have || [],
    missing_skills: missingSkills,
    skills_missing: missingSkills,
    learning_roadmap: learningRoadmap,
    roadmap: learningRoadmap,
    quick_wins: parsed.quick_wins || [],
    honest_assessment: parsed.honest_assessment || `Profile assessed. Readiness score: ${overallScore}%.`,
    clarification_needed: null,
    resume_tips: (parsed.quick_wins || []).slice(0, 2),
    motivation: parsed.motivation || 'Stay consistent with your roadmap milestones.',
    final_outcome: parsed.final_outcome || `Placement ready for ${role?.role_name || 'your target role'}`,
  };

  return { result: normalized, agentName: 'GeminiProfileAnalyzer' };
}

// Node 2: Resume & ATS Optimizer Agent (Deterministic scoring + Auto-repair + Graceful fallback)
async function resumeOptimizerNode(state) {
  const { payload } = state;
  const { resumeBase64, mimeType, targetRole, studentContext = {}, preferredModel, customApiKey } = payload;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!resumeBase64) throw new Error('resumeBase64 is required for analyzeResume');

  const extractedText = await extractTextFromBase64(resumeBase64, mimeType);
  if (!extractedText) throw new Error('Failed to extract readable text from document.');

  const { cgpa, year, branch } = studentContext;
  const targetRoleText = targetRole
    ? `"${targetRole}"`
    : (branch ? `a role inferred from the student's branch (${branch}) and resume content` : 'a best-fit role from resume content');

  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer.
Evaluate the resume below for the target role: ${targetRoleText}.

Student context:
- CGPA: ${cgpa || 'Not provided'}
- Passout Year: ${year || 'Not provided'}
- Branch/Department: ${branch || 'Not provided'}

━━━━━━━━━━━━ SCORING RUBRIC (follow exactly) ━━━━━━━━━━━━

1. ats_parseability (0-100): Count how many standard ATS sections are present.
   Each present section adds points: Contact(15) + Summary/Objective(10) +
   Skills(20) + Experience/Projects(25) + Education(20) + Certifications(10).
   Deduct 5 pts per section that has tables, images, or complex formatting ATS bots cannot parse.

2. impact_quantification (0-100): Count bullet points that contain a number/metric
   (e.g. "improved by 30%", "led team of 5"). Score = (quantified bullets / total bullets) × 100.
   If no experience/project bullets exist, score is 10.

3. skill_match (0-100): List the top 10 required skills for the target role.
   Count how many of those 10 skills appear in the resume.
   Score = (matched skills / 10) × 100. Round to nearest integer.

4. formatting_quality (0-100): Start at 100. Deduct:
   - 20 pts if resume uses tables/columns that break ATS parsing
   - 15 pts if font size <10pt or excessive colors (not detectable from text = 0 deduction)
   - 10 pts if more than 2 pages for a student/fresher
   - 10 pts if no clear section headings
   - 10 pts if contact info is missing phone or email

5. overall_readiness = (ats_parseability×0.25) + (impact_quantification×0.20) +
   (skill_match×0.35) + (formatting_quality×0.20). Round to nearest integer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For score_breakdown, write ONE sentence explaining how you calculated each numeric score.
For reality_check_message, write a direct, honest, personalized 2-3 sentence career advice message.

Resume Text:
${extractedText.slice(0, 7000)}`;

  // Deterministic scoring model — temperature=0, topK=1
  const model = createScoringModel(apiKey, ATSSchema, preferredModel);
  let result;

  try {
    result = await model.invoke(prompt);
  } catch (firstErr) {
    const isSchemaError = firstErr instanceof ZodError ||
                          firstErr?.name === 'ZodError' ||
                          firstErr?.message?.includes('ZodError') ||
                          firstErr?.message?.includes('validation') ||
                          firstErr?.name === 'OutputParserException' ||
                          firstErr?.message?.includes('OUTPUT_PARSING_FAILURE');

    if (isSchemaError) {
      console.warn('[/api/gemini-agent] ATS Schema validation failed, attempting auto-repair...', firstErr.message);
      try {
        const repairPrompt = `The following JSON output failed schema validation with this error:
${firstErr.message}

Fix ONLY the fields that failed validation. Return valid JSON matching this structure exactly:
{
  "target_role_detected": string,
  "ats_parseability": integer 0-100,
  "impact_quantification": integer 0-100,
  "skill_match": integer 0-100,
  "formatting_quality": integer 0-100,
  "overall_readiness": integer 0-100,
  "reality_check_message": string,
  "matched_skills": string[],
  "missing_skills": string[],
  "soft_skills_detected": string[],
  "score_breakdown": {
    "ats_parseability_reason": string,
    "impact_quantification_reason": string,
    "skill_match_reason": string,
    "formatting_quality_reason": string
  }
}

Original broken output to fix:
${JSON.stringify(firstErr.received ?? {}, null, 2)}`;

        result = await model.invoke(repairPrompt);
      } catch (repairErr) {
        console.error('[/api/gemini-agent] Auto-repair failed, returning graceful fallback:', repairErr.message);
        return { result: GRACEFUL_ATS_FALLBACK(targetRoleText, repairErr.message), agentName: 'GeminiATSAnalyzer' };
      }
    } else {
      return { result: GRACEFUL_ATS_FALLBACK(targetRoleText, firstErr.message), agentName: 'GeminiATSAnalyzer' };
    }
  }

  const normalized = {
    ...result,
    score: result.overall_readiness ?? null,
    summary: result.reality_check_message || '',
    action_plan: result.reality_check_message || '',
    agent: 'GeminiATSAnalyzer',
    partial_result: false,
  };

  return { result: normalized, agentName: 'GeminiATSAnalyzer' };
}

// Node 3: AI Mentor Chat Tutor Agent (Session Memory + Multi-Turn)
async function chatTutorNode(state) {
  const { payload } = state;
  const { message, chatHistory = [], studentContext = {}, model: requestedModel, sessionId } = payload;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!message?.trim()) throw new Error('message is required for chatTutor');

  const activeModelKey = MODEL_REGISTRY[requestedModel] ? requestedModel : 'gemini-3.6-flash';
  const systemPrompt = buildMentorSystemPrompt(studentContext);

  const model = createChatModel(activeModelKey, apiKey, { maxOutputTokens: 1024 });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', '{system_prompt}'],
    new MessagesPlaceholder('history'),
    ['human', '{message}'],
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  const sid = sessionId || `t7_${Date.now()}`;
  const history = getOrCreateHistory(sid);

  // If chatHistory is passed and history is empty, seed it
  if (chatHistory.length > 0 && (await history.getMessages()).length === 0) {
    const { HumanMessage, AIMessage } = await import('@langchain/core/messages');
    for (const turn of chatHistory) {
      if (turn.role === 'user') await history.addMessage(new HumanMessage(turn.text));
      if (turn.role === 'model') await history.addMessage(new AIMessage(turn.text));
    }
  }

  const chainWithHistory = new RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory: (id) => getOrCreateHistory(id),
    inputMessagesKey: 'message',
    historyMessagesKey: 'history',
  });

  const text = await chainWithHistory.invoke(
    { message, system_prompt: systemPrompt },
    { configurable: { sessionId: sid } }
  );

  return {
    result: {
      text,
      model: activeModelKey,
      modelName: MODEL_REGISTRY[activeModelKey]?.name || activeModelKey,
      sessionId: sid,
    },
    agentName: 'GeminiTutorBot',
  };
}

// Node 4: Skill Validator & Code Challenge Agent (Generate & Evaluate)
async function skillValidatorNode(state) {
  const { payload } = state;
  const { action: subAction, studentContext = {}, submittedCode, question, skill, level } = payload;
  const apiKey = process.env.GEMINI_API_KEY;

  const mode = subAction || (submittedCode ? 'evaluate' : 'generate');

  if (mode === 'evaluate') {
    if (!submittedCode || !question) {
      throw new Error('submittedCode and question are required for quiz evaluation');
    }

    const prompt = `You are an expert code evaluator.
Review the submitted code for this problem.

Problem Title: ${question.title || skill || 'Coding Challenge'}
Problem Description: ${question.description || ''}

User's Submitted Code:
${submittedCode}

Evaluate the logic thoroughly. Check for correctness, edge cases, and code quality.
Provide:
- isCorrect: whether the solution correctly solves the problem
- score: 0-100 based on correctness, efficiency, and code quality
- feedback: specific, constructive feedback explaining what went right or wrong
- optimalSolution: the best/cleanest way to write this solution`;

    const model = createStructuredModel(apiKey, QuizEvaluationSchema);
    const evaluation = await model.invoke(prompt);

    return { result: evaluation, agentName: 'GeminiSkillValidator' };
  }

  // Generate challenges dynamically for the student's exact target role and skill gaps
  const { targetRole = '', matchedSkills = [], missingSkills = [] } = studentContext;
  const skillsHave = Array.isArray(matchedSkills) ? matchedSkills.filter(Boolean).join(', ') : (matchedSkills || '');
  const skillsMissing = Array.isArray(missingSkills) ? missingSkills.filter(Boolean).join(', ') : (missingSkills || skill || '');

  const sessionEntropy = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const prompt = `You are an expert technical interviewer creating a dynamic, fresh daily technical challenge tailored specifically to what this student is currently learning.
${targetRole ? `Target Career Role: ${targetRole}` : ''}
${skillsMissing ? `Skills Student Is Actively Learning Right Now (Missing Skills / Gaps): ${skillsMissing}` : ''}
${skillsHave ? `Skills Student Already Knows: ${skillsHave}` : ''}
${level ? `Target Difficulty Level: ${level.toUpperCase()}` : ''}
Session Variation Key: ${sessionEntropy}

CRITICAL DIVERSITY & NOVELTY INSTRUCTION:
- Every question MUST be based directly on the skills and technologies the student is actively learning right now (${skillsMissing || skillsHave || targetRole}).
- You MUST generate 100% FRESH, UNIQUE, AND DIVERSE questions every time.
- DO NOT repeat standard cliché textbook questions (e.g. DO NOT ask basic "which hook is used for mounting / componentDidMount", basic syntax definitions, or generic trivia).
- Explore diverse engineering areas: performance optimization, asynchronous flows, error handling, state architecture, edge cases, memory leaks, security, concurrency, native integration, or real-world debugging scenarios.
- Do NOT default to any hardcoded language or role. Use the exact programming language, framework, or technology of the skill being tested (e.g. Kotlin, Swift, Dart, Python, TypeScript, Go, Rust, Java, SQL, C++, React Native, Docker, etc.).

Generate 5 dynamic technical evaluation questions:
- Exactly 3 Multiple-Choice Questions ("type": "mcq"): Focus on conceptual depth, predicting code output, identifying bugs, or choosing the best architectural approach for the specific skills they are learning.
- Exactly 2 Hands-on Coding Challenges ("type": "code"): Practical function implementation or algorithmic problem in the language of the skill they are learning.

For each question:
- id: 1 to 5
- type: "mcq" or "code"
- skill: The exact skill from their learning list being evaluated (e.g. "Kotlin", "SwiftUI", "Flutter", "Docker", "React Native", etc.)
- language: The programming language or technology (e.g. "kotlin", "swift", "dart", "python", "typescript", "go", "java", "sql", etc.)
- title: Short descriptive title
- description: Clear problem statement or question

IF type is "mcq":
- startingCode: ""
- codeSnippet: (Optional) 2-8 lines of code in that language if asking about output or bug analysis; otherwise empty string
- options: Array of EXACTLY 4 distinct, plausible choices
- correctAnswerIndex: Integer 0, 1, 2, or 3 pointing to the correct choice (0 = first option, 1 = second option, 2 = third option, 3 = fourth option)
- explanation: Clear educational explanation of why the correct answer is right and why others are wrong

IF type is "code":
- startingCode: Starter code scaffold in the target language (function signature, parameters, comments)
- codeSnippet: ""
- options: []
- correctAnswerIndex: 0
- explanation: ""`;

  const preferredModel = payload.preferredModel || 'gemini-3.5-flash';
  const model = createStructuredModel(apiKey, QuizQuestionsSchema, preferredModel, { temperature: 0.85 });
  const quizResult = await model.invoke(prompt);

  return { result: { questions: quizResult.questions }, agentName: 'GeminiSkillValidator' };
}

// Node 5: Skill Extractor Agent (JD Scraper + Skill Extraction)
async function skillExtractorNode(state) {
  const { payload } = state;
  const { jobId, jobUrl, fallbackDescription } = payload;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!jobId || !jobUrl) throw new Error('jobId and jobUrl are required for scrapeSkills');

  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/^["']|["']$/g, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
  const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
    : null;

  // Check cache
  if (supabase) {
    try {
      const { data: cached } = await supabase.from('t7_scraped_jobs').select('extracted_skills').eq('job_id', jobId).maybeSingle();
      if (cached?.extracted_skills) {
        return { result: { skills: cached.extracted_skills, source: 'cache' }, agentName: 'GeminiSkillExtractor' };
      }
    } catch (_) {}
  }

  // Scrape JD
  let jobText = fallbackDescription || '';
  try {
    const pythonBackendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const scrapeRes = await fetch(`${pythonBackendUrl}/scraping/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: jobUrl }),
    });
    if (scrapeRes.ok) {
      const scrapeData = await scrapeRes.json();
      const blocked = scrapeData.text && (scrapeData.text.includes('suspicious behaviour') || scrapeData.text.includes('Cloudflare') || scrapeData.text.includes('Just a moment...'));
      if (scrapeData.text?.length > 200 && !blocked) jobText = scrapeData.text;
    }
  } catch (e) {
    console.warn('[gemini-agent] Scraper error:', e.message);
  }

  const extractModel = createStructuredModel(apiKey, SkillsSchema);
  const extractPrompt = `Extract all technical skills, frameworks, tools, and programming languages required in this job posting. Return them as an array of strings.\n\nJob Text:\n${jobText.substring(0, 15000)}`;
  const extracted = await extractModel.invoke(extractPrompt);
  const extractedSkills = extracted.skills || [];

  // Cache to Supabase
  if (supabase && extractedSkills.length > 0) {
    try {
      await supabase.from('t7_scraped_jobs').upsert({
        job_id: jobId,
        url: jobUrl,
        extracted_skills: extractedSkills,
        created_at: new Date().toISOString(),
      });
    } catch (_) {}
  }

  return { result: { skills: extractedSkills, source: 'ai' }, agentName: 'GeminiSkillExtractor' };
}

// Validates a YouTube URL via official public oEmbed. If broken or 404, searches YouTube and fetches the real working video ID.
async function ensureValidCourseUrl(rec) {
  const currentUrl = rec?.direct_url;
  if (!currentUrl) return rec;

  const isYouTube = currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be');
  if (!isYouTube) return rec;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(currentUrl)}&format=json`;
    const checkRes = await fetch(oembedUrl, { signal: AbortSignal.timeout(2500) });

    if (checkRes.ok) {
      return rec; // Validated! Real video exists!
    }

    // Broken URL detected (e.g. hallucinated playlist or video ID)!
    console.warn(`[ensureValidCourseUrl] Broken URL detected for "${rec.skill}" (${currentUrl}), auto-healing...`);
    const searchQuery = `${rec.skill} ${rec.course_title} ${rec.instructor_channel || ''} full tutorial course`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(3500),
    });

    if (searchRes.ok) {
      const html = await searchRes.text();
      const match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        const healedUrl = `https://www.youtube.com/watch?v=${match[1]}`;
        console.log(`[ensureValidCourseUrl] Auto-healed "${rec.skill}" -> ${healedUrl}`);
        return {
          ...rec,
          direct_url: healedUrl,
        };
      }
    }
  } catch (err) {
    console.warn(`[ensureValidCourseUrl] Validation error for "${rec.skill}":`, err.message);
  }

  return rec;
}

// Node 6: Course Recommender Agent (Dynamic course discovery with pedagogical evaluation)
async function courseRecommenderNode(state) {
  const { payload } = state;
  const { skills = [], targetRole = '', preferredModel, customApiKey, forceRefresh = false } = payload;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  const rawList = Array.isArray(skills) ? skills : [skills];
  const skillList = rawList
    .map(s => (typeof s === 'string' ? s.trim() : (s?.skill || s?.name || '')).trim())
    .filter(Boolean);

  if (skillList.length === 0) {
    return { result: { recommendations: [] }, agentName: 'GeminiCourseRecommender' };
  }

  // Deduplicate
  const uniqueSkills = [...new Set(skillList)].slice(0, 6);

  // Check cache first (bypass if forceRefresh is true)
  const cachedResults = [];
  const uncachedSkills = [];

  for (const skill of uniqueSkills) {
    const key = skill.toLowerCase();
    if (!forceRefresh && courseCache.has(key)) {
      cachedResults.push(courseCache.get(key));
    } else {
      uncachedSkills.push(skill);
    }
  }

  if (uncachedSkills.length === 0) {
    return { result: { recommendations: cachedResults }, agentName: 'GeminiCourseRecommender' };
  }

  const roleContext = targetRole ? `aiming for "${targetRole}"` : `preparing for campus placement rounds`;
  const prompt = `You are an expert technical educator and placement director.
For each of the following missing skills required for a student ${roleContext}, identify the single highest-rated, pedagogically clearest full course or masterclass video available on YouTube or top open-learning platforms (such as freeCodeCamp, MIT OpenCourseWare, Harvard CS50, Coursera, NPTEL).

Skills to recommend courses for:
${uncachedSkills.map((s, i) => `${i + 1}. ${s}`).join('\n')}

For EACH skill, provide:
1. skill: The exact skill name from the list.
2. course_title: The official title of the course/video.
3. platform: The platform hosting the course (e.g., "YouTube", "freeCodeCamp", "Coursera").
4. instructor_channel: The name of the acclaimed instructor or YouTube channel (e.g. "freeCodeCamp.org", "Abdul Bari", "Kunal Kushwaha", "NeetCode", "ByteByteGo", "Amigoscode", "Telusko", "Traversy Media", "Fireship").
5. direct_url: The direct, verified URL to the full video or playlist (e.g., https://www.youtube.com/watch?v=... or https://www.youtube.com/playlist?list=...). DO NOT provide search query links (no "results?search_query=").
6. duration: Realistic estimated duration (e.g., "5 hours", "8 hours full masterclass", "40-video series").
7. why_recommended: A compelling 2-3 sentence pedagogical explanation of WHY this specific course/instructor explains the concept best (e.g. how they visualize pointers/memory, use animated call stacks, connect theory to interview questions, or provide production-ready code).
8. key_topics: 3-5 core concepts covered in the course that are essential for campus placement tests and technical interviews.
9. difficulty_level: "Beginner", "Beginner to Intermediate", or "Intermediate to Advanced".`;

  try {
    const model = createStructuredModel(apiKey, CoursesListSchema, preferredModel || 'gemini-3.5-flash');
    const response = await model.invoke(prompt);
    const newRecommendations = response?.recommendations || [];

    // Auto-verify and heal any broken or hallucinated YouTube URLs
    const validatedRecommendations = await Promise.all(
      newRecommendations.map(rec => ensureValidCourseUrl(rec))
    );

    for (const rec of validatedRecommendations) {
      if (rec?.skill) {
        courseCache.set(rec.skill.toLowerCase(), rec);
      }
    }

    return {
      result: {
        recommendations: [...cachedResults, ...validatedRecommendations],
      },
      agentName: 'GeminiCourseRecommender',
    };
  } catch (err) {
    console.error('[/api/gemini-agent] Course recommender error:', err.message);
    return {
      result: {
        recommendations: cachedResults,
        error: err.message,
      },
      agentName: 'GeminiCourseRecommender',
    };
  }
}

// Node 7: Skill Certification Exam Agent (10 Dynamic Scenario Questions across 5 Pillars)
async function skillExamValidatorNode(state) {
  const { payload } = state;
  const { skill, difficulty = 'Intermediate', role = '', preferredModel, customApiKey } = payload;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!skill) throw new Error('Skill name is required for skillExam');

  const entropySeed = Math.random().toString(36).substring(2, 10) + '_' + Date.now();

  const prompt = `You are a Principal Technical Interviewer and University Placement Assessor.
Generate an official 10-Question Skill Certification Exam for the skill: "${skill}".

Exam Specifications:
- Skill: "${skill}"
- Target Level: "${difficulty}" (Beginner = Core syntax, primitive types, control flow & fundamentals; Intermediate = Job-ready application, error handling, standard libraries & idioms; Advanced = Concurrency, internals, performance optimization, system design & production pitfalls)
- Target Career Role: "${role || 'Software Engineer'}"
- Dynamic Entropy Seed: ${entropySeed}

Exam Distribution:
Provide EXACTLY 10 multiple-choice questions distributed across these 5 Core Pillars (2 questions per pillar):
1. Pillar 1: Syntax & Idioms (Language basics, typing, control flow, keywords)
2. Pillar 2: OOP & Paradigms (Object-oriented/functional design, inheritance, interfaces, polymorphism, composition)
3. Pillar 3: Collections & Data (Data structures, transformations, immutability, memory allocation)
4. Pillar 4: Concurrency & Async (Threading, async/await, coroutines/promises, race conditions, event loops)
5. Pillar 5: Architecture & Best Practices (Design patterns, clean code, error handling, edge cases, production pitfalls)

Rules:
- Questions must be real-world, practical scenarios or code snippets, NOT trivia or superficial definitions.
- For each question:
  * id: 1 to 10
  * pillar: Exact pillar name (e.g. "Syntax & Idioms", "OOP & Paradigms", "Collections & Data", "Concurrency & Async", "Architecture & Best Practices")
  * question: Clear question text or scenario description
  * codeSnippet: Optional formatted code snippet (or empty string if not code-reading)
  * options: Array of EXACTLY 4 distinct, plausible choices
  * correctAnswerIndex: Integer (0, 1, 2, or 3) indicating the single correct answer
  * explanation: Clear pedagogical explanation of why the correct option is right and why others are wrong
- All questions MUST strictly match the requested difficulty level: ${difficulty}.`;

  const model = createStructuredModel(apiKey, SkillExamSchema, preferredModel || 'gemini-3.5-flash', {
    temperature: 0.85,
    maxOutputTokens: 4000,
  });

  const exam = await model.invoke(prompt);
  return { result: exam, agentName: 'GeminiSkillExamValidator' };
}

// Node 8: Error Handler
function errorHandlerNode(state) {
  return { error: `Unrecognized action: "${state.action}"`, result: null };
}

// ─── BUILD THE LANGGRAPH STATEGRAPH ──────────────────────────────────────────
function buildAgentGraph() {
  const graph = new StateGraph({
    channels: {
      action:    { default: () => '' },
      payload:   { default: () => ({}) },
      userId:    { default: () => '' },
      result:    { default: () => null },
      agentName: { default: () => '' },
      error:     { default: () => null },
    },
  });

  graph.addNode('router',             routerNode);
  graph.addNode('profileAnalyzer',    profileAnalyzerNode);
  graph.addNode('resumeOptimizer',    resumeOptimizerNode);
  graph.addNode('chatTutor',          chatTutorNode);
  graph.addNode('skillValidator',     skillValidatorNode);
  graph.addNode('skillExtractor',     skillExtractorNode);
  graph.addNode('courseRecommender',  courseRecommenderNode);
  graph.addNode('skillExamValidator', skillExamValidatorNode);
  graph.addNode('errorHandler',       errorHandlerNode);

  graph.setEntryPoint('router');

  graph.addConditionalEdges('router', routingFunction, {
    profileAnalyzer:    'profileAnalyzer',
    resumeOptimizer:    'resumeOptimizer',
    chatTutor:          'chatTutor',
    skillValidator:     'skillValidator',
    skillExtractor:     'skillExtractor',
    courseRecommender:  'courseRecommender',
    skillExamValidator: 'skillExamValidator',
    errorHandler:       'errorHandler',
  });

  graph.addEdge('profileAnalyzer',    END);
  graph.addEdge('resumeOptimizer',    END);
  graph.addEdge('chatTutor',          END);
  graph.addEdge('skillValidator',     END);
  graph.addEdge('skillExtractor',     END);
  graph.addEdge('courseRecommender',  END);
  graph.addEdge('skillExamValidator', END);
  graph.addEdge('errorHandler',       END);

  return graph.compile();
}

export const agentGraph = buildAgentGraph();

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'GEMINI_NOT_CONFIGURED', message: 'Gemini API key not configured.' });
  }

  const { action, payload = {} } = req.body || {};
  const userId = payload.userId || 't7_user';

  try {
    const finalState = await agentGraph.invoke({
      action,
      payload,
      userId,
      result: null,
      agentName: '',
      error: null,
    });

    if (finalState.error) {
      return res.status(400).json({ error: finalState.error });
    }

    if (action === 'chatTutor') {
      return res.status(200).json(finalState.result);
    }

    return res.status(200).json({ result: finalState.result, agent: finalState.agentName });

  } catch (err) {
    console.error('[/api/gemini-agent] Unhandled error:', err);

    const isQuotaError = err?.message?.includes('429') ||
                         err?.message?.includes('Too Many Requests') ||
                         err?.message?.includes('quota') ||
                         err?.status === 429;

    if (isQuotaError) {
      return res.status(200).json({
        error: 'QUOTA_EXCEEDED',
        result: null,
        message: 'Gemini API daily quota reached. Analysis will resume once quota resets.',
      });
    }

    return res.status(503).json({ error: 'Agent error', detail: err.message });
  }
}
