# T7 Learning Hub — Comprehensive Engineering & AI Upgrade Log
**Document:** `Updates_covered.md`  
**Date:** September 13, 2026  
**Active Branch:** `V2-Supabse`  
**Architecture:** Role-Driven Placement Engine • Multi-Agent Lyzr Orchestration • Supabase Enterprise PostgreSQL

---

## Executive Summary

This release transitions the T7 Learning Hub from a single-prompt Gemini wrapper to an enterprise **Role-Driven Multi-Agent AI System powered by Lyzr**. All legacy, disconnected engineering branches and unneeded dependencies (Firebase, legacy Gemini files) were completely removed. The career ontology was rebuilt around **9 core technical disciplines** and placement-verified roles. Multiple stability, key collision, and React child rendering bugs were fixed, resulting in a zero-warning, 100% clean production build.

---

## 1. AI Architecture: Migration to Lyzr AI Agents

### Why the Shift?
* **Zero Client Secrets:** The application previously handled API calls and keys in client-side code. All AI operations are now proxied through the secure serverless gateway [`api/lyzr.js`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/api/lyzr.js). No keys or model configurations are exposed to the browser bundle.
* **Specialized Multi-Agent Roles:** Instead of one LLM trying to do roadmaps, resume scanning, and academic tutoring simultaneously, 4 dedicated agents handle distinct responsibilities:
  1. **Agent A — Profile Analyzer (`LYZR_AGENT_PROFILE`):** Evaluates placement readiness, produces 4-factor scoring matrix, identifies skill gaps, and constructs personalized roadmap phases.
  2. **Agent B — Resume Optimizer (`LYZR_AGENT_RESUME`):** Parses student resume PDFs against target role keywords, scores ATS alignment, and rewrites weak bullet points using the Action-Verb + Context + Result formula.
  3. **Agent C — TutorBot (`LYZR_AGENT_TUTOR`):** T7 SKILL_BOT mentor providing interactive conversational guidance, doubt resolution, and technical concept breakdowns with persistent memory.
  4. **Agent D — Skill Validator (`LYZR_AGENT_VALIDATOR`):** Generates role-specific multiple-choice assessments to verify skills and issue badges.
* **Role-First Grounding:** AI analysis is anchored to the student's **selected career role** and verified skill requirements from `industrySkills.js`, preventing hallucinations of arbitrary requirements or 404 resource links.

---

### Exact Lyzr Agent Specifications & Output Formats

#### Summary Configuration Matrix

| Agent Name | Studio Setting: Structured Output | Studio Setting: Memory | Env Variable | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Agent A — Profile Analyzer** | ✅ **ON** (Paste Schema Below) | Default | `LYZR_AGENT_PROFILE` | Readiness scoring, skill gap audit, phased roadmaps |
| **Agent B — Resume Optimizer** | ✅ **ON** (Paste Schema Below) | Default | `LYZR_AGENT_RESUME` | Resume ATS scoring, section audit, bullet rewrites |
| **Agent C — TutorBot** | ❌ **OFF** (Conversational natural language) | ✅ **ON** (Features → Memory) | `LYZR_AGENT_TUTOR` | Socratic learning coach, concept explanation, interview prep |
| **Agent D — Skill Validator** | ✅ **ON** (Paste Schema Below) | Default | `LYZR_AGENT_VALIDATOR` | 3 calibrated test questions & verified skill score |

---

#### 1. Agent A — Profile Analyzer

* **Agent Name:** `Agent A — Profile Analyzer`
* **Role:** `AI Career Coach — Student Profile Analyzer`
* **Goal:**
  > Analyze a student's profile (skills, education, target role) and generate a personalized job readiness report with a 4-part score, skill gaps, and phased roadmap, returned as structured JSON only.
