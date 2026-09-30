/**
 * Vercel Serverless Function: /api/gemini-ats
 *
 * T7 ATS Resume Analyzer — LangChain + Gemini
 *
 *  ✅ .withStructuredOutput(schema) → type-safe structured JSON from Gemini
 *  ✅ .withFallbacks([...])         → automatic model fallback chain
 *  ✅ createScoringModel (temp=0)   → deterministic scores, no variance
 *  ✅ Explicit rubric in prompt     → consistent criteria every call
 *  ✅ Nullable Zod schema           → no hardcoded placeholder scores
 *  ✅ Auto-repair on parse error    → retry with repair prompt before giving up
 *  ✅ Graceful degradation fallback → never crash with a blank screen
 */

import { z }      from 'zod';
import { ZodError } from 'zod';
import { setCors, extractTextFromBase64, createScoringModel } from './_langchain/llm.js';

// ─── ATS Schema ───────────────────────────────────────────────────────────────
// All score fields are nullable so we never return a fake/hardcoded number.
// .catch(null) → if Gemini returns the wrong type, safely fall back to null.
// .optional()  → field is allowed to be absent in the model response.
const ATSSchema = z.object({
  target_role_detected:  z.string().optional().default('Unknown Role'),

  ats_parseability:      z.number().int().min(0).max(100).nullable().catch(null).optional(),
  impact_quantification: z.number().int().min(0).max(100).nullable().catch(null).optional(),
  skill_match:           z.number().int().min(0).max(100).nullable().catch(null).optional(),
  formatting_quality:    z.number().int().min(0).max(100).nullable().catch(null).optional(),
  overall_readiness:     z.number().int().min(0).max(100).nullable().catch(null).optional(),

  reality_check_message: z.string().optional().default(''),

  matched_skills:       z.array(z.string()).optional().default([]),
  missing_skills:       z.array(z.string()).optional().default([]),
  soft_skills_detected: z.array(z.string()).optional().default([]),

  score_breakdown: z.object({
    ats_parseability_reason:      z.string().optional().default(''),
    impact_quantification_reason: z.string().optional().default(''),
    skill_match_reason:           z.string().optional().default(''),
    formatting_quality_reason:    z.string().optional().default(''),
  }).optional().default({
    ats_parseability_reason:      '',
    impact_quantification_reason: '',
    skill_match_reason:           '',
    formatting_quality_reason:    '',
  }),
});

