// T7 Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('T7 installed');
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GEMINI_REQUEST') {
    callGemini(msg.payload).then(sendResponse).catch(e => sendResponse({ error: e.message }));
    return true; // keep channel open for async
  }
  if (msg.type === 'GET_TRANSCRIPT') {
    getYouTubeTranscript(msg.videoId).then(sendResponse).catch(e => sendResponse({ error: e.message }));
    return true;
  }
  if (msg.type === 'SAVE_TO_DASHBOARD') {
    saveToDashboard(msg.payload).then(sendResponse).catch(e => sendResponse({ error: e.message }));
    return true;
  }
});

async function saveToDashboard({ accountId, analysis, videoId, title, projectId }) {
  if (!accountId) throw new Error('Account ID is required');

  const pId = projectId || 't7-learning-hub';
  const url = `https://firestore.googleapis.com/v1/projects/${pId}/databases/(default)/documents/users/${accountId}/videoLearning`;

  // Skills — up to 10 strings
  const topSkills = Array.isArray(analysis.skills)
    ? analysis.skills.filter(s => typeof s === 'string' && s.length > 1).slice(0, 10)
    : [];

  // Highlights — up to 10 {time, text} objects
  const highlights = Array.isArray(analysis.highlights)
    ? analysis.highlights.filter(h => h && h.time && h.text).slice(0, 10)
    : [];

  const body = {
    fields: {
      videoId:          { stringValue: videoId || '' },
      title:            { stringValue: title || '' },
      date:             { timestampValue: new Date().toISOString() },
      rating:           { doubleValue: parseFloat(analysis.rating) || 0 },
      relevance:        { doubleValue: parseFloat(analysis.relevance) || 0 },
      summary:          { stringValue: analysis.summary || '' },
      durationSeconds:  { integerValue: parseInt(analysis.durationSeconds) || 0 },
      topSkills: {
        arrayValue: {
          values: topSkills.map(s => ({ stringValue: s }))
        }
      },
      highlights: {
        arrayValue: {
          values: highlights.map(h => ({
            mapValue: {
              fields: {
                time: { stringValue: h.time },
                text: { stringValue: h.text }
              }
            }
          }))
        }
      }
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Firestore error ${res.status}`);
  }

  return { success: true };
}


async function callGemini({ prompt, key, systemPrompt, model }) {
  if (!key) throw new Error('Gemini API key is required');

  const targetModels = [];
  if (model && model !== 'auto') {
    targetModels.push(model);
  }

  const fallbacks = [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ];

  for (const fb of fallbacks) {
    if (!targetModels.includes(fb)) {
      targetModels.push(fb);
    }
  }

  let lastError = null;

  for (const targetModel of targetModels) {
    try {
      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
      };
      if (systemPrompt) {
        body.system_instruction = { parts: [{ text: systemPrompt }] };
      }
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return { text };
      }
      const err = await res.json().catch(() => ({}));
      lastError = new Error(err?.error?.message || `API error ${res.status} on model ${targetModel}`);
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

// ─────────────────────────────────────────────────────────────────────────────
//  TRANSCRIPT FETCHER — Full extraction, no segment cap, multi-language fallback
// ─────────────────────────────────────────────────────────────────────────────
async function getYouTubeTranscript(videoId) {
  try {
    // Step 1: Fetch the list of available caption tracks
    const listUrl = `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`;
    const listRes = await fetch(listUrl);
    const listText = await listRes.text();

    // Step 2: Build a priority fallback chain of languages to try
    // Order: any detected manual lang → English → English-US → auto-generated (asr)
    const detectedLangs = [...listText.matchAll(/lang_code="([^"]+)"/g)].map(m => m[1]);
    const isAsr = listText.includes('kind="asr"') || listText.includes('v:kind="asr"');

    // Build fallback chain: manual langs first, then en/en-US, then asr
    const langChain = [...new Set([...detectedLangs, 'en', 'en-US'])];
    const fetchAttempts = langChain.map(lang => ({ lang, asr: false }));
    if (isAsr || detectedLangs.length === 0) {
      fetchAttempts.push({ lang: 'en', asr: true });
    }

    // Step 3: Try each language until we get transcript events
    for (const attempt of fetchAttempts) {
      const url = attempt.asr
        ? `https://www.youtube.com/api/timedtext?lang=${attempt.lang}&v=${videoId}&fmt=json3&kind=asr`
        : `https://www.youtube.com/api/timedtext?lang=${attempt.lang}&v=${videoId}&fmt=json3`;

      try {
        const tRes = await fetch(url);
        if (!tRes.ok) continue;
        const tData = await tRes.json();

        if (tData.events && tData.events.length > 0) {
          // Extract ALL segments — no slice cap
          const segments = tData.events
            .filter(e => e.segs && e.tStartMs !== undefined)
            .map(e => ({
              start: Math.round(e.tStartMs / 100) / 10, // seconds, 1 decimal
              dur: e.dDurationMs ? Math.round(e.dDurationMs / 100) / 10 : 0,
              text: e.segs.map(s => s.utf8 || '').join('').replace(/\n/g, ' ').trim()
            }))
            .filter(s => s.text && s.text.length > 1);

          // Calculate total duration from last segment
          const lastSeg = segments[segments.length - 1];
          const durationSeconds = lastSeg ? Math.round(lastSeg.start + lastSeg.dur) : 0;

          return {
            segments,
            totalSegments: segments.length,
            durationSeconds,
            lang: attempt.lang,
            isAsr: attempt.asr
          };
        }
      } catch (_) {
        // Try next language in chain
        continue;
      }
    }

    // No captions found at all
    return { segments: [], totalSegments: 0, durationSeconds: 0, lang: null, isAsr: false };
  } catch (e) {
    return { segments: [], totalSegments: 0, durationSeconds: 0, lang: null, isAsr: false };
  }
}

