/**
 * Vercel Serverless Function: /api/quiz
 *
 * Handles generating coding challenges and evaluating submitted code using Gemini.
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

  if (!GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'GEMINI_NOT_CONFIGURED',
      message: 'Gemini API key not configured.',
    });
  }

  const { action, studentContext = {}, submittedCode, question } = req.body || {};

  if (!action) {
    return res.status(400).json({ error: 'action (generate or evaluate) is required' });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    if (action === 'generate') {
      const { targetRole, matchedSkills = [], missingSkills = [] } = studentContext;
      const skillsHave = Array.isArray(matchedSkills) ? matchedSkills.join(', ') : matchedSkills;
      const skillsMissing = Array.isArray(missingSkills) ? missingSkills.join(', ') : missingSkills;

      // Spaced repetition prompt
      const prompt = `You are an expert technical interviewer and mentor. 
This user is training to be a ${targetRole || 'Full Stack Developer'}. 
They already know: ${skillsHave || 'HTML, CSS'}. 
They are currently learning: ${skillsMissing || 'JavaScript, React'}.

Generate 5 coding challenges for this user. 
- 3 questions should focus on their CURRENT learning goals (the things they are currently learning).
- 2 questions should test their EXISTING knowledge to keep their skills sharp (spaced repetition).

Return ONLY a valid JSON array of 5 objects with this exact structure:
[
  {
    "id": 1,
    "title": "Question Title",
    "description": "Clear problem statement and constraints.",
    "startingCode": "function solve() {\\n  // your code here\\n}",
    "language": "javascript" // or "html" / "css" depending on the question
  }
]
Do not include markdown blocks like \`\`\`json, just the raw JSON array.`;

      const requestBody = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`Gemini API error (${response.status})`);
      
      const data = await response.json();
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      let questions = [];
      try {
        questions = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse questions:', text);
        return res.status(500).json({ error: 'Failed to generate valid questions.' });
      }

      return res.status(200).json({ questions });

    } else if (action === 'evaluate') {
      if (!submittedCode || !question) {
        return res.status(400).json({ error: 'submittedCode and question are required for evaluation' });
      }

      const prompt = `You are an expert code evaluator. 
Review the user's submitted code for the following problem.

Problem Title: ${question.title}
Problem Description: ${question.description}

User's Submitted Code:
${submittedCode}

Evaluate the logic. Did they solve it correctly?
Return ONLY a valid JSON object with this exact structure:
{
  "isCorrect": true/false,
  "score": <number 0-100>,
  "feedback": "Specific feedback explaining what went right or wrong.",
  "optimalSolution": "The best way to write the code (include syntax)."
}
Do not include markdown blocks like \`\`\`json, just the raw JSON object.`;

      const requestBody = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`Gemini API error (${response.status})`);
      
      const data = await response.json();
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      let evaluation = {};
      try {
        evaluation = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse evaluation:', text);
        return res.status(500).json({ error: 'Failed to evaluate code.' });
      }

      return res.status(200).json(evaluation);
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (err) {
    console.error('[/api/quiz] Error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
