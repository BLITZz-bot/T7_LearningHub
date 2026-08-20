// T7 Popup JS

const GOALS = {
  frontend: { label: 'Frontend Dev', topics: ['html','css','javascript','react','vue','angular','typescript','tailwind','responsive','web','frontend','ui','dom','browser','next','svelte','remix','nuxt'] },
  backend:  { label: 'Backend Dev',  topics: ['node','python','java','api','server','database','sql','mongodb','express','django','rest','graphql','backend','microservice','spring','flask','fastapi','php','ruby'] },
  data:     { label: 'Data Science', topics: ['python','pandas','numpy','ml','machine learning','deep learning','tensorflow','pytorch','data','statistics','visualization','jupyter','sklearn','nlp','ai','llm','neural'] },
  design:   { label: 'UI/UX Design', topics: ['figma','design','ux','ui','prototype','wireframe','user experience','typography','color','adobe','interface','sketch','usability','accessibility','branding'] },
  devops:   { label: 'DevOps/Cloud', topics: ['docker','kubernetes','aws','azure','gcp','ci/cd','jenkins','terraform','linux','nginx','deploy','cloud','devops','ansible','helm','prometheus','grafana'] },
  general:  { label: 'General',      topics: [] }
};

let state = {
  geminiKey: '',
  goal: null,
  autoRate: true,
  summaryLang: 'English',
  accountId: '',
  projectId: 't7-learning-hub',
  currentVideo: null,
  transcript: [],
  analysisData: null,
  chatHistory: []
};

// ────────────────────────────────────────
//  INIT
// ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await detectCurrentVideo();
  bindAllEventListeners();
});

function bindAllEventListeners() {
  // Nav buttons (page switching)
  document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page, btn));
  });

  // Analyze button
  const analyzeBtn = document.getElementById('analyze-btn');
  if (analyzeBtn) analyzeBtn.addEventListener('click', analyzeCurrentVideo);

  // Tab pills
  document.querySelectorAll('.tab-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const tabMatch = pill.textContent.trim().toLowerCase();
      switchTab(tabMatch, pill);
    });
  });

  // Copy Summary button
  const copySummaryBtn = document.querySelector('#tab-summary .outline-btn');
  if (copySummaryBtn) copySummaryBtn.addEventListener('click', () => copyText('summary-text'));

  // Ask Follow-up button
  const followUpBtns = document.querySelectorAll('#tab-summary .outline-btn');
  if (followUpBtns[1]) followUpBtns[1].addEventListener('click', () => switchTab('chat', null));

  // Transcript export buttons
  const exportBtns = document.querySelectorAll('#tab-transcript .export-btn');
  if (exportBtns[0]) exportBtns[0].addEventListener('click', () => exportTranscript('txt'));
  if (exportBtns[1]) exportBtns[1].addEventListener('click', () => exportTranscript('srt'));
  if (exportBtns[2]) exportBtns[2].addEventListener('click', () => copyTranscript());

  // Subtitles
  const genSubBtn = document.querySelector('#tab-subtitles .primary-btn');
  if (genSubBtn) genSubBtn.addEventListener('click', generateSubtitles);
  const subExportBtns = document.querySelectorAll('#tab-subtitles .export-btn');
  if (subExportBtns[0]) subExportBtns[0].addEventListener('click', () => exportSubtitles('srt'));
  if (subExportBtns[1]) subExportBtns[1].addEventListener('click', () => exportSubtitles('txt'));

  // Chat
  const chatSendBtn = document.querySelector('.chat-send');
  if (chatSendBtn) chatSendBtn.addEventListener('click', sendChat);
  const chatInput = document.getElementById('chat-input');
  if (chatInput) chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

  // Quick ask buttons
  document.querySelectorAll('#tab-chat .outline-btn').forEach(btn => {
    btn.addEventListener('click', () => quickAsk(btn.textContent.trim() === 'Main points' ? 'Summarize the main points' : btn.textContent.trim() === 'Prerequisites' ? 'What are the prerequisites?' : 'Give me a study plan based on this'));
  });

  // YouTube Search
  const ytSearchBtn = document.getElementById('yt-search-btn');
  if (ytSearchBtn) ytSearchBtn.addEventListener('click', ytSearch);
  const ytSearchInput = document.getElementById('yt-search-input');
  if (ytSearchInput) ytSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') ytSearch(); });

  // Goal cards
  document.querySelectorAll('.goal-card[data-goal]').forEach(card => {
    card.addEventListener('click', () => selectGoal(card.dataset.goal, card));
  });

  // Save settings button
  const saveBtn = document.querySelector('.save-btn');
  if (saveBtn) saveBtn.addEventListener('click', saveSettings);

  // Sync to Dashboard button
  const syncBtn = document.getElementById('sync-btn');
  if (syncBtn) syncBtn.addEventListener('click', syncToDashboard);

  // API key input
  const apiInput = document.getElementById('api-key-input');
  if (apiInput) apiInput.addEventListener('input', updateKeyStatus);

  // Account ID input
  const accInput = document.getElementById('account-id-input');
  if (accInput) accInput.addEventListener('input', () => { state.accountId = accInput.value.trim(); });

  // Project ID input
  const projInput = document.getElementById('project-id-input');
  if (projInput) projInput.addEventListener('input', () => { state.projectId = projInput.value.trim(); });

  // Event delegation for dynamically created elements (highlight timestamps, etc.)
  document.addEventListener('click', (e) => {
    const hlTime = e.target.closest('.hl-time');
    if (hlTime) {
      const timeStr = hlTime.textContent.trim();
      seekTo(timeStr);
    }
    const tsTime = e.target.closest('.ts-time');
    if (tsTime) {
      const timeStr = tsTime.textContent.trim();
      seekTo(timeStr);
    }
  });
}

