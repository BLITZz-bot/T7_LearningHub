// ============================================================
// Skill-Flow AI Chatbot - Core Logic
// Powered by Google Gemini API
// ============================================================

/**
 * @typedef {Object} UserLearningData
 * @property {string} name
 * @property {string} career_interest
 * @property {string[]} skills
 * @property {number} readiness_score
 * @property {string} branch
 * @property {number} year
 */

// ============================================================
// SYSTEM PROMPT - Defines the AI's personality & capabilities
// ============================================================
export function buildSystemPrompt(userData) {
  const skillsSummary = userData.skills?.join(", ") || "No skills selected yet";

  return `You are T7 SKILL_BOT, a friendly AI career mentor integrated into the T7 Learning Hub placement readiness platform.

== USER PROFILE ==
Name: ${userData.name}
Target Career: ${userData.career_interest || "Not specified"}
Academic Background: ${userData.year ? userData.year + " Year " : ""}${userData.branch || ""}
Skills: ${skillsSummary}
Current Readiness Score: ${userData.readiness_score || 0}%

== YOUR CAPABILITIES ==
1. PLACEMENT READINESS: Analyze and explain the user's readiness for their target role.
2. SKILL GAP: Compare user skills to ${userData.career_interest || "industry"} requirements and identify missing skills.
3. RECOMMENDATIONS: Suggest high-quality learning resources (YouTube, Coursera, etc.) to bridge gaps.
4. DOUBT SOLVING: Answer technical questions with simple explanations and examples.
5. CAREER ADVICE: Suggest intermediate jobs or roles the user qualifies for NOW based on their skills.

== BEHAVIOR RULES ==
- Always be encouraging, concise, and actionable.
- Use emojis sparingly to keep tone friendly.
- When recommending resources, be specific about why it helps.
- If the user asks something unrelated to learning or career, gently redirect them.
- Keep responses focused — don't dump everything at once. Ask follow-up questions.

Respond in clean, readable text. Use bullet points and short paragraphs. Never use markdown headers like ## or **.`;
}

// All Gemini calls are securely proxied through /api/gemini — no key stored here

// ============================================================
// GEMINI API CALL
// ============================================================
/**
 * callGemini — Securely proxies chatbot messages through /api/gemini
 * The API key is NEVER passed or stored in the browser.
 * If the user has a personal key in their profile, it is forwarded
 * in the HTTPS request body (encrypted in transit, not in the bundle).
 */
export async function callGemini(userPersonalKey, messages, systemPrompt, preferredModel = null) {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'chatMessage',
      payload: {
        messages,
        systemPrompt,
        preferredModel,
        // Forward user's personal key if they provided one in profile settings
        // It travels over HTTPS and is used only server-side per request
        customApiKey: (userPersonalKey && userPersonalKey !== 'undefined') ? userPersonalKey : null,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Could not connect to Gemini API. Please check your internet connection or try again later.');
  }
  if (!data.text) {
    throw new Error('Empty response from AI. Please try again.');
  }
  return data.text;
}

// ============================================================
// INTENT DETECTION
// ============================================================
export function detectIntent(message) {
  const lower = message.toLowerCase();
  if (lower.match(/progress|ready|score|how.*going/)) return "progress";
  if (lower.match(/missing|gap|need|lack|require|job.*need/)) return "skill_gap";
  if (lower.match(/recommend|suggest|resource|course|learn|tutorial|where.*learn/)) return "recommendation";
  if (lower.match(/what is|explain|how does|define|tell me about|example/)) return "doubt";
  return "general";
}

// ============================================================
// QUICK REPLIES
// ============================================================
export function getQuickReplies(intent) {
  const replies = {
    progress: ["Show my skill gaps", "Which course should I take?", "How to improve my score?"],
    skill_gap: ["Recommend resources", "Show my readiness score", "What jobs can I apply to?"],
    recommendation: ["Suggest another resource", "Check my skill gaps", "How ready am I?"],
    doubt: ["Recommend a course on this", "Check my readiness", "What's my next step?"],
    general: ["Show my progress", "Check skill gaps", "What should I learn next?"],
  };
  return replies[intent] || replies.general;
}
