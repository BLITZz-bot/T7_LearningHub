/**
 * Vercel Serverless Function: /api/gemini-ats
 *
 * T7 ATS Resume Analyzer — Delegated to LangGraph Multi-Agent Orchestrator
 *
 * Forwards requests directly to the `resumeOptimizer` node in `agentGraph`.
 * Preserves 100% backward compatibility for all existing clients.
 */

import { setCors } from './_langchain/llm.js';
import { agentGraph } from './gemini-agent.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'GEMINI_NOT_CONFIGURED', message: 'Gemini API key missing.' });
  }

  const { payload = {} } = req.body || {};
  const userId = payload.userId || 't7_user';

  try {
    const finalState = await agentGraph.invoke({
      action: 'analyzeResume',
      payload,
      userId,
      result: null,
      agentName: '',
      error: null,
    });

    if (finalState.error) {
      return res.status(400).json({ error: finalState.error });
    }

    return res.status(200).json({
      result: finalState.result,
      agent: finalState.agentName,
    });

  } catch (err) {
    console.error('[/api/gemini-ats] Adapter error:', err);
    return res.status(503).json({
      error: err.message || 'Internal Server Error',
      code: err.name || 'UNKNOWN_ERROR',
    });
  }
}