async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(['geminiKey','goal','autoRate','summaryLang','accountId','projectId'], data => {
      if (data.geminiKey) {
        state.geminiKey = data.geminiKey;
        const apiEl = document.getElementById('api-key-input');
        if (apiEl) apiEl.value = data.geminiKey;
        updateKeyStatus();
      }
      if (data.accountId) {
        state.accountId = data.accountId;
        const accEl = document.getElementById('account-id-input');
        if (accEl) accEl.value = data.accountId;
      }
      if (data.projectId) {
        state.projectId = data.projectId;
        const projEl = document.getElementById('project-id-input');
        if (projEl) projEl.value = data.projectId;
      }
      if (data.goal) {
        state.goal = data.goal;
        document.querySelector(`[data-goal="${data.goal}"]`)?.classList.add('active');
        updateFooterGoal();
        updateGoalHint();
      }
      if (data.autoRate !== undefined) {
        state.autoRate = data.autoRate;
        const autoEl = document.getElementById('auto-rate-toggle');
        if (autoEl) autoEl.checked = data.autoRate;
      }
      if (data.summaryLang) {
        state.summaryLang = data.summaryLang;
        const langEl = document.getElementById('summary-lang');
        if (langEl) langEl.value = data.summaryLang;
      }
      resolve();
    });
  });
}

async function detectCurrentVideo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    if (tab.url.includes('youtube.com/watch') || tab.url.includes('youtube.com/shorts/')) {
      let vidId = null;
      if (tab.url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(tab.url).search);
        vidId = urlParams.get('v');
      } else if (tab.url.includes('youtube.com/shorts/')) {
        const match = tab.url.match(/shorts\/([a-zA-Z0-9_-]+)/);
        vidId = match ? match[1] : null;
      }

      // Inject script to extract video data
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: extractVideoData
        });
        const video = results?.[0]?.result;
        if (video) {
          state.currentVideo = video;
          displayVideoInfo(video);
          return;
        }
      } catch (e) {}

      if (vidId) {
        state.currentVideo = {
          videoId: vidId,
          title: tab.title ? tab.title.replace(' - YouTube', '') : 'YouTube Video',
          channel: 'YouTube Video',
          views: '–',
          url: tab.url,
          thumbUrl: `https://img.youtube.com/vi/${vidId}/mqdefault.jpg`
        };
        displayVideoInfo(state.currentVideo);
      }
    } else {
      document.getElementById('video-title').textContent = 'Open a YouTube video to analyze it';
      document.getElementById('video-channel').textContent = 'Navigate to a YouTube video page';
    }
  } catch (e) {
    console.error('detectCurrentVideo:', e);
  }
}

function extractVideoData() {
  const titleEl = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string, h1.style-scope.ytd-watch-metadata yt-formatted-string, #title h1');
  const channelEl = document.querySelector('#channel-name a, ytd-channel-name a');
  const viewsEl = document.querySelector('.view-count, #count .view-count');
  const likesEl = document.querySelector('.like-button-renderer-like-button yt-formatted-string, #top-level-buttons-computed ytd-toggle-button-renderer:first-child yt-formatted-string');
  
  // Extract description and comments for better analysis
  const descEl = document.querySelector('#description-inline-expander yt-attributed-string, #description .content, ytd-text-inline-expander');
  const description = descEl ? descEl.textContent.trim().substring(0, 800) : '';
  
  const commentEls = document.querySelectorAll('#comments #content-text');
  const comments = Array.from(commentEls).slice(0, 5).map(el => el.textContent.trim()).join(' | ').substring(0, 500);

  const videoId = new URLSearchParams(window.location.search).get('v');
  const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

  return {
    title: titleEl?.textContent?.trim() || document.title.replace(' - YouTube',''),
    channel: channelEl?.textContent?.trim() || 'Unknown Channel',
    views: viewsEl?.textContent?.trim() || '–',
    likes: likesEl?.textContent?.trim() || '–',
    description,
    comments,
    videoId,
    thumbUrl,
    url: window.location.href
  };
}

function displayVideoInfo(video) {
  document.getElementById('video-title').textContent = video.title || 'Unknown Title';
  document.getElementById('video-channel').textContent = video.channel + ' · ' + video.views;

  if (video.thumbUrl) {
    const thumb = document.getElementById('video-thumb');
    thumb.innerHTML = `<img src="${video.thumbUrl}" alt="thumbnail" onerror="this.parentNode.innerHTML='<div class=video-thumb-icon><svg viewBox=\\'0 0 24 24\\' fill=\\'currentColor\\'><path d=\\'M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2z\\'/></svg></div>'">`;
  }

  // Quick rating estimate
  const viewsNum = parseViewsNum(video.views);
  const quickRating = estimateRating(viewsNum);
  const quickRel = calcRelevance(video.title, state.goal);
  updateRatingDisplay(quickRating, quickRel, video.views);
}

// ────────────────────────────────────────
//  ANALYZE — Smart router: single-pass or chunked based on video length
// ────────────────────────────────────────

// Thresholds (seconds)
const SHORT_MEDIUM_THRESHOLD = 2 * 60 * 60; // ≤ 2 hrs → single full-transcript pass
const MAX_CHUNKS             = 20;           // Never more than 20 chunk calls, any length
const MIN_CHUNK_SECS         = 10 * 60;      // Minimum chunk: 10 minutes
const CHUNK_DELAY_MS         = 4500;         // 4.5s between calls → safe under 15 RPM free tier

/**
 * Returns the optimal chunk size in seconds so total chunks ≤ MAX_CHUNKS.
 * No upper cap — scales to any video length:
 *   2-hr  → 10-min chunks (~12 chunks)
 *   6-hr  → 18-min chunks (~20 chunks)
 *   10-hr → 30-min chunks (~20 chunks)
 *   20-hr → 60-min chunks (~20 chunks)
 *   100-hr → 300-min chunks (~20 chunks) — theoretically unlimited
 */