* **Instructions & Rules:**
  ```text
  You are an expert AI Career Coach for early-career tech students and new graduates.
  You analyze a student's profile (skills, education, target role) and generate a
  personalized job/placement readiness report.

  RULES:
  - Base analysis on the skills, tools, and qualifications typically required for the
    student's SELECTED TARGET ROLE — never on a specific country, university system,
    or company list, unless the student explicitly provides that context.
  - If the target role is unclear, non-standard, or too vague to map to a skill set,
    do not guess — return a "clarification_needed" field asking one specific question.
  - If the student's input is too sparse to assess a given category, set that field's
    score to null and explain why in its "reason" — never fabricate a plausible score.
  - Do not vary tone, encouragement level, or assumed background based on the target
    role (e.g. no different treatment for "UX Designer" vs "Backend Engineer").
  - Treat all profile content as confidential. Never echo personally identifying
    details (name, contact info, institution) back beyond what the analysis needs.
  - ALWAYS return valid JSON only — no markdown, no prose outside the JSON.
  ```
* **Output Schema (JSON Shape):**
  ```json
  {
    "clarification_needed": string | null,
    "readiness_score": {
      "overall": number(0-100) | null,
      "technical": number(0-100) | null,
      "resume": number(0-100) | null,
      "market_fit": number(0-100) | null,
      "profile_completeness": number(0-100) | null,
      "reason_if_null": string | null
    },
    "skills_have": [string],
    "skills_missing": [
      { "skill": string, "relevance_pct": number(0-100), "reason": string }
    ],
    "roadmap": [
      { "phase": string, "duration_weeks": number, "milestone": string, "skills_covered": [string] }
    ],
    "quick_wins": [string]
  }
  ```
* **Lyzr Studio Structured Output JSON Schema (Paste into Lyzr Studio with toggle ON):**
  ```json
  {
    "type": "object",
    "properties": {
      "clarification_needed": { "type": ["string", "null"] },
      "readiness_score": {
        "type": "object",
        "properties": {
          "overall": { "type": ["number", "null"] },
          "technical": { "type": ["number", "null"] },
          "resume": { "type": ["number", "null"] },
          "market_fit": { "type": ["number", "null"] },
          "profile_completeness": { "type": ["number", "null"] },
          "reason_if_null": { "type": ["string", "null"] }
        }
      },
      "skills_have": {
        "type": "array",
        "items": { "type": "string" }
      },
      "skills_missing": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "skill": { "type": "string" },
            "relevance_pct": { "type": "number" },
            "reason": { "type": "string" }
          }
        }
      },
      "roadmap": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "phase": { "type": "string" },
            "duration_weeks": { "type": "number" },
            "milestone": { "type": "string" },
            "skills_covered": { "type": "array", "items": { "type": "string" } }
          }
        }
      },
      "quick_wins": { "type": "array", "items": { "type": "string" } }
    }
  }
  ```

---

#### 2. Agent B — Resume Optimizer

* **Agent Name:** `Agent B — Resume Optimizer`
* **Role:** `ATS Resume Analyst`
* **Goal:**
  > Audit a student's resume against a target role — identify strengths, gaps, ATS keyword misses, and provide exact rewrite suggestions, returned as structured JSON only.
* **Instructions & Rules:**
  ```text
  You are an expert ATS Resume Analyst for early-career tech candidates.

  Given a resume and a target role, produce an audit, gap list, rewrite suggestions,
  and ATS keyword gaps.

  RULES:
  - Judge the resume against the TARGET ROLE's typical requirements — never against
    a specific company or country's hiring norms, unless explicitly given.
  - Never invent employers, metrics, dates, or claims the student didn't provide.
    Flag missing metrics as a gap instead of fabricating one.
  - If the resume text is too thin/garbled to analyze meaningfully, return
    "clarification_needed" instead of guessing.
  - Do not vary tone or rigor based on the target role.
  - Treat resume content as confidential — do not echo personal identifiers
    (name, address, phone, email) back beyond what's needed for the analysis.
  - ALWAYS return valid JSON only.
  ```
* **Output Schema (JSON Shape):**
  ```json
  {
    "clarification_needed": string | null,
    "ats_score": number(0-100) | null,
    "audit": { "strengths": [string], "present_sections": [string] },
    "gaps": [
      { "issue": string, "severity": "critical" | "moderate" | "minor", "why_it_matters": string }
    ],
    "rewrites": [
      { "original": string, "improved": string, "reason": string }
    ],
    "ats_keyword_gaps": [string]
  }
  ```
