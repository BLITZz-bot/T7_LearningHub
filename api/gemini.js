/**
 * Vercel Serverless Function: /api/gemini
 *
 * T7 AI Mentor Chatbot & Skill Scraper — Delegated to LangGraph Multi-Agent Orchestrator
 *
 * Forwards chat messages to `chatTutor` node and job scraping to `skillExtractor` node in `agentGraph`.
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
  const isScraper = body.action === 'scrape_and_extract_skills';
  const action = isScraper ? 'scrapeSkills' : 'chatTutor';
  const userId = body.studentContext?.userId || 't7_user';

  try {
    const finalState = await agentGraph.invoke({
      action,
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
    console.error('[/api/gemini] Adapter error:', err);
    return res.status(500).json({ error: 'Gemini request failed', detail: err.message });
  }
}