function calcChunkDuration(durationSecs) {
  const ideal = Math.ceil(durationSecs / MAX_CHUNKS);
  return Math.max(MIN_CHUNK_SECS, ideal); // Always at least 10 min per chunk
}



async function analyzeCurrentVideo() {
  if (!state.currentVideo) { showToast('Open a YouTube video first', 'amber'); return; }

  const btn      = document.getElementById('analyze-btn');
  const spinner  = document.getElementById('analyze-spinner');
  const btnText  = document.getElementById('analyze-btn-text');

  btn.disabled = true;
  spinner.style.display = 'inline-block';
  btnText.textContent = 'Analyzing…';

  try {
    // ── Step 1: Fetch FULL transcript ──────────────────────────────────
    setAnalysisStatus('Fetching full transcript…');
    const transcriptData = await getTranscript(state.currentVideo.videoId);
    state.transcript = transcriptData.segments || [];

    const totalSegs     = transcriptData.totalSegments || state.transcript.length;
    const durationSecs  = transcriptData.durationSeconds || estimateDuration(state.transcript);
    const durationLabel = fmtDuration(durationSecs);

    if (totalSegs > 0) {
      setAnalysisStatus(`Transcript loaded — ${totalSegs} segments · ${durationLabel}${transcriptData.isAsr ? ' (auto-captions)' : ''}`);
    } else {
      setAnalysisStatus('No captions found — analyzing from title & metadata');
    }

    // ── Step 2: Route to single-pass or chunked analysis ───────────────
    if (state.geminiKey) {
      if (durationSecs === 0 || durationSecs <= SHORT_MEDIUM_THRESHOLD) {
        // SHORT / MEDIUM: send full transcript in one Gemini call
        await generateFullAnalysis(state.transcript, durationSecs, totalSegs);
      } else {
        // LONG (>90 min): chunk → summarize each → synthesize
        await generateChunkedAnalysis(state.transcript, durationSecs);
      }
    } else {
      generateDemoAnalysis();
      showToast('Demo mode: Add Gemini key for real AI', 'amber');
    }

    // ── Step 3: Render transcript viewer ───────────────────────────────
    renderTranscript();
    showToast(`✅ Analysis complete — ${durationLabel} covered`, 'green');
    setAnalysisStatus(null); // clear status bar

  } catch (e) {
    console.error('analyzeCurrentVideo:', e);
    generateDemoAnalysis();
    showToast('Analysis ready (demo mode)', 'amber');
    setAnalysisStatus(null);
  }

  btn.disabled = false;
  spinner.style.display = 'none';
  btnText.textContent = '⚡ Re-analyze';
}

// ── STATUS BAR helper ──────────────────────────────────────────────────────
function setAnalysisStatus(msg) {
  let el = document.getElementById('analysis-status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'analysis-status';
    el.style.cssText = 'font-size:11px;color:var(--text3);text-align:center;padding:4px 8px;transition:opacity .3s;';
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn?.parentNode) analyzeBtn.parentNode.insertBefore(el, analyzeBtn.nextSibling);
  }
  if (msg) {
    el.textContent = msg;
    el.style.opacity = '1';
  } else {
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = ''; }, 400);
  }
}

// ── FULL-TRANSCRIPT SINGLE PASS (< 90 min) ────────────────────────────────
async function generateFullAnalysis(segments, durationSecs, totalSegs) {
  const goalLabel       = state.goal ? GOALS[state.goal]?.label : 'General Learning';
  const langInstruction = state.summaryLang !== 'English' ? `Respond in ${state.summaryLang}.` : '';
  const noCaption       = segments.length === 0;

  // Build the full transcript text — ALL segments, no slice cap
  const transcriptText = noCaption
    ? `[No captions available — base analysis on title, channel, and description only]`
    : segments.map(s => `[${fmtTime(s.start)}] ${s.text}`).join('\n');

  const durationLabel = fmtDuration(durationSecs);
  const segCount      = totalSegs || segments.length;

  setAnalysisStatus(`Sending ${segCount} segments to Gemini AI…`);

  const prompt = buildFullPrompt({
    goalLabel,
    langInstruction,
    video: state.currentVideo,
    transcriptText,
    durationLabel,
    maxHighlights: 10,
    maxSkills: 10
  });

  return sendGeminiAndApply(prompt);
}

// ── CHUNKED ANALYSIS for videos > 2 hours ──────────────────────────────
async function generateChunkedAnalysis(segments, durationSecs) {
  const goalLabel   = state.goal ? GOALS[state.goal]?.label : 'General Learning';
  const chunkSecs   = calcChunkDuration(durationSecs); // adaptive: 10–30 min per chunk

  // Split segments into adaptive time-based chunks
  const chunks = [];
  let currentChunk = [];
  let chunkStartTime = 0;

  for (const seg of segments) {
    if (seg.start >= chunkStartTime + chunkSecs && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      chunkStartTime = seg.start;
    }
    currentChunk.push(seg);
  }
  if (currentChunk.length > 0) chunks.push(currentChunk);

  const totalChunks   = chunks.length;
  const chunkSummaries = [];
  const etaTotalSecs  = Math.round(totalChunks * (CHUNK_DELAY_MS / 1000 + 3)); // approx 3s per Gemini call

  // ── Pass 1: Summarize each chunk ────────────────────────────────────
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const startLabel = fmtTime(chunk[0].start);
    const endLabel   = fmtTime(chunk[chunk.length - 1].start);
    const remaining  = Math.round((totalChunks - i) * (CHUNK_DELAY_MS / 1000 + 3));

    setAnalysisStatus(
      `Analyzing Part ${i + 1}/${totalChunks} (${startLabel}–${endLabel}) · ~${fmtDuration(remaining)} remaining`
    );

    const chunkText = chunk.map(s => `[${fmtTime(s.start)}] ${s.text}`).join('\n');
    const prompt    = buildChunkPrompt(chunkText, i + 1, totalChunks, startLabel, endLabel, goalLabel);

    try {
      const res = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'GEMINI_REQUEST', payload: { prompt, key: state.geminiKey } },
          (r) => {
            if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
            if (r?.error) return reject(new Error(r.error));
            resolve(r);
          }
        );
      });
      chunkSummaries.push({ part: i + 1, startLabel, endLabel, summary: res.text });
    } catch (e) {
      // If a chunk fails, note it and continue — don't abort the whole analysis
      chunkSummaries.push({ part: i + 1, startLabel, endLabel, summary: `[Part ${i + 1} could not be analyzed]` });
    }

    // Rate-limit safety gap between chunk calls (4.1s = safe under 15 RPM)
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, CHUNK_DELAY_MS));
    }
  }

  // ── Pass 2: Synthesize all chunk summaries into final analysis ───────
  setAnalysisStatus(`Synthesizing full ${fmtDuration(durationSecs)} video…`);

  const synthesisPrompt = buildSynthesisPrompt(chunkSummaries, state.currentVideo, goalLabel, durationSecs);
  return sendGeminiAndApply(synthesisPrompt);
}