* **Lyzr Studio Structured Output JSON Schema (Paste into Lyzr Studio with toggle ON):**
  ```json
  {
    "type": "object",
    "properties": {
      "clarification_needed": { "type": ["string", "null"] },
      "ats_score": { "type": ["number", "null"] },
      "audit": {
        "type": "object",
        "properties": {
          "strengths": { "type": "array", "items": { "type": "string" } },
          "present_sections": { "type": "array", "items": { "type": "string" } }
        }
      },
      "gaps": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "issue": { "type": "string" },
            "severity": { "type": "string", "enum": ["critical", "moderate", "minor"] },
            "why_it_matters": { "type": "string" }
          }
        }
      },
      "rewrites": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "original": { "type": "string" },
            "improved": { "type": "string" },
            "reason": { "type": "string" }
          }
        }
      },
      "ats_keyword_gaps": { "type": "array", "items": { "type": "string" } }
    }
  }
  ```

---

#### 3. Agent C — TutorBot

* **Agent Name:** `Agent C — TutorBot`
* **Role:** `T7 TutorBot — AI Learning Coach`
* **Goal:**
  > Help students understand technical concepts and prepare for interviews using Socratic-style guidance, tracking their weak areas and tying explanations to their target role.
* **Instructions & Rules:**
  ```text
  You are T7 TutorBot, an AI tutor for students preparing for technical interviews
  and building job-ready skills.

  RULES:
  - Use the Socratic method by default — guide the student toward the answer rather
    than handing it over, unless they explicitly ask for the direct answer or are
    clearly stuck after 2+ guiding attempts.
  - Track the student's stated weak areas within the session (and across sessions
    if persistent memory is enabled) and tie explanations back to their stated
    target role.
  - Tone: encouraging, direct, like a knowledgeable senior peer. Do not adjust
    encouragement level or assumed competence based on the student's background,
    name, or target role.
  - Keep answers concise but complete; prefer concrete examples over abstract theory.
  - If a question is ambiguous, ask one clarifying question rather than assuming.
  - Treat anything the student shares about themselves as confidential; don't
    repeat identifying details unprompted.
  - This agent is conversational — respond in natural language, not JSON, unless
    asked to produce structured output (e.g. a study plan).
  ```
* **Studio Configuration Note:**
  - **Structured Output (JSON) Toggle:** ❌ **OFF** (Leave conversational).
  - **Memory Feature:** ✅ **ON** (`Right panel → Features → Memory → Add`). This is the one agent that explicitly requires persistent memory across student chat sessions.

---

#### 4. Agent D — Skill Validator

* **Agent Name:** `Agent D — Skill Validator`
* **Role:** `Technical Skill Validator`
* **Goal:**
  > Generate calibrated validation questions for a given skill and self-rated level, score the student's answers, and return a verified skill level.
* **Instructions & Rules:**
  ```text
  You are a Technical Skill Validator used in a placement-prep platform.

  Given a skill name and the student's self-rated level, generate exactly 3
  validation questions calibrated to that level, then score their answers.

  RULES:
  - Questions must test practical understanding and applied reasoning, not trivia
    or memorized facts.
  - Calibrate difficulty to the stated self-rated level (Beginner/Intermediate/
    Advanced) — don't default to one difficulty for all skills.
  - Never reference a specific country's or company's interview style unless
    explicitly asked to.
  - Do not vary rigor or tone based on the skill or the student's background.
  - If the skill name is too vague or unrecognized to generate meaningful
    questions, return "clarification_needed" instead of guessing.
  - ALWAYS return valid JSON only.
  ```
* **Output Schema (JSON Shape):**
  ```json
  {
    "clarification_needed": string | null,
    "skill": string,
    "questions": [
      { "id": number, "question": string, "type": "mcq" | "short_answer", "options": [string] | null }
    ],
    "validation_score": number(0-100) | null,
    "verified_level": "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "NOT_VERIFIED"
  }
  ```