// ─── Graceful Fallback (only returned when ALL model calls fail) ──────────────
// All scores are null — never show fake/invented numbers to the student.
const GRACEFUL_FALLBACK = (targetRoleText, reason = '') => ({
  target_role_detected:  targetRoleText || 'Unknown Role',
  ats_parseability:      null,
  impact_quantification: null,
  skill_match:           null,
  formatting_quality:    null,
  overall_readiness:     null,
  reality_check_message: reason
    ? `Analysis could not be completed. Error: ${reason}`
    : 'Analysis could not be completed. Please re-upload your resume or try again.',
  matched_skills:       [],
  missing_skills:       [],
  soft_skills_detected: [],
  score_breakdown: {
    ats_parseability_reason:      '',
    impact_quantification_reason: '',
    skill_match_reason:           '',
    formatting_quality_reason:    '',
  },
  score:          null,
  summary:        'ATS analysis could not be completed.',
  action_plan:    'Please check your Gemini API key and quota, then try again.',
  agent:          'GeminiATSAnalyzer',
  partial_result: true,
  failure_reason: reason,
});

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'GEMINI_NOT_CONFIGURED', message: 'Gemini API key missing.' });
  }

  const { payload = {} } = req.body || {};
  const { resumeBase64, mimeType, targetRole, studentContext = {}, preferredModel, customApiKey } = payload;

  if (!resumeBase64) return res.status(400).json({ error: 'resumeBase64 is required' });

  try {
    // 1. Extract text from uploaded file
    const extractedText = await extractTextFromBase64(resumeBase64, mimeType);
    if (!extractedText) {
      return res.status(400).json({ error: 'Failed to extract readable text from the document.' });
    }

    const { cgpa, year, branch } = studentContext;
    const targetRoleText = targetRole
      ? `"${targetRole}"`
      : (branch ? `a role inferred from the student's branch (${branch}) and resume content` : 'a best-fit role from resume content');

    // 2. Build prompt with EXPLICIT DETERMINISTIC RUBRIC
    //    Giving the model exact criteria eliminates score variance between identical runs.
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
${extractedText.slice(0, 15000)}`;

    // 3. Deterministic scoring model — temperature=0, topK=1 → same input = same score
    const model = createScoringModel(customApiKey || GEMINI_API_KEY, ATSSchema, preferredModel);

    let result;

    // ── Layer 1 + 2: Try primary call, auto-repair on ZodError ────────────────
    try {
      // Layer 1: Forgiving schema absorbs minor field type mismatches via .catch()
      result = await model.invoke(prompt);

    } catch (firstErr) {
      const isSchemaError = firstErr instanceof ZodError ||
                            firstErr?.name === 'ZodError' ||
                            firstErr?.message?.includes('ZodError') ||
                            firstErr?.message?.includes('validation') ||
                            firstErr?.name === 'OutputParserException' ||
                            firstErr?.message?.includes('OUTPUT_PARSING_FAILURE');

      if (isSchemaError) {
        // ── Layer 2: AUTO-REPAIR ───────────────────────────────────────────────
        // Gemini produced output that violated the schema even after .catch() defaults.
        // Send the broken raw output back to Gemini and ask it to fix exactly what's wrong.
        console.warn('[/api/gemini-ats] Schema validation failed, attempting auto-repair...', firstErr.message);
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
          console.info('[/api/gemini-ats] Auto-repair succeeded ✅');
        } catch (repairErr) {
          // ── Layer 3: GRACEFUL DEGRADATION ─────────────────────────────────
          // Both attempts failed. Return safe defaults with partial_result flag.
          // Student sees a helpful message, not a blank crash screen.
          console.error('[/api/gemini-ats] Auto-repair also failed, returning graceful fallback:', repairErr.message);
          return res.status(200).json({
            result: GRACEFUL_FALLBACK(targetRoleText, repairErr.message),
          });
        }
      } else {
        console.warn('[/api/gemini-ats] Model execution issue, returning graceful fallback:', firstErr.message);
        return res.status(200).json({
          result: GRACEFUL_FALLBACK(targetRoleText, firstErr.message),
        });
      }
    }

    return res.status(200).json({
      result: {
        ...result,
        score:          result.overall_readiness ?? null,
        summary:        result.reality_check_message || '',
        action_plan:    result.reality_check_message || '',
        agent:          'GeminiATSAnalyzer',
        partial_result: false,
      },
    });

  } catch (err) {
    // Detect quota / rate-limit errors — return graceful 200 instead of crashing with 500
    const isQuotaError = err?.message?.includes('429') ||
                         err?.message?.includes('Too Many Requests') ||
                         err?.message?.includes('quota') ||
                         err?.message?.includes('rate') ||
                         err?.status === 429;

    if (isQuotaError) {
      console.warn('[/api/gemini-ats] Quota exhausted across all models, returning graceful fallback.');
      return res.status(200).json({
        result: GRACEFUL_FALLBACK(
          targetRoleText,
          'Gemini API daily quota reached (free tier: 20 req/day). Analysis will resume once quota resets. You can add a paid API key in Settings to remove this limit.'
        ),
      });
    }

    // Auth / network / unexpected errors → return as 503 so the client knows it is a server issue
    console.error('[/api/gemini-ats] Fatal error:', err);
    return res.status(503).json({
      error:   err.message || 'Internal Server Error',
      code:    err.name    || 'UNKNOWN_ERROR',
    });
  }
}