// ── PROMPT BUILDERS ───────────────────────────────────────────────────────

function buildFullPrompt({ goalLabel, langInstruction, video, transcriptText, durationLabel, maxHighlights, maxSkills }) {
  return `Analyze this YouTube video for a learner focused on "${goalLabel}".
${langInstruction}

VIDEO TITLE: ${video.title}
CHANNEL: ${video.channel}
VIEWS: ${video.views}
DURATION: ${durationLabel}
DESCRIPTION EXCERPT: ${video.description || 'N/A'}
COMMENTS EXCERPT: ${video.comments || 'N/A'}

FULL TRANSCRIPT (all ${durationLabel} of content):
${transcriptText}

CRITICAL INSTRUCTION: If this video is clearly NOT educational or technical (e.g., music video, movie trailer, song, vlog, gameplay), set "relevance" to 0 and explain in the summary.

Return ONLY valid JSON (no markdown, no extra text):
{
  "rating": 4.3,
  "relevance": 87,
  "summary": "3-4 sentences covering what the full video teaches, key topics covered across all sections, and who it is best for.",
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6", "Skill 7", "Skill 8", "Skill 9", "Skill 10"],
  "highlights": [
    {"time": "0:30",  "text": "Introduction: what the video covers"},
    {"time": "5:00",  "text": "Key concept from early section"},
    {"time": "15:00", "text": "Mid-point important topic"},
    {"time": "30:00", "text": "Advanced concept covered"}
  ]
}

Rules:
- rating: 1-5 content quality (0 if not educational)
- relevance: 0-100 match to "${goalLabel}" goal (0 if music/movie/song)
- skills: up to ${maxSkills} specific technical skills/topics taught — draw from the ENTIRE video
- highlights: up to ${maxHighlights} key moments distributed across the FULL video duration — use real timestamps from the transcript`;
}

function buildChunkPrompt(chunkText, partNum, totalParts, startLabel, endLabel, goalLabel) {
  return `You are analyzing Part ${partNum} of ${totalParts} of a YouTube tutorial video for a learner focused on "${goalLabel}".

This chunk covers timestamp ${startLabel} to ${endLabel}.

TRANSCRIPT SEGMENT:
${chunkText}

Write a concise summary of what was taught in this specific section. List the key skills/concepts introduced. Be specific and factual — only reference what was actually in this transcript.

Return plain text (no JSON needed). Format:
SECTION SUMMARY: [2-3 sentences describing what was taught]
KEY TOPICS: [comma-separated list of topics/skills introduced in this section]
NOTABLE MOMENT: [timestamp] — [one-sentence description of the most important insight in this chunk]`;
}

function buildSynthesisPrompt(chunkSummaries, video, goalLabel, durationSecs) {
  const summaryText = chunkSummaries.map(c =>
    `--- Part ${c.part} (${c.startLabel}–${c.endLabel}) ---\n${c.summary}`
  ).join('\n\n');

  const durationLabel = fmtDuration(durationSecs);
  const langInstruction = state.summaryLang !== 'English' ? `Respond in ${state.summaryLang}.` : '';

  return `You have analyzed a ${durationLabel} YouTube video in ${chunkSummaries.length} parts. Now synthesize a final comprehensive analysis for a learner focused on "${goalLabel}".
${langInstruction}

VIDEO: ${video.title}
CHANNEL: ${video.channel}
TOTAL DURATION: ${durationLabel}

PART-BY-PART ANALYSIS:
${summaryText}

Based on ALL parts above, return ONLY valid JSON:
{
  "rating": 4.5,
  "relevance": 91,
  "summary": "4-5 sentences covering the complete video: what the full course/tutorial teaches from start to finish, major sections covered, depth level, and who this is best for.",
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6", "Skill 7", "Skill 8", "Skill 9", "Skill 10"],
  "highlights": [
    {"time": "0:00",  "text": "Opening section topic"},
    {"time": "15:00", "text": "Second major topic"},
    {"time": "45:00", "text": "Third major section"}
  ]
}

Rules:
- highlights: pick up to 10 key moments SPANNING the full ${durationLabel} — use the NOTABLE MOMENT timestamps from each part summary
- skills: up to 10 specific technical skills drawn from ALL parts of the video
- summary: must reflect the complete video, not just the beginning`;
}

// ── GEMINI MESSAGE + APPLY ────────────────────────────────────────────────
function sendGeminiAndApply(prompt) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'GEMINI_REQUEST', payload: { prompt, key: state.geminiKey } },
      (res) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (res?.error) return reject(new Error(res.error));
        try {
          const clean = res.text.replace(/```json|```/g, '').trim();
          const data  = JSON.parse(clean);
          state.analysisData = data;
          applyAnalysis(data);
          resolve(data);
        } catch (e) { reject(e); }
      }
    );
  });
}

