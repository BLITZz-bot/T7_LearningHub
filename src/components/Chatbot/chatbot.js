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

import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================
// GEMINI API CALL
// ============================================================
export async function callGemini(apiKey, messages, systemPrompt, preferredModel = null) {
  // Validate API key
  const activeKey = (apiKey && apiKey !== 'undefined') ? apiKey : (import.meta.env.VITE_GEMINI_API_KEY || '');
  if (!activeKey) {
    throw new Error("Gemini API key is not configured. Please connect your Gemini API key in Profile or .env file.");
  }

  // Active Google Gemini models in priority order
  const targetModels = [];
  if (preferredModel && preferredModel !== 'auto') {
    targetModels.push(preferredModel);
  }

  const fallbacks = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite"
  ];

  for (const fb of fallbacks) {
    if (!targetModels.includes(fb)) {
      targetModels.push(fb);
    }
  }

  const genAI = new GoogleGenerativeAI(activeKey);

  // Format history for Gemini SDK
  // Gemini requires:
  // 1. History must start with a 'user' turn (strip any initial assistant greeting)
  // 2. History must strictly alternate between 'user' and 'model'
  let rawHistory = messages.slice(0, -1);
  const firstUserIdx = rawHistory.findIndex((m) => m.role === "user");

  if (firstUserIdx >= 0) {
    rawHistory = rawHistory.slice(firstUserIdx);
  } else {
    rawHistory = [];
  }

  const validHistory = [];
  for (const msg of rawHistory) {
    const role = msg.role === "assistant" ? "model" : "user";
    if (validHistory.length === 0) {
      if (role === "user") {
        validHistory.push({ role, parts: [{ text: msg.content }] });
      }
    } else {
      const lastEntry = validHistory[validHistory.length - 1];
      if (lastEntry.role === role) {
        lastEntry.parts[0].text += `\n${msg.content}`;
      } else {
        validHistory.push({ role, parts: [{ text: msg.content }] });
      }
    }
  }

  // Ensure last message before sending is a 'model' turn so the new message is 'user'
  if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === "user") {
    validHistory.push({ role: "model", parts: [{ text: "Understood." }] });
  }

  const lastMessage = messages[messages.length - 1];
  let lastError = null;

  for (const modelName of targetModels) {
    try {
      console.log(`Attempting connection with model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.95,
          topK: 40,
        }
      });

      const chat = model.startChat({
        history: validHistory,
      });

      const result = await chat.sendMessage(lastMessage.content);
      const response = await result.response;
      const text = response.text();

      if (text) {
        console.log(`Success with model: ${modelName}`);
        return text;
      }
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error.message);
      lastError = error;
      if (error.message?.includes("API key not valid") || error.message?.includes("API_KEY_INVALID")) {
        throw new Error("Invalid Gemini API Key. Please verify your key in profile settings.");
      }
    }
  }

  throw new Error(lastError?.message || "Could not connect to Gemini API. Please check your API key, internet connection, or try again later.");
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