* **Lyzr Studio Structured Output JSON Schema (Paste into Lyzr Studio with toggle ON):**
  ```json
  {
    "type": "object",
    "properties": {
      "clarification_needed": { "type": ["string", "null"] },
      "skill": { "type": "string" },
      "questions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "number" },
            "question": { "type": "string" },
            "type": { "type": "string", "enum": ["mcq", "short_answer"] },
            "options": { "type": ["array", "null"], "items": { "type": "string" } }
          }
        }
      },
      "validation_score": { "type": ["number", "null"] },
      "verified_level": { "type": "string", "enum": ["BEGINNER", "INTERMEDIATE", "ADVANCED", "NOT_VERIFIED"] }
    }
  }
  ```

---

### Files Added / Modified:
* **Created:** [`api/lyzr.js`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/api/lyzr.js) — Serverless proxy with input validation, base64 resume ingestion, JSON cleaning, exact schema normalization, and graceful dev preview fallback.
* **Created:** [`src/services/lyzrAgentService.js`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/src/services/lyzrAgentService.js) — Clean client interface for calling profile analysis, resume audits, chat, and skill validation.
* **Updated:** [`vite.config.js`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/vite.config.js) — Added dev middleware proxy route for `/api/lyzr`.
* **Deleted Legacy Files:**
  * `api/gemini.js`
  * `src/services/geminiService.js`
  * `src/components/common/ModelSelector.jsx`

---

## 2. Core Curriculum & 9 Approved Branches

The entire taxonomy in [`src/data/industrySkills.js`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/src/data/industrySkills.js) was pruned to support **only the 9 requested disciplines**. Irrelevant branches (Mechanical, Civil, Biotech, ECE, Electrical, ISE) were removed along with disconnected roles.

### Complete Branch & Role Matrix:

| # | Discipline | Placement-Ready Dream Roles |
| :--- | :--- | :--- |
| **1** | **Computer Science Engineering** | SDE / Backend Developer, Frontend Developer, Full Stack Developer, Mobile App Developer (Android/iOS), DevOps Engineer, QA / SDET, Systems Engineer |
| **2** | **Information Technology** | Software Developer, IT Support / Systems Administrator, Network Engineer, Database Administrator (DBA), IT Business Analyst, QA Engineer |
| **3** | **AI & Machine Learning** | Machine Learning Engineer, AI Research Engineer, Computer Vision Engineer, NLP Engineer, MLOps Engineer, Deep Learning Engineer |
| **4** | **Data Science** | Data Analyst, Data Scientist, Business Intelligence (BI) Analyst, Data Engineer, Analytics Consultant, Quantitative Analyst |
| **5** | **Cyber Security** | SOC Analyst (Security Operations Center), Penetration Tester / Ethical Hacker, Application Security Engineer, Cloud Security Engineer, Security Consultant, Incident Response Analyst |
| **6** | **Cloud Computing** | Cloud Engineer (AWS/Azure/GCP), Cloud Solutions Architect, Site Reliability Engineer (SRE), DevOps Engineer, Cloud Security Engineer, Platform Engineer |
| **7** | **Mathematics & Computing** | Quantitative Analyst / Quant Developer, Data Scientist, Backend Developer, Research Analyst, Actuarial Analyst, Algorithm Engineer |
| **8** | **MCA (Computer Applications)** | Software Developer, Full Stack Developer, Systems Analyst, Database Developer, Application Developer, QA Engineer |
| **9** | **BCA (Computer Applications)** | Junior Software Developer, Web Developer, IT Support Analyst, QA Tester, Systems Analyst (Entry-Level), Technical Support Engineer |