// ── DEMO ANALYSIS (no API key or fallback) ────────────────────────────────
function generateDemoAnalysis() {
  const title    = state.currentVideo?.title || '';
  const viewsNum = parseViewsNum(state.currentVideo?.views || '0');
  const rating   = estimateRating(viewsNum);
  const relevance = calcRelevance(title, state.goal);

  const data = {
    rating,
    relevance,
    summary: `This video by ${state.currentVideo?.channel || 'the creator'} covers "${title}". It provides a comprehensive walkthrough with practical examples suited for learners wanting to build real skills. The instructor uses clear explanations with hands-on demonstrations throughout.`,
    highlights: [
      { time: '0:00',  text: 'Introduction and course overview — what you will learn' },
      { time: '5:30',  text: 'Core concepts explained with visual examples' },
      { time: '12:00', text: 'First practical exercise and hands-on coding' },
      { time: '25:00', text: 'Deep dive into advanced features and patterns' },
      { time: '38:00', text: 'Common mistakes and debugging strategies' },
      { time: '50:00', text: 'Final project and real-world application' }
    ]
  };
  state.analysisData = data;
  applyAnalysis(data);
}

// ── APPLY ANALYSIS RESULTS TO UI ─────────────────────────────────────────
function applyAnalysis(data) {
  // Update rating/relevance display
  updateRatingDisplay(data.rating, data.relevance, state.currentVideo?.views);

  // Summary
  document.getElementById('summary-text').textContent = data.summary;

  // Highlights
  const hlList = document.getElementById('hl-list');
  if (data.highlights?.length) {
    hlList.innerHTML = data.highlights.map(h => `
      <div class="hl-item">
        <span class="hl-time" onclick="seekTo('${h.time}')">${h.time}</span>
        <span class="hl-text">${h.text}</span>
      </div>
    `).join('');
  }

  // Show Sync button
  document.getElementById('sync-btn').style.display = 'block';
}

// ── DURATION HELPERS ──────────────────────────────────────────────────────
function fmtDuration(totalSecs) {
  if (!totalSecs || totalSecs === 0) return 'unknown duration';
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = Math.floor(totalSecs % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function estimateDuration(segments) {
  if (!segments || segments.length === 0) return 0;
  const last = segments[segments.length - 1];
  return Math.round(last.start + (last.dur || 0));
}



async function syncToDashboard() {
  if (!state.accountId) {
    showToast('Add Account ID in Settings', 'amber');
    switchPage('settings', document.querySelector('[data-page=settings]'));
    return;
  }
  if (!state.analysisData) {
    showToast('Analyze the video first', 'amber');
    return;
  }

  const syncBtn = document.getElementById('sync-btn');
  syncBtn.disabled = true;
  syncBtn.innerHTML = '<span>⏳ Syncing...</span>';

  try {
    const res = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'SAVE_TO_DASHBOARD',
        payload: {
          accountId: state.accountId,
          analysis: {
            ...state.analysisData,
            durationSeconds: state.transcript.length > 0
              ? estimateDuration(state.transcript)
              : 0
          },
          videoId:   state.currentVideo.videoId,
          title:     state.currentVideo.title,
          projectId: state.projectId || 't7-learning-hub'
        }
      }, (r) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else if (r?.error) reject(new Error(r.error));
        else resolve(r);
      });
    });

    if (res.success) {
      showToast('Successfully synced to dashboard! ✅', 'green');
      syncBtn.innerHTML = '<span>✅ Synced</span>';
    }
  } catch (e) {
    console.error(e);
    showToast('Sync failed: ' + e.message, 'red');
    syncBtn.innerHTML = '<span>🔄 Retry Sync</span>';
    syncBtn.disabled = false;
  }
}

// ────────────────────────────────────────
//  TRANSCRIPT
// ────────────────────────────────────────
async function getTranscript(videoId) {
  if (!videoId) return { segments: [] };
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_TRANSCRIPT', videoId }, res => {
      resolve(res || { segments: [] });
    });
  });
}

function renderTranscript() {
  const wrap = document.getElementById('transcript-wrap');
  if (!state.transcript.length) {
    wrap.innerHTML = '<div style="color:var(--text3);font-size:12px;text-align:center;padding:16px">No transcript available for this video</div>';
    return;
  }
  wrap.innerHTML = state.transcript.slice(0, 80).map(s => `
    <div class="ts-item">
      <span class="ts-time" onclick="seekTo('${fmtTime(s.start)}')">${fmtTime(s.start)}</span>
      <span class="ts-text">${s.text}</span>
    </div>
  `).join('');
}

function exportTranscript(format) {
  if (!state.transcript.length) {
    showToast('No transcript to export', 'amber');
    return;
  }
  let content = '';
  if (format === 'txt') {
    content = state.transcript.map(s => `[${fmtTime(s.start)}] ${s.text}`).join('\n');
  } else if (format === 'srt') {
    content = state.transcript.map((s, i) => {
      const start = srtTime(s.start);
      const end = srtTime((state.transcript[i+1]?.start || s.start + 5));
      return `${i+1}\n${start} --> ${end}\n${s.text}\n`;
    }).join('\n');
  }
  downloadFile(content, `transcript_${state.currentVideo?.videoId || 'video'}.${format}`, 'text/plain');
  showToast(`Transcript exported as .${format}`, 'green');
}

function copyTranscript() {
  const text = state.transcript.map(s => `[${fmtTime(s.start)}] ${s.text}`).join('\n');
  navigator.clipboard.writeText(text || 'No transcript available');
  showToast('Transcript copied!', 'green');
}

