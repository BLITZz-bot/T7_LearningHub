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

async function saveToDashboard({ accountId, analysis, videoId, title }) {
  if (!accountId) throw new Error('Account ID is required');

  const projectId = 't7-learning-hub';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${accountId}/videoLearning`;

  // Use skills from Gemini analysis (or fallback to empty)
  const topSkills = Array.isArray(analysis.skills) 
    ? analysis.skills.filter(s => typeof s === 'string' && s.length > 1).slice(0, 5)
    : [];

  const body = {
    fields: {
      videoId: { stringValue: videoId },
      title: { stringValue: title },
      date: { timestampValue: new Date().toISOString() },
      rating: { doubleValue: parseFloat(analysis.rating) || 0 },
      relevance: { doubleValue: parseFloat(analysis.relevance) || 0 },
      summary: { stringValue: analysis.summary || '' },
      topSkills: {
        arrayValue: {
          values: topSkills.map(s => ({ stringValue: s }))
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

async function callGemini({ prompt, key, systemPrompt }) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
  };
  if (systemPrompt) {
    body.system_instruction = { parts: [{ text: systemPrompt }] };
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text };
}

async function getYouTubeTranscript(videoId) {
  // Fetch timedtext from YouTube
  try {
    const listUrl = `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`;
    const listRes = await fetch(listUrl);
    const listText = await listRes.text();
    // Parse available transcript languages
    const langMatch = listText.match(/lang_code="([^"]+)"/);
    const lang = langMatch ? langMatch[1] : 'en';
    const transcriptUrl = `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=json3`;
    const tRes = await fetch(transcriptUrl);
    const tData = await tRes.json();
    if (tData.events) {
      const segments = tData.events
        .filter(e => e.segs)
        .map(e => ({
          start: e.tStartMs / 1000,
          text: e.segs.map(s => s.utf8).join('').replace(/\n/g, ' ').trim()
        }))
        .filter(s => s.text && s.text !== ' ');
      return { segments };
    }
    return { segments: [] };
  } catch (e) {
    return { segments: [] };
  }
}