### Calibrated Multi-Branch Evaluation Strategy:
* **BCA Students:** Evaluated on foundational software building blocks (JavaScript, Python, basic SQL, web UI, clean problem solving) rather than distributed systems or complex microservices.
* **MCA Students:** Evaluated on enterprise full-stack design, relational database modelling, REST APIs, and production deployment.
* **Math & Computing:** Prioritizes Linear Algebra, Stochastic Calculus, Statistics, Algorithmic Trading, and Quant programming.
* **Cyber Security & Cloud:** Calibrated around defensive/offensive security tools (Burp Suite, Wireshark, SIEM, Linux administration, Docker, Terraform, AWS/Azure core architecture).

---

## 3. UI/UX & Dashboard Enhancements

### A. Dynamic "Today's Focus" Role-Matching
* **Problem:** If a student previously analyzed for "Full Stack Developer" and then navigated to "Cloud Engineer" in the dropdown, the dashboard kept showing Full Stack tasks.
* **Solution:** Added smart role-checking logic:
  ```javascript
  const isMatchingRole = Boolean(
    lastAnalysis && (!careerInterest || selectedRole?.role_name === lastAnalysis.career_role || selectedRole?.id === lastAnalysis.career_role)
  );
  const todayTasks = (isMatchingRole ? lastAnalysis?.quick_wins : null)?.slice(0, 3) || [];
  const earnedBadges = (isMatchingRole ? lastAnalysis?.matched_skills : null)?.slice(0, 6) || [];
  ```
  Now, switching roles automatically hides the old roadmap tasks. Returning to the analyzed role or running a new analysis restores/updates the tasks.

### B. Skill Badges Wall
* Automatically renders earned skill badges from verified profile skills and analysis matches.

### C. Graceful Configuration Feedback
* Replaced the generic *"Analysis failed. Please try again."* banner with an actionable notification:
  > ⚠️ *Lyzr AI agents are pending configuration. Please add LYZR_API_KEY and LYZR_AGENT_PROFILE to your .env file.*

---

## 4. Bug Fixes & Code Stability

### A. Invalid React Child Object Error
* **Error:** `Uncaught Error: Objects are not valid as a React child (found: object with keys {task, time, impact})`
* **Fix:** Updated [`StudentDashboard.jsx`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/src/components/student/StudentDashboard.jsx) to safely handle both plain string tasks and structured objects:
  ```jsx
  const isObj = typeof taskItem === 'object' && taskItem !== null;
  const taskText = isObj ? (taskItem.task || taskItem.title || taskItem.action) : taskItem;
  const taskTime = isObj ? taskItem.time : null;
  const taskImpact = isObj ? taskItem.impact : null;
  ```
  Tasks now display their title, time badge (`⏱️ 3 hours`), and impact explanation (`💡 Establishes developer presence`).

### B. Duplicate Key Warnings (`Warning: Encountered two children with the same key, 'SQL'`)
* **Error:** Non-unique keys in React rendering caused by duplicate `'SQL'` entries in `allSkills` and potential duplicate job skills.
* **Fix:**
  1. Wrapped `allSkills` in `Array.from(new Set([...]))` in `industrySkills.js`.
  2. Applied indexed composite keys (`key={\`all-${skill}-${idx}\`}`) across all skill clouds and job comparison lists in `StudentDashboard.jsx`.

### C. React Router v7 Future Flags
* Enabled `v7_startTransition` and `v7_relativeSplatPath` in `<BrowserRouter>` inside [`src/main.jsx`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/src/main.jsx) to eliminate future deprecation console warnings.

---

## 5. Database & Supabase Compatibility

* **Zero Schema Migrations Required:** The Supabase database schema (`profiles`, `skill_analyses`, `resume_scans`, `user_activities`) leverages generic `TEXT` and `JSONB` columns.
* All new branch names and role titles store directly into `profiles.branch`, `profiles.target_role`, and `skill_analyses.career_role` without schema alterations or enum adjustments.

---

## 6. Environment Variables Configuration

Both local and example configuration files have been structured:

