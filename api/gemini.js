/**
 * Vercel Serverless Function: /api/gemini
 * 
 * Secure server-side proxy for all Google Gemini AI calls.
 * The GEMINI_API_KEY is stored as a server-only env var (no VITE_ prefix)
 * and is NEVER sent to the browser.
 * 
 * Supported actions (POST body):
 *   { action: 'generateContent', payload: { prompt, parts, preferredModel, customApiKey } }
 *   { action: 'chatMessage',     payload: { messages, systemPrompt, preferredModel, customApiKey } }
 *   { action: 'analyzeAts',      payload: { prompt, fileBase64, mimeType, preferredModel, customApiKey } }
 *   { action: 'listModels',      payload: { customApiKey } }
 *   { action: 'verifyKey',       payload: { customApiKey } }
 */

export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { action, payload = {} } = req.body || {};

  // Use user-provided key (from their profile settings) or fall back to server env key
  const serverKey = process.env.GEMINI_API_KEY || '';
  const activeKey = (payload.customApiKey && payload.customApiKey.trim().length > 10)
    ? payload.customApiKey.trim()
    : serverKey;

  if (!activeKey && action !== 'verifyKey') {
    return res.status(503).json({
      error: 'Gemini API key is not configured on the server. Please add your key in Profile Settings.'
    });
  }

  const FALLBACK_MODELS = [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ];

  try {
    // ----------------------------------------------------------------
    // ACTION: listModels — List available Gemini models
    // ----------------------------------------------------------------
    if (action === 'listModels') {
      const keyToUse = payload.customApiKey?.trim() || activeKey;
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${keyToUse}`;
      const r = await fetch(url);
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        return res.status(r.status).json({ error: err?.error?.message || 'Failed to list models' });
      }
      const data = await r.json();
      return res.status(200).json(data);
    }

    // ----------------------------------------------------------------
    // ACTION: verifyKey — Validate a Gemini API key
    // ----------------------------------------------------------------
    if (action === 'verifyKey') {
      const keyToVerify = payload.customApiKey?.trim();
      if (!keyToVerify || keyToVerify.length < 10) {
        return res.status(400).json({ valid: false, error: 'API key is too short or empty' });
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${keyToVerify}`;
      const r = await fetch(url);
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        return res.status(200).json({ valid: false, error: err?.error?.message || 'Invalid API key' });
      }
      const data = await r.json();
      return res.status(200).json({ valid: true, totalModels: data?.models?.length || 0 });
    }

    // ----------------------------------------------------------------
    // ACTION: generateContent — Skill gap & ATS analysis
    // ----------------------------------------------------------------
    if (action === 'generateContent' || action === 'analyzeAts') {
      const { prompt, fileBase64, mimeType, preferredModel } = payload;
      if (!prompt) return res.status(400).json({ error: 'prompt is required' });

      const models = preferredModel && preferredModel !== 'auto'
        ? [preferredModel, ...FALLBACK_MODELS.filter(m => m !== preferredModel)]
        : FALLBACK_MODELS;

      let lastErr = null;
      for (const model of models) {
        try {
          const parts = [{ text: prompt }];
          if (fileBase64 && mimeType) {
            parts.push({ inlineData: { mimeType, data: fileBase64 } });
          }

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] }),
          });

          if (!r.ok) {
            const errData = await r.json().catch(() => ({}));
            const msg = errData?.error?.message || `Model ${model} returned ${r.status}`;
            lastErr = new Error(msg);
            continue;
          }

          const data = await r.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (!text) { lastErr = new Error(`Empty response from ${model}`); continue; }

          return res.status(200).json({ text, model });
        } catch (e) {
          lastErr = e;
        }
      }
      return res.status(502).json({ error: lastErr?.message || 'All Gemini models failed' });
    }

    // ----------------------------------------------------------------
    // ACTION: chatMessage — Chatbot conversation
    // ----------------------------------------------------------------
    if (action === 'chatMessage') {
      const { messages, systemPrompt, preferredModel } = payload;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'messages array is required' });
      }

      const models = preferredModel && preferredModel !== 'auto'
        ? [preferredModel, ...FALLBACK_MODELS.filter(m => m !== preferredModel)]
        : FALLBACK_MODELS;

      // Build history for multi-turn chat
      const rawHistory = messages.slice(0, -1);
      const firstUserIdx = rawHistory.findIndex(m => m.role === 'user');
      const trimmedHistory = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

      const history = [];
      for (const msg of trimmedHistory) {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        if (history.length === 0) {
          if (role === 'user') history.push({ role, parts: [{ text: msg.content }] });
        } else {
          const last = history[history.length - 1];
          if (last.role === role) { last.parts[0].text += `\n${msg.content}`; }
          else { history.push({ role, parts: [{ text: msg.content }] }); }
        }
      }
      if (history.length > 0 && history[history.length - 1].role === 'user') {
        history.push({ role: 'model', parts: [{ text: 'Understood.' }] });
      }

      const lastMessage = messages[messages.length - 1];
      let lastErr = null;

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
          const body = {
            system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
            contents: [
              ...history,
              { role: 'user', parts: [{ text: lastMessage.content }] }
            ],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024, topP: 0.95, topK: 40 }
          };

          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!r.ok) {
            const errData = await r.json().catch(() => ({}));
            lastErr = new Error(errData?.error?.message || `Model ${model} returned ${r.status}`);
            if (r.status === 400 && errData?.error?.message?.includes('API_KEY_INVALID')) {
              return res.status(401).json({ error: 'Invalid Gemini API Key. Please verify your key in profile settings.' });
            }
            continue;
          }

          const data = await r.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (!text) { lastErr = new Error(`Empty response from ${model}`); continue; }
          return res.status(200).json({ text, model });
        } catch (e) {
          lastErr = e;
        }
      }
      return res.status(502).json({ error: lastErr?.message || 'Could not connect to Gemini API. Check your API key or try again later.' });
    }

    return res.status(400).json({ error: `Unknown action: "${action}"` });

  } catch (err) {
    console.error('[/api/gemini] Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
