/**
 * _langchain/llm.js
 *
 * Shared LangChain LLM factory for T7 Learning Hub.
 *
 * Centralizes:
 *  - Gemini model creation with consistent config
 *  - Model fallback chains (.withFallbacks)
 *  - CORS headers helper
 *  - Text extraction from Base64 (PDF/DOCX/TXT)
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

// ─── Model Registry ───────────────────────────────────────────────────────────
export const MODEL_REGISTRY = {
  'gemini-3.8-flash':       { name: 'Gemini 3.8 Flash',       tag: '🚀 Next-Gen Flagship' },
  'gemini-3.7-flash':       { name: 'Gemini 3.7 Flash',       tag: '⚡ Ultra Fast Reasoning' },
  'gemini-3.1-pro-preview': { name: 'Gemini 3.1 Pro Preview', tag: '🧠 Deep Intelligence' },
  'gemini-3.6-flash':       { name: 'Gemini 3.6 Flash',       tag: '⚖️ Default (Balanced)' },
  'gemini-3.5-flash':       { name: 'Gemini 3.5 Flash',       tag: '⚡ Stable Fallback' },
  'gemini-3.1-flash-lite':  { name: 'Gemini 3.1 Flash-Lite',  tag: '🪶 Ultra Low Latency' },
  'gemini-flash-latest':    { name: 'Gemini Flash (Latest)',   tag: '🔄 Auto-Updated Flash' },
};

// ─── Factory: Single model ────────────────────────────────────────────────────
export function createModel(modelId, apiKey, opts = {}) {
  return new ChatGoogleGenerativeAI({
    model:           modelId,
    apiKey,
    temperature:     opts.temperature     ?? 0.7,
    maxOutputTokens: opts.maxOutputTokens ?? 1024,
    topK:            opts.topK            ?? 40,
    topP:            opts.topP            ?? 0.95,
    ...opts,
  });
}

// ─── Factory: Chat model with automatic fallback ──────────────────────────────
export function createChatModel(primaryModelId, apiKey, opts = {}) {
  const primary  = createModel(primaryModelId,    apiKey, opts);
  const fallback = createModel('gemini-3.5-flash', apiKey, opts);
  return primary.withFallbacks({ fallbacks: [fallback] });
}

// ─── Factory: Structured output model with fallback chain ────────────────────
export function createStructuredModel(apiKey, zodSchema) {
  const ids = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-pro-preview'];
  const [primary, ...rest] = ids.map(id =>
    createModel(id, apiKey, { temperature: 0.1 }).withStructuredOutput(zodSchema)
  );
  return primary.withFallbacks({ fallbacks: rest });
}

// ─── Factory: Deterministic scoring model (temperature=0, no randomness) ─────
// Use this for ATS scoring, quiz grading — anywhere numeric consistency matters.
export function createScoringModel(apiKey, zodSchema) {
  const ids = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-pro-preview'];
  const [primary, ...rest] = ids.map(id =>
    createModel(id, apiKey, {
      temperature: 0,        // ← Fully deterministic: same input = same score
      topK:        1,        // ← Always pick the single most probable token
      topP:        1,        // ← No nucleus sampling randomness
      maxOutputTokens: 2048,
    }).withStructuredOutput(zodSchema)
  );
  return primary.withFallbacks({ fallbacks: rest });
}

// ─── CORS helper ──────────────────────────────────────────────────────────────
export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ─── Text extraction from Base64 ─────────────────────────────────────────────
export async function extractTextFromBase64(base64Data, mimeType = '') {
  if (!base64Data) return '';
  const buffer = Buffer.from(base64Data, 'base64');
  const lower  = String(mimeType).toLowerCase();
  const isWord = ['word', 'officedocument', 'msword', 'docx', 'doc'].some(k => lower.includes(k));

  if (isWord) {
    try {
      const mammoth   = await import('mammoth');
      const extractor = mammoth.default || mammoth;
      const result    = await extractor.extractRawText({ buffer });
      if (result?.value?.trim().length > 20) return result.value.trim();
    } catch (e) { console.warn('[extractText] Mammoth failed:', e.message); }
  }

  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse(new Uint8Array(buffer));
    const doc    = await parser.getText();
    if (doc?.text?.trim().length > 20) return doc.text.trim();
  } catch {
    try {
      const mammoth   = await import('mammoth');
      const extractor = mammoth.default || mammoth;
      const result    = await extractor.extractRawText({ buffer });
      if (result?.value?.trim().length > 20) return result.value.trim();
    } catch (_) {}
  }

  try {
    const printable = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '');
    if (printable.length > 50) return printable.trim();
  } catch (_) {}

  return '';
}