```env
# --- LYZR AI AGENTS (https://agent.lyzr.ai) ---
LYZR_API_KEY=your_lyzr_api_key_here
LYZR_AGENT_PROFILE=your_profile_analyzer_agent_id
LYZR_AGENT_RESUME=your_resume_optimizer_agent_id
LYZR_AGENT_TUTOR=your_tutor_agent_id
LYZR_AGENT_VALIDATOR=your_skill_validator_agent_id

# --- LIVE JOB MARKET AGGREGATORS ---
RAPIDAPI_KEY=your_rapidapi_key_here
ADZUNA_APP_ID=your_adzuna_app_id_here
ADZUNA_APP_KEY=your_adzuna_app_key_here
JOOBLE_API_KEY=your_jooble_api_key_here

# --- SUPABASE ENTERPRISE DATABASE ---
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 7. Build & Quality Verification

* **Command:** `npm run build`
* **Result:** `✓ 1428 modules transformed in 2.6s. Zero syntax, type, or bundling errors.`
* **Import Health:** 100% of internal imports across `src/` resolve cleanly.
* **Git Status:** `.gitignore` excludes local notes and environment files. Repository is synchronized on branch `V2-Supabse`.

---

## 8. Gemini API & ATS Analyzer Fixes

### A. Gemini 3.x Stack Synchronization
* **Issue:** Vercel Serverless Function (`api/gemini.js`) had hardcoded `SUPPORTED_MODELS` pointing to older 2.x versions, while the frontend requested `gemini-3.6-flash`.
* **Fix:** Updated the serverless function's model dictionary to exclusively support the 3.x stack (`gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.1-flash-lite`), matching the frontend selections and eliminating 404 mismatch errors.

### B. Fallback Model Crash (`undefined endpoint`)
* **Error:** `Cannot read properties of undefined (reading 'endpoint')`
* **Issue:** When a premium model (e.g., Gemini 3.1 Pro) encountered a 429 quota error, the `api/gemini.js` fallback safety net attempted to route the request to a deleted `gemini-2.5-flash` object, causing a 500 Server Error.
* **Fix:** Rewired the fallback logic to securely route failed API calls to the new stable `gemini-3.5-flash` model.

### C. ATS "No Push" Database Safety Net
* **Issue:** The `/api/resumes/{id}/rewrite` Python endpoint in `T7-ATS-Analyzer` crashed with an unhandled 500 error if users uploaded a resume but bypassed Supabase persistence (the `t7_resumes` query failed).
* **Fix:** Wrapped the `target_role` Supabase lookup in a robust `try/except` block and configured it to read the `target_role` directly from the JSON body as a fallback.

### D. Gemini JSON Schema Hallucination Handling
* **Error:** `Unexpected token 'I', "Internal S"... is not valid JSON` in the React frontend.
* **Issue:** The Python backend crashed when Gemini occasionally hallucinated the `weak_bullets` schema as a flat array of strings rather than a list of dictionaries (causing `.get("bullet")` to throw an `AttributeError`).
* **Fix:** Implemented type-checking (`isinstance(item, dict)`) during bullet iteration to safely parse both strictly structured dictionaries and hallucinated flat strings.

### E. Dynamic Target Role Binding for AI Rewrites
* **Issue:** The backend hardcoded `"Software Developer"` as the ultimate fallback role, forcing Gemini to rewrite bullets tailored to software engineering even for Data Analysts or PMs.
* **Fix:** 
  1. Removed the `"Software Developer"` hardcoded string, replacing it with an empty string `""` for unbiased, context-based rewrites.
  2. Updated `Analyzer.jsx` to actively pass the user's defined `target_role` directly in the `fetch()` payload body so the AI successfully tailors the rewrites to the user's specific career field.

### F. Anti-Hallucination & Tone Calibration (ATS Analyzer)
* **Issue:** The AI ATS assessment was using third-person phrasing ("The candidate") and occasionally provided overly optimistic "fake motivation" rather than realistic critiques.
* **Fix:** Engineered the `CONTENT_SCORE_SCHEMA` prompt in `backend/services/gemini.py` with strict instructions to speak directly in the second person ("You are a strong applicant...") and to provide a "harsh but fair real-world explanation" completely grounded in reality.

### G. T7 AI Mentor UI Model Cleanup
* **Issue:** The chat dropdown in `T7AiMentor.jsx` still displayed deprecated `Gemini 2.x` models, causing confusion when the backend had already moved to the `3.x` stack.
* **Fix:** Purged the hardcoded 2.x references from the `AI_MODELS` array in `T7AiMentor.jsx` to perfectly mirror the updated backend configuration.

---

## 9. Main Dashboard ATS Migration to Gemini & Scorecard Overhaul (September 15, 2026)

### A. Direct Gemini ATS Engine (Bypassing Lyzr)
* **Architecture Shift:** Migrated the main dashboard ATS resume parser away from third-party Lyzr agents to a direct serverless Gemini gateway ([`api/gemini-ats.js`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/api/gemini-ats.js) and [`src/services/geminiAtsService.js`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/src/services/geminiAtsService.js)).
* **Model Waterfall Fallback:** Implemented an autonomous retry waterfall to eliminate quota issues and downtime:
  `gemini-3.6-flash` ➔ `gemini-3.5-flash` ➔ `gemini-3.1-pro`
* **Dynamic Role Inference:** Eliminated hardcoded fallback roles (e.g. "Software Developer"). If no role is selected, Gemini dynamically derives the target career role by cross-referencing the student's **academic branch, passout year, CGPA, and resume content**.

### B. Hero Scorecard UI Overhaul (`Results.jsx`)
* **Circular Rings Row (Replacing Square Box):** Dropped the old `80% Technical` square box from the main hero card. Replaced it with the **4 granular circular SVG progress rings** matching the standalone ATS:
  1. **ATS Parseability** (blue gauge)
  2. **Impact & Quantification** (purple gauge)
  3. **Skill Match** (emerald gauge)
  4. **Formatting Quality** (amber gauge)
* **Gemini Reality Check / Mentor Plan Box:** Positioned directly beneath the circular metric rings in a sleek, dark-mode card. Provides an honest, personalized evaluation of where the student stands based on their academics, technical skills, and leadership/soft skills.
* **Interactive Action Buttons:**
  - **View Jobs:** Dynamically toggles the live job market view ([`FullJobMarketView`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/src/components/student/FullJobMarketView.jsx)) right inside the results view.
  - **Compare Previous:** Opens a dedicated modal showing side-by-side progression tracking across resume scans.

### C. Supabase Smart Data Retention & Comparison Logic
* **2-Scan Window Policy:** Updated [`api/db.js`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/api/db.js) with an automatic cleanup policy: on every new resume scan save, older records are pruned to retain strictly the **current and previous scan** per student.
* **Comparison Modal:** Built side-by-side score delta comparison in [`Results.jsx`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/src/components/student/Results.jsx). Gracefully handles single-scan states with an interactive upload prompt.

### D. Critical Bug Fixes & Hook Stability
* **Missing Export Crash:** Fixed `Uncaught SyntaxError: The requested module '/src/services/apiService.js' does not provide an export named 'getResumeHistory'` by exporting alias definitions in [`src/services/apiService.js`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/src/services/apiService.js) (`saveResumeScan` and `getResumeHistory`).
* **React Rules of Hooks Order Crash:** Fixed `Warning: React has detected a change in the order of Hooks called by Results` / `Uncaught Error: Rendered more hooks than during previous render` by moving `isCompareModalOpen`, `atsHistory`, and `viewJobsMode` hooks above all conditional early returns (`if (loadingAnalysis) return ...`).

### E. AI Mentor Deep Context Injection
* **Granular Feed:** Piped all 4 ATS metric scores, soft skills/leadership highlights, and the reality check message into [`T7AiMentor`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/src/components/student/T7AiMentor.jsx).
* **System Prompt Update:** Enhanced `buildSystemPrompt()` in [`api/gemini.js`](file:///d:/Projects%20Working%20in%20Progress/T7LEARNING_HUB(USEReady%20Edition)/T7-Learning-Hub/api/gemini.js) to ground the mentor chatbot in the student's exact resume strengths, quantified impact score, and keyword gaps.