// ────────────────────────────────────────
//  SUBTITLES
// ────────────────────────────────────────
async function generateSubtitles() {
  const lang = document.getElementById('subtitle-lang').value;
  if (!state.transcript.length && !state.currentVideo) {
    showToast('Analyze the video first', 'amber');
    return;
  }
  showToast('Generating subtitles…', 'accent');

  const preview = document.getElementById('subtitle-preview');
  const previewContent = document.getElementById('subtitle-preview-content');

  let subtitleData = state.transcript;

  // If translating and have API key, use Gemini
  if (lang !== 'en' && state.geminiKey && state.transcript.length > 0) {
    try {
      const sample = state.transcript.slice(0, 20).map(s => s.text).join(' | ');
      const prompt = `Translate these video subtitles to ${lang}. Return ONLY a JSON array of translated strings (same count): ${JSON.stringify(state.transcript.slice(0, 20).map(s => s.text))}`;
      const res = await new Promise(r => chrome.runtime.sendMessage({ type: 'GEMINI_REQUEST', payload: { prompt, key: state.geminiKey } }, r));
      if (res?.text) {
        try {
          const translated = JSON.parse(res.text.replace(/```json|```/g,'').trim());
          subtitleData = state.transcript.slice(0, 20).map((s, i) => ({ ...s, text: translated[i] || s.text }));
        } catch(e) {}
      }
    } catch(e) {}
  }

  previewContent.innerHTML = (subtitleData.slice(0,15) || []).map((s, i) => `
    <div class="ts-item">
      <span class="ts-time">${fmtTime(s.start)}</span>
      <span class="ts-text">${s.text}</span>
    </div>
  `).join('') || '<div style="padding:12px;color:var(--text3);font-size:12px">Demo subtitle preview</div>';

  preview.style.display = 'block';
  showToast('Subtitles ready!', 'green');
}

function exportSubtitles(format) {
  if (!state.transcript.length) {
    showToast('Generate subtitles first', 'amber');
    return;
  }
  exportTranscript(format);
}

// ────────────────────────────────────────
//  CHAT
// ────────────────────────────────────────
async function sendChat() {
  const input = document.getElementById('chat-input');
  const q = input.value.trim();
  if (!q) return;
  input.value = '';
  appendMsg(q, 'user');

  const thinkingMsg = appendMsg('…', 'ai');

  if (state.geminiKey) {
    const context = buildChatContext();
    const prompt = `${context}\n\nUser question: ${q}\n\nAnswer concisely in 2-4 sentences.`;
    chrome.runtime.sendMessage(
      { type: 'GEMINI_REQUEST', payload: { prompt, key: state.geminiKey } },
      (res) => {
        thinkingMsg.textContent = res?.text || getDemoAnswer(q);
        scrollChatToBottom();
      }
    );
  } else {
    setTimeout(() => {
      thinkingMsg.textContent = getDemoAnswer(q);
      scrollChatToBottom();
    }, 800);
  }
}

function quickAsk(q) {
  document.getElementById('chat-input').value = q;
  sendChat();
}

function buildChatContext() {
  const video = state.currentVideo;
  const summary = state.analysisData?.summary || '';
  const transcript = state.transcript.slice(0, 30).map(s => s.text).join(' ');
  return `You are analyzing this YouTube video:
Title: "${video?.title}"
Channel: ${video?.channel}
Summary: ${summary}
Transcript excerpt: ${transcript}`;
}

function getDemoAnswer(q) {
  const lq = q.toLowerCase();
  if (lq.includes('summary') || lq.includes('main')) return state.analysisData?.summary || "This video provides a comprehensive overview of the topic with practical examples. The instructor covers fundamentals before diving into advanced techniques, making it suitable for different skill levels.";
  if (lq.includes('prerequisite') || lq.includes('require')) return "Based on the video content, you'll need basic familiarity with the subject area. The instructor assumes minimal prior knowledge and builds up from foundational concepts.";
  if (lq.includes('study plan') || lq.includes('learn')) return "Suggested study plan: 1) Watch this video fully and take notes. 2) Practice the examples shown. 3) Build a small project applying the concepts. 4) Review the highlighted key moments for reinforcement.";
  if (lq.includes('project')) return "The video includes hands-on projects you can build alongside the instructor. These real-world examples are designed to reinforce the concepts taught.";
  return "Based on the video content, " + (state.currentVideo?.title || "this video") + " covers this topic in depth. I'd recommend watching the key highlights section for the most relevant parts to your question.";
}

function appendMsg(text, role) {
  const msgs = document.getElementById('chat-msgs');
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  msgs.appendChild(div);
  scrollChatToBottom();
  return div;
}

function scrollChatToBottom() {
  const msgs = document.getElementById('chat-msgs');
  msgs.scrollTop = msgs.scrollHeight;
}

// ────────────────────────────────────────
//  YOUTUBE SEARCH + RATING
// ────────────────────────────────────────
async function ytSearch() {
  const query = document.getElementById('yt-search-input').value.trim();
  if (!query) return;

  const btn = document.getElementById('yt-search-btn');
  const spinner = document.getElementById('search-spinner');
  btn.disabled = true;
  spinner.style.display = 'inline-block';

  // Open YouTube search in the active tab and show results
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    if (tab.url?.includes('youtube.com')) {
      await chrome.tabs.update(tab.id, { url: ytSearchUrl });
    } else {
      await chrome.tabs.create({ url: ytSearchUrl });
    }

    // Also generate AI-rated mock results in popup
    generateSearchResults(query);
  } catch(e) {
    generateSearchResults(query);
  }

  btn.disabled = false;
  spinner.style.display = 'none';
}

