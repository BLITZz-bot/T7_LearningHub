/**
 * Vercel Serverless Function: /api/quiz
 *
 * Coding Challenge Generator & Evaluator — Migrated to LangChain
 *
 * Key improvements over old quiz.js:
 *  ✅ Structured output (Zod) → no more JSON.parse + markdown stripping
 *  ✅ Type-safe question/evaluation schemas
 *  ✅ Automatic fallback if primary model unavailable
 */

import { z }                          from 'zod';
import { setCors, createStructuredModel } from './_langchain/llm.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────
const QuestionsSchema = z.object({
  questions: z.array(z.object({
    id:           z.number(),
    title:        z.string(),
    description:  z.string(),
    startingCode: z.string(),
    language:     z.enum(['javascript', 'html', 'css', 'python']),
  })).min(1).max(10),
});

const EvaluationSchema = z.object({
  isCorrect:       z.boolean(),
  score:           z.number().min(0).max(100),
  feedback:        z.string(),
  optimalSolution: z.string(),
});

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'GEMINI_NOT_CONFIGURED', message: 'Gemini API key not configured.' });
  }

  const { action, studentContext = {}, submittedCode, question } = req.body || {};
  if (!action) return res.status(400).json({ error: 'action (generate or evaluate) is required' });

  try {

    // ── Generate ───────────────────────────────────────────────────────────────
    if (action === 'generate') {
      const { targetRole, matchedSkills = [], missingSkills = [] } = studentContext;
      const skillsHave    = Array.isArray(matchedSkills) ? matchedSkills.join(', ') : matchedSkills;
      const skillsMissing = Array.isArray(missingSkills) ? missingSkills.join(', ') : missingSkills;

      const prompt = `You are an expert technical interviewer and mentor.
The student is training for: ${targetRole || 'Full Stack Developer'}
Skills they already know: ${skillsHave || 'HTML, CSS'}
Skills they are currently learning: ${skillsMissing || 'JavaScript, React'}

Generate 5 coding challenges:
- 3 should focus on their CURRENT learning goals (the skills they are learning)
- 2 should test their EXISTING knowledge (spaced repetition)

For each challenge provide:
- id: sequential number (1-5)
- title: short descriptive title
- description: clear problem statement with constraints
- startingCode: a starter code scaffold (function/class stub with comments)
- language: one of javascript, html, css, or python (based on the challenge)`;

      const model  = createStructuredModel(GEMINI_API_KEY, QuestionsSchema);
      const result = await model.invoke(prompt);

      return res.status(200).json({ questions: result.questions });

    // ── Evaluate ───────────────────────────────────────────────────────────────
    } else if (action === 'evaluate') {
      if (!submittedCode || !question) {
        return res.status(400).json({ error: 'submittedCode and question are required for evaluation' });
      }

      const prompt = `You are an expert code evaluator.
Review the submitted code for this problem.

Problem Title: ${question.title}
Problem Description: ${question.description}

User's Submitted Code:
${submittedCode}

Evaluate the logic thoroughly. Check for correctness, edge cases, and code quality.
Provide:
- isCorrect: whether the solution correctly solves the problem
- score: 0-100 based on correctness, efficiency, and code quality
- feedback: specific, constructive feedback explaining what went right or wrong
- optimalSolution: the best/cleanest way to write this solution`;

      const model      = createStructuredModel(GEMINI_API_KEY, EvaluationSchema);
      const evaluation = await model.invoke(prompt);

      return res.status(200).json(evaluation);

    } else {
      return res.status(400).json({ error: 'Invalid action. Use "generate" or "evaluate".' });
    }

  } catch (err) {
    console.error('[/api/quiz] Error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
