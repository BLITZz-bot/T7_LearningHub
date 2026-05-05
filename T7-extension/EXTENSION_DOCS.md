# T7 Learning Hub Chrome Extension: Detailed Abstract & Architecture

This document provides a comprehensive breakdown of the T7 Learning Hub Chrome Extension. It explains the purpose, features, integration hooks, and technical architecture of each component.

---

## 1. Core Purpose
The T7 Learning Hub Chrome Extension is designed to turn unstructured time spent on YouTube into measurable, professional progress. It targets engineering students preparing for placements by analyzing educational videos, extracting hard skills, and synchronizing that learning data directly to their central T7 Learning Hub platform portfolio.

---

## 2. Key Features Breakdown

### A. AI-Powered Video Analysis
- **What it does:** Uses the Google Gemini (`gemini-2.0-flash`) API to process the transcript and metadata of any YouTube video currently being watched.
- **Output:** It generates a concise summary, extracts key moments/timestamps, and most importantly, identifies specific professional skills (e.g., "Node.js", "Docker", "Machine Learning") taught in the video.

### B. Automated Skill Synchronization
- **What it does:** Allows students to securely push the skills they just learned from a video straight to the T7 Learning Hub database.
- **How it works:** 
  - The student enters their unique `T7 Account ID` (found on their dashboard) into the extension's settings.
  - When they click "Sync", the extension sends the video title, URL, and the AI-extracted skills to Firebase Firestore under their specific account record.
  - The T7 Learning Hub Dashboard and Results pages immediately reflect these new skills in the user's portfolio and skill gap analysis.

### C. Smart "Junk" Filtering
- **What it does:** Prevents generic or non-professional terms from cluttering the student's portfolio.
- **How it works:** It actively filters out broad terms like "programming", "tutorial", "course", "basics", or "development", ensuring that only concrete technical skills (like "ReactHooks", "SQL", "Figma") are recorded.

### D. Search Result Relevance Scoring
- **What it does:** Adds an overlay to YouTube search results to help students pick the best educational videos.
- **How it works:** Based on the "Learning Goal" selected in the extension settings (e.g., Frontend Dev, Data Science, DevOps), the API scores the video out of 100% on how relevant it is to their specific placement goals.

### E. On-Demand "T7 SKILL_BOT" Chat
- **What it does:** Provides an interactive AI tutor directly beside the video.
- **How it works:** Students can ask questions directly related to the video content. The bot is context-aware (having read the transcript and analysis) and can provide specific explanations or practice problems to test the student's understanding of the video.

---

## 3. Technical Architecture & Files

The extension is built using standard web technologies (HTML, CSS, JS) and Manifest V3.

### `manifest.json`
- Defines the extension version, name, and permissions.
- Grants access to YouTube URLs (`https://www.youtube.com/*`) and the Gemini API (`https://generativelanguage.googleapis.com/*`).
- Loads the content scripts, background service worker, and the popup UI.

### `popup.html` & `popup.css` (UI Layer)
- **Design:** Uses a modern, dark-mode aesthetic consistent with the T7 Learning Hub platform.
- **Tabs:** 
  - **Analyze:** The main view showing the video summary, rating, and "Analyze" / "Sync" buttons.
  - **Highlights / Transcript:** Displays specific timestamps from the video.
  - **Chat:** Interface for the T7 SKILL_BOT.
  - **Search:** Allows searching YouTube directly from the popup.
  - **Settings:** Where the user inputs their `T7 Account ID`, Gemini API Key, and Learning Goal.

### `popup.js` (Popup Logic)
- Handles all UI interactions (tab switching, button clicks).
- Interacts with Chrome's local storage to save settings (API key, Account ID).
- Sends messages to the background script or content script to trigger actions (like "Analyze Video").

### `background.js` (Service Worker)
- **State Management:** Manages extension-wide state.
- **API Calls:** Handles the heavy lifting of calling the Gemini API to prevent CORS issues or UI freezing in the popup.
- **Data Syncing:** Communicates with Firebase (via standard `fetch` requests equivalent) to push data matching the specified `T7 Account ID`.
- Receives messages from `popup.js` or `content.js` and routes the API data back.

### `content.js` & `content.css` (Page Injection)
- **DOM Interaction:** Injected directly into YouTube pages.
- **Transcript Extraction:** Scripts designed to interact with the YouTube DOM to pull video metadata (title, channel) and attempt to extract captions/transcripts for the AI to analyze.
- **UI Overlay:** Responsible for rendering the "Relevance Score" badges over video thumbnails on YouTube search result pages.

---

## 4. Security & Privacy
- **API Key Storage:** The Gemini API key is stored locally in the user's browser using Chrome's secure local storage API and is never sent to the T7 servers.
- **Data Association:** Data is only pushed to the database if a valid `T7 Account ID` is provided. The extension does not require its own login system, reducing friction and security overhead.

---

## 5. Typical User Workflow
1. Student registers on T7 Learning Hub and copies their `T7-UUID`.
2. Student pastes the ID and their Gemini API key into the extension settings.
3. Student watches a React tutorial on YouTube.
4. Student clicks the extension, hits "Analyze", reviews the AI-extracted skill breakdown.
5. Student clicks "Sync".
6. The T7 Learning Hub platform instantly shows "React" has been learned via video, increasing their placement readiness score.