async function generateSearchResults(query) {
  const container = document.getElementById('search-results');
  container.innerHTML = '<div style="color:var(--text3);font-size:12px;text-align:center;padding:20px"><span class="spinner"></span><br><br>Generating ratings…</div>';

  let videos;
  if (state.geminiKey) {
    try {
      const goalLabel = state.goal ? GOALS[state.goal].label : 'General';
      const prompt = `Generate 6 realistic YouTube video results for the search query: "${query}"
Learning goal: ${goalLabel}

Return ONLY valid JSON array:
[{
  "title": "video title here",
  "channel": "channel name",
  "views": 1250000,
  "published": "8 months ago",
  "duration": "45:32",
  "rating": 4.3,
  "relevance": 85,
  "summary": "One sentence about what this video teaches."
}]

rating: 1-5 quality score. relevance: 0-100 match with ${goalLabel}.`;

      const res = await new Promise(r => chrome.runtime.sendMessage({ type: 'GEMINI_REQUEST', payload: { prompt, key: state.geminiKey } }, r));
      const clean = res?.text?.replace(/```json|```/g,'').trim();
      videos = JSON.parse(clean);
    } catch(e) { videos = null; }
  }

  if (!videos) videos = getDemoSearchResults(query);

  container.innerHTML = '';
  videos.forEach(v => {
    container.appendChild(buildSearchResultCard(v));
  });
}

function getDemoSearchResults(query) {
  const q = query.toLowerCase();
  return [
    { title: `Complete ${query} Tutorial for Beginners 2024`, channel: 'Traversy Media', views: 1840000, published: '8 months ago', duration: '4:22:10', rating: 4.7, relevance: calcRelevance(query, state.goal), summary: `Comprehensive beginner-friendly course covering all ${query} fundamentals with real projects.` },
    { title: `${query} Crash Course – Learn in 1 Hour`, channel: 'Programming with Mosh', views: 3200000, published: '1 year ago', duration: '58:44', rating: 4.5, relevance: calcRelevance(query + ' basics', state.goal), summary: `Fast-paced crash course perfect for getting up to speed quickly.` },
    { title: `Advanced ${query} Techniques – Full Course`, channel: 'Fireship', views: 920000, published: '5 months ago', duration: '2:10:00', rating: 4.8, relevance: calcRelevance(query + ' advanced', state.goal), summary: `Deep dive into advanced patterns and best practices for experienced developers.` },
    { title: `${query} Project Tutorial – Build Real Apps`, channel: 'Kevin Powell', views: 680000, published: '3 months ago', duration: '1:45:00', rating: 4.4, relevance: calcRelevance(query + ' project', state.goal), summary: `Hands-on project-based learning approach building production-ready applications.` },
    { title: `Database Design Fundamentals for Beginners`, channel: 'freeCodeCamp.org', views: 2100000, published: '2 years ago', duration: '3:50:00', rating: 4.3, relevance: calcRelevance('database sql', state.goal), summary: `SQL and database fundamentals covering queries, joins, and data modeling.` },
    { title: `Machine Learning Full Course 2024 – Python`, channel: 'Andrej Karpathy', views: 1500000, published: '6 months ago', duration: '6:00:00', rating: 4.9, relevance: calcRelevance('machine learning python', state.goal), summary: `Neural networks and ML fundamentals explained from first principles.` }
  ];
}

function buildSearchResultCard(video) {
  const rel = Math.round(video.relevance);
  const relColor = rel >= 70 ? '#22c55e' : rel >= 40 ? '#f59e0b' : '#ef4444';
  const relLabel = rel >= 70 ? 'High match' : rel >= 40 ? 'Partial' : 'Low match';

  const div = document.createElement('div');
  div.style.cssText = `background:var(--bg2);border:1px solid var(--b1);border-radius:var(--r);padding:12px;display:flex;flex-direction:column;gap:8px`;
  div.innerHTML = `
    <div style="display:flex;gap:10px;align-items:flex-start">
      <div style="flex:1;min-width:0">
        <div style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--text);line-height:1.4;margin-bottom:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${video.title}</div>
        <div style="font-size:10px;color:var(--text3)">${video.channel} · ${fmtNumStr(video.views)} views · ${video.duration}</div>
      </div>
      <div style="flex-shrink:0;width:90px;background:var(--bg3);border:1px solid var(--b1);border-radius:8px;padding:8px;text-align:center">
        <div style="display:flex;justify-content:center;gap:1px;margin-bottom:2px">${starsHtml(video.rating)}</div>
        <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--text)">${video.rating.toFixed(1)}</div>
        <div style="font-size:9px;color:var(--text3)">Quality</div>
      </div>
    </div>
    <div style="font-size:11px;color:var(--text2);background:var(--bg3);padding:7px 9px;border-radius:6px;border-left:2px solid var(--accent);line-height:1.5">${video.summary}</div>
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
        <span style="font-size:9px;text-transform:uppercase;letter-spacing:0.7px;color:var(--text3);font-weight:600">Goal Match</span>
        <span style="font-size:10px;font-weight:700;color:${relColor}">${rel}% · ${relLabel}</span>
      </div>
      <div style="width:100%;height:5px;background:var(--bg5);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${rel}%;background:${relColor};border-radius:3px;transition:width 0.8s"></div>
      </div>
    </div>
  `;
  return div;
}

// ────────────────────────────────────────
//  SETTINGS
// ────────────────────────────────────────
let selectedGoal = null;

function selectGoal(goal, el) {
  document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  selectedGoal = goal;
}

function updateKeyStatus() {
  const key = document.getElementById('api-key-input').value.trim();
  const dot = document.getElementById('key-dot');
  const text = document.getElementById('key-status-text');
  if (key.length > 20) {
    dot.className = 'status-dot ok';
    text.textContent = 'API key configured';
    text.style.color = '#22c55e';
  } else if (key.length > 0) {
    dot.className = 'status-dot err';
    text.textContent = 'Key seems too short';
    text.style.color = '#ef4444';
  } else {
    dot.className = 'status-dot';
    text.textContent = 'Enter your Gemini API key';
    text.style.color = '';
  }
}

