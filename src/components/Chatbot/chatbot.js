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

// ============================================================
// GEMINI API CALL
// ============================================================
export async function callGemini(apiKey, messages, systemPrompt) {
  // Validate API key
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("Gemini API key is not configured. Check your .env file.");
  }

  // All verified available models (stable and reliable)
  const targetModels = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-pro"
  ];

  // Convert messages to Gemini format
  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}` }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will act as T7 SKILL_BOT as instructed." }],
      },
      ...history,
      {
        role: "user",
        parts: [{ text: lastMessage.content }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.95,
      topK: 40,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE"
      }
    ]
  };

  let lastError = null;

  for (const modelName of targetModels) {
    // Try v1 first, then v1beta
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
    ];

    for (const modelUrl of endpoints) {
      try {
        console.log(`Attempting connection with model: ${modelName}`);
        
        const response = await fetch(modelUrl, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        // Read body ONCE
        const data = await response.json();

        if (response.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            console.log(`Success with model: ${modelName}`);
            return text;
          }
          // No text in response, try next model
          console.warn(`Model ${modelName}: empty response`);
          continue;
        }
        
        const errorMsg = data?.error?.message || `API Error (${response.status})`;
        console.warn(`Model ${modelName} failed (${response.status}):`, errorMsg);
        lastError = errorMsg;
        
        // If it's an invalid API key error, don't keep trying
        if (response.status === 400 && errorMsg.includes("API key")) {
          throw new Error("Invalid API Key. Please check your Gemini API key in .env file.");
        }
        
        // For 404 (model not found) or 429 (rate limit), try next model
        if (response.status === 404 || response.status === 429) {
          continue;
        }
        
        // For other errors, also try next
        continue;

      } catch (error) {
        if (error.message.includes("Invalid API Key")) throw error;
        console.error(`Error with model ${modelName}:`, error.message);
        lastError = error.message;
      }
    }
  }

  throw new Error(lastError || "Could not connect to Gemini API. Please check your API key, internet connection, or try again later.");
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
