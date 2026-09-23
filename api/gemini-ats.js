/**
 * Vercel Serverless Function: /api/gemini-ats
 *
 * T7 ATS Resume Analyzer — Migrated to LangChain
 *
 * Key improvements over old gemini-ats.js:
 *  ✅ .withStructuredOutput(schema)    → no more JSON.parse + markdown stripping
 *  ✅ .withFallbacks([...])            → replaces the manual for-loop fallback
 *  ✅ createScoringModel (temp=0)      → deterministic scores, no 2-5pt drift
 *  ✅ Explicit scoring rubric in prompt → consistent criteria across all calls
 *  ✅ Forgiving Zod schema (.default)  → partial outputs patched, not rejected
 *  ✅ Auto-repair retry on ZodError    → second chance before giving up
 *  ✅ Graceful degradation fallback    → student never sees a blank crash screen
 */

import { z }                          from 'zod';
import { ZodError }                   from 'zod';
import { setCors, extractTextFromBase64, createScoringModel } from './_langchain/llm.js';

// ─── Layer 1: FORGIVING Schema ────────────────────────────────────────────────
// .default() → if Gemini omits a field, use a safe value instead of throwing.
// .catch()   → if a field has the wrong type (e.g. string instead of int),
//              recover with the default instead of crashing the whole request.
const ATSSchema = z.object({
  target_role_detected:  z.string()
                          .catch('Role not detected')
                          .default('Role not detected')
                          .describe('The role being analyzed for'),

  ats_parseability:      z.number().int().min(0).max(100)
                          .catch(50).default(50)
                          .describe('ATS parseability score 0-100'),

  impact_quantification: z.number().int().min(0).max(100)
                          .catch(50).default(50)
                          .describe('Quantified impact score 0-100'),

  skill_match:           z.number().int().min(0).max(100)
                          .catch(50).default(50)
                          .describe('Skill match % against role requirements'),

  formatting_quality:    z.number().int().min(0).max(100)
                          .catch(50).default(50)
                          .describe('Formatting and structure score 0-100'),

  overall_readiness:     z.number().int().min(0).max(100)
                          .catch(50).default(50)
                          .describe('Weighted overall readiness score 0-100'),

  reality_check_message: z.string()
                          .catch('Analysis completed. Please review your scores above.')
                          .default('Analysis completed. Please review your scores above.')
                          .describe('Personalized career advice paragraph'),

  matched_skills:        z.array(z.string()).catch([]).default([])
                          .describe('Skills found in resume that match the target role'),

  missing_skills:        z.array(z.string()).catch([]).default([])
                          .describe('Important skills for the role not found in resume'),

  soft_skills_detected:  z.array(z.string()).catch([]).default([])
                          .describe('Soft skills detected in resume content'),

  score_breakdown:       z.object({
    ats_parseability_reason:      z.string().catch('').default(''),
    impact_quantification_reason: z.string().catch('').default(''),
    skill_match_reason:           z.string().catch('').default(''),
    formatting_quality_reason:    z.string().catch('').default(''),
  }).catch({
    ats_parseability_reason:      '',
    impact_quantification_reason: '',
    skill_match_reason:           '',
    formatting_quality_reason:    '',
  }).default({
    ats_parseability_reason:      '',
    impact_quantification_reason: '',
    skill_match_reason:           '',
    formatting_quality_reason:    '',
  }).describe('One-sentence rationale for each numeric score'),
});

// ─── Layer 3: Safe Defaults (used if ALL retries fail) ───────────────────────
// Returns a meaningful "we tried but couldn't score precisely" response
// instead of a blank 500 error screen.
const GRACEFUL_FALLBACK = (targetRoleText, reason = '') => ({
  target_role_detected:  targetRoleText || 'Unknown Role',
  ats_parseability:      null,
  impact_quantification: null,
  skill_match:           null,
  formatting_quality:    null,
  overall_readiness:     null,
  reality_check_message: 'We were unable to complete the full ATS analysis at this time. Please try re-uploading your resume or try again in a moment.',
  matched_skills:        [],
  missing_skills:        [],
  soft_skills_detected:  [],
  score_breakdown:       { ats_parseability_reason: '', impact_quantification_reason: '', skill_match_reason: '', formatting_quality_reason: '' },
  score:                 null,
  summary:               'Analysis could not be completed. Please try again.',
  action_plan:           'Try re-uploading your resume in PDF format.',
  agent:                 'GeminiATSAnalyzer',
  partial_result:        true,   // ← frontend can check this flag to show a warning
  failure_reason:        reason, // ← useful for debugging in LangSmith / logs
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
  const { resumeBase64, mimeType, targetRole, studentContext = {} } = payload;

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
    const model = createScoringModel(GEMINI_API_KEY, ATSSchema);

    let result;

    // ── Layer 1 + 2: Try primary call, auto-repair on ZodError ────────────────
    try {
      // Layer 1: Forgiving schema absorbs minor field type mismatches via .catch()
      result = await model.invoke(prompt);

    } catch (firstErr) {
      const isSchemaError = firstErr instanceof ZodError ||
                            firstErr?.name === 'ZodError' ||
                            firstErr?.message?.includes('ZodError') ||
                            firstErr?.message?.includes('validation');

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
        // Not a schema error (e.g. network issue, API key problem) — re-throw for proper 500
        throw firstErr;
      }
    }

    return res.status(200).json({
      result: {
        ...result,
        score:       result.overall_readiness ?? 0,
        summary:     result.reality_check_message || '',
        action_plan: result.reality_check_message || '',
        agent:       'GeminiATSAnalyzer',
        partial_result: false, // ← explicitly mark as a full successful result
      },
    });

  } catch (err) {
    // Only non-schema errors reach here (auth failures, network timeouts, etc.)
    console.error('[/api/gemini-ats] Fatal error:', err);
    return res.status(500).json({
      error:   err.message || 'Internal Server Error',
      code:    err.name    || 'UNKNOWN_ERROR',
    });
  }
}


