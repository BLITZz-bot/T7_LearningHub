# T7 — AI Video Intelligence Chrome Extension

AI-powered summaries, transcripts, highlights, and personalized ratings for YouTube.

---

## 🚀 Installation (Developer Mode)

1. **Download** and unzip the `T7-extension` folder
2. Open Chrome → go to `chrome://extensions/`
3. Enable **Developer Mode** (top-right toggle)
4. Click **"Load unpacked"** → select the `T7-extension` folder
5. The T7 icon will appear in your Chrome toolbar

---

## 🔑 Setup

1. Click the T7 icon in your toolbar
2. Go to the **Settings** tab
3. Enter your **Gemini API Key** (get one free at https://aistudio.google.com)
4. Choose your **Learning Goal** (e.g., Frontend Dev, Data Science)
5. Click **Save Settings**

---

## ✨ Features

### On YouTube Search Pages (automatic)
- **⭐ AI Rating Badges** — appear on every video card showing:
  - Quality score (1–5 stars) based on views, engagement
  - **Goal Match %** — relevance bar that fills based on your learning goal
  - One-line AI summary of the video
  - Mismatched videos (e.g., Database video when you're learning Frontend) show LOW relevance bar

### Popup — Analyze Any YouTube Video
1. Open any YouTube video
2. Click the T7 icon
3. Hit **"⚡ Analyze This Video"**

**Tabs available:**
- **Summary** — AI-generated summary in your language
- **Highlights** — 6 key moments with clickable timestamps (seeks video)
- **Transcript** — Full transcript, exportable as TXT or SRT
- **Subtitles** — Generate & translate subtitles to 10 languages
- **Chat** — Ask anything about the video with AI context

### Search Tab
- Type any topic to get AI-rated video results
- Each result shows quality rating + personalized relevance score

---

## 🎯 Learning Goals & Personalization

Set your goal once → all ratings adapt:

| Goal | Boosted Topics |
|------|---------------|
| Frontend Dev | HTML, CSS, JavaScript, React, Vue... |
| Backend Dev | Node, Python, APIs, Databases... |
| Data Science | Python, ML, TensorFlow, Pandas... |
| UI/UX Design | Figma, UX, Prototyping, Typography... |
| DevOps/Cloud | Docker, Kubernetes, AWS, CI/CD... |

A frontend learner searching "HTML course" → HTML videos show **95% match**
Same learner sees a SQL tutorial → shows **12% match** (low bar)

---

## 📁 File Structure

```
T7-extension/
├── manifest.json       — Extension config (Manifest V3)
├── background.js       — Service worker (Gemini API calls, transcript fetch)
├── content.js          — Injected into YouTube (adds rating badges)
├── content.css         — Styles for injected badges
├── popup.html          — Main extension popup UI
├── popup.js            — Popup logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔧 Tech Stack

- **Manifest V3** Chrome Extension
- **Gemini 2.0 Flash** via Google AI Studio API
- **YouTube timedtext API** for transcripts
- Vanilla JS, CSS (no build step required)

---

## ⚠️ Notes

- Gemini API key is stored locally in `chrome.storage.local` (never sent anywhere except Google)
- Works best on YouTube search pages and watch pages
- Transcript availability depends on whether the video has captions
- In demo mode (no API key), ratings are estimated from view counts
