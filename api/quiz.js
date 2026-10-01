/**
 * Vercel Serverless Function: /api/quiz
 *
 * Coding Challenge Generator & Evaluator — Delegated to LangGraph Multi-Agent Orchestrator
 *
 * Forwards quiz generation & code evaluation to `skillValidator` node in `agentGraph`.
 * Preserves 100% backward compatibility for all existing clients.
 */

import { setCors } from './_langchain/llm.js';
import { agentGraph } from './gemini-agent.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'GEMINI_NOT_CONFIGURED', message: 'Gemini API key not configured.' });
  }

  const body = req.body || {};
  const { action } = body;
  if (!action) return res.status(400).json({ error: 'action (generate or evaluate) is required' });

  const userId = body.studentContext?.userId || 't7_user';

  try {
    const finalState = await agentGraph.invoke({
      action: 'quiz',
      payload: body,
      userId,
      result: null,
      agentName: '',
      error: null,
    });

    if (finalState.error) {
      return res.status(400).json({ error: finalState.error });
    }

    return res.status(200).json(finalState.result);

  } catch (err) {
    console.error('[/api/quiz] Adapter error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