async function saveSettings() {
  const key = document.getElementById('api-key-input')?.value.trim() || '';
  const accId = document.getElementById('account-id-input')?.value.trim() || '';
  const projId = document.getElementById('project-id-input')?.value.trim() || 't7-learning-hub';
  const autoRate = document.getElementById('auto-rate-toggle')?.checked ?? true;
  const summaryLang = document.getElementById('summary-lang')?.value || 'English';
  const goal = selectedGoal || state.goal;

  await new Promise(resolve => {
    chrome.storage.local.set({ geminiKey: key, accountId: accId, projectId: projId, goal, autoRate, summaryLang }, resolve);
  });

  state.geminiKey = key;
  state.accountId = accId;
  state.projectId = projId;
  state.goal = goal;
  state.autoRate = autoRate;
  state.summaryLang = summaryLang;

  updateFooterGoal();
  updateGoalHint();
  showToast('Settings saved!', 'green');

  // Reload content script settings
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.includes('youtube.com')) {
      chrome.tabs.reload(tab.id);
    }
  } catch(e) {}
}

function updateFooterGoal() {
  const el = document.getElementById('footer-goal');
  if (state.goal && GOALS[state.goal]) {
    el.textContent = '🎯 ' + GOALS[state.goal].label;
    el.style.display = 'block';
  }
}

function updateGoalHint() {
  const hint = document.getElementById('search-goal-hint');
  if (state.goal && state.goal !== 'general') {
    hint.textContent = `Ratings personalized for: ${GOALS[state.goal]?.label}`;
    hint.style.color = 'var(--accent2)';
  }
}

// ────────────────────────────────────────
//  RATING HELPERS
// ────────────────────────────────────────
function updateRatingDisplay(rating, relevance, viewsStr) {
  const starsEl = document.getElementById('stars-display');
  const ratingVal = document.getElementById('rating-val');
  const relVal = document.getElementById('rel-val');
  const relBar = document.getElementById('rel-bar');
  const viewsVal = document.getElementById('views-val');

  if (starsEl) starsEl.innerHTML = starsHtml(rating);
  if (ratingVal) ratingVal.textContent = rating.toFixed(1);

  const rel = Math.round(relevance);
  const relColor = rel >= 70 ? 'var(--green)' : rel >= 40 ? 'var(--amber)' : 'var(--red)';
  if (relVal) { relVal.textContent = rel + '%'; relVal.style.color = relColor; }
  if (relBar) { relBar.style.width = rel + '%'; relBar.style.background = relColor; }
  if (viewsVal) viewsVal.textContent = fmtNumStr(parseViewsNum(viewsStr || '0'));
}

function starsHtml(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) html += '<span class="star-icon f">★</span>';
    else if (rating >= i - 0.5) html += '<span class="star-icon h">★</span>';
    else html += '<span class="star-icon e">★</span>';
  }
  return html;
}

function calcRelevance(title, goal) {
  if (!goal || goal === 'general') return 55 + Math.random() * 30;
  const topics = GOALS[goal]?.topics || [];
  const t = title.toLowerCase();
  let score = 15;
  for (const topic of topics) {
    if (t.includes(topic)) score += 18;
  }
  return Math.min(97, Math.max(8, score + Math.random() * 10));
}

function estimateRating(views) {
  let r = 3.0;
  if (views > 5000000) r += 1.2;
  else if (views > 1000000) r += 0.9;
  else if (views > 200000) r += 0.5;
  else if (views > 50000) r += 0.2;
  return Math.min(5, Math.max(1.5, r + (Math.random() * 0.4 - 0.2)));
}

// ────────────────────────────────────────
//  UI HELPERS
// ────────────────────────────────────────
function switchPage(pageId, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + pageId)?.classList.add('active');
  btn?.classList.add('active');
}

function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tabId)?.classList.add('active');
  if (btn) btn.classList.add('active');
  else document.querySelector(`[onclick*="'${tabId}'"]`)?.classList.add('active');
}

function showToast(msg, type) {
  const toast = document.getElementById('toast');
  const dot = document.getElementById('toast-dot');
  const text = document.getElementById('toast-msg');
  const colors = { green:'#22c55e', amber:'#f59e0b', red:'#ef4444', accent:'#7c6fff' };
  dot.style.background = colors[type] || '#888';
  text.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2800);
}

function copyText(id) {
  const el = document.getElementById(id);
  if (el) {
    navigator.clipboard.writeText(el.textContent || '');
    showToast('Copied to clipboard!', 'green');
  }
}

async function seekTo(timeStr) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const seconds = parseTimeStr(timeStr);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (s) => { const v = document.querySelector('video'); if(v) v.currentTime = s; },
      args: [seconds]
    });
  } catch(e) {}
}

// ────────────────────────────────────────
//  UTILS
// ────────────────────────────────────────
function fmtTime(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

function srtTime(s) {
  const ms = Math.floor((s % 1) * 1000);
  return fmtTime(s).replace(/(\d+:\d+)$/, '$1') + ',' + String(ms).padStart(3,'0');
}

function pad(n) { return String(n).padStart(2,'0'); }

function parseTimeStr(t) {
  const parts = t.split(':').map(Number);
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  if (parts.length === 2) return parts[0]*60 + parts[1];
  return parts[0] || 0;
}

function parseViewsNum(str) {
  if (!str) return 0;
  const s = str.replace(/,/g,'');
  const m = s.match(/([\d.]+)\s*([KMB]?)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (m[2] === 'B' || m[2] === 'b') return n * 1e9;
  if (m[2] === 'M' || m[2] === 'm') return n * 1e6;
  if (m[2] === 'K' || m[2] === 'k') return n * 1e3;
  return n;
}

function fmtNumStr(n) {
  if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(0) + 'K';
  return String(Math.round(n));
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
