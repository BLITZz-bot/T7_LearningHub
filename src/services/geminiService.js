/**
 * Gemini AI Service
 * 
 * Handles communication with Google Gemini API for skill gap analysis.
 * Uses structured prompts to get JSON responses.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * Gemini Skill Gap Analysis Prompt Template
 * This prompt is designed to get structured JSON output from Gemini.
 */
const SKILL_GAP_PROMPT = `You are an expert AI career coach who has helped 10,000+ students get placed at top tech companies (Google, Amazon, Microsoft, startups). You understand Indian engineering college placements deeply.

TASK: Analyze a student's skills vs industry requirements and create an ACTIONABLE, DETAILED roadmap that will genuinely help them get placed.

INPUT DATA:
1. Student's current skills
2. Target career role  
3. Industry skill requirements
4. Optional resume file uploaded by the student

ANALYSIS REQUIREMENTS:
- Be brutally honest about skill gaps
- Calculate readiness score (0-100) realistically
- Identify EXACTLY what's missing and WHY it matters
- Prioritize skills by: (1) Most asked in interviews (2) Highest impact (3) Quickest to learn

ROADMAP MUST INCLUDE (THIS IS CRITICAL):

1. DAILY STUDY PLAN
   - Exactly what to study each day
   - How many hours (realistic for college students: 2-4 hrs/day)
   - Morning vs evening recommendations

2. SPECIFIC FREE RESOURCES (with actual names):
   - YouTube: Channel name + playlist name (e.g., "Striver's A2Z DSA playlist", "Chai aur Code React series")
   - Websites: LeetCode, GeeksforGeeks, freeCodeCamp, MDN Docs
   - GitHub repos: Awesome lists, project templates
   - Practice platforms: HackerRank, Codeforces, InterviewBit

3. CODING PRACTICE:
   - Exact number of problems to solve per week
   - Specific problem patterns (Two Pointers, Sliding Window, etc.)
   - Which LeetCode/GFG problems to start with (Easy → Medium → Hard progression)

4. PROJECTS (Portfolio-worthy):
   - Full project descriptions with features list
   - Tech stack to use
   - GitHub readme tips
   - How to present in interviews
   - Deployment instructions (Vercel, Netlify, Railway)

5. INTERVIEW PREPARATION:
   - Common interview questions for each skill
   - How to explain concepts (with example answers)
   - HR round tips
   - Resume bullet points for skills learned

6. WEEKLY CHECKPOINTS:
   - What you should be able to do by end of each week
   - Self-assessment questions
   - Mini-projects to validate learning

7. COMMON MISTAKES TO AVOID:
   - What students typically do wrong
   - Time wasters to avoid
   - Tutorial hell escape strategies

8. SOFT SKILLS & EXTRAS:
   - Communication tips
   - LinkedIn optimization
   - How to network
   - Open source contribution guide

9. ATS RESUME REVIEW:
   - Score the uploaded resume for ATS-friendliness from 0-100 if a resume is provided
   - Highlight missing keywords relevant to the selected role
   - Identify formatting or structure issues that hurt ATS parsing
   - Suggest bullet rewrites or section improvements for the resume
   - If no resume is provided, return null for ats_analysis

OUTPUT FORMAT (Valid JSON only, no markdown):
{
  "career_role": "Role Name",
  "readiness_score": 45,
  "score_breakdown": {
    "technical_skills": 50,
    "projects": 30,
    "interview_readiness": 40
  },
  "honest_assessment": "Brutally honest 2-3 sentence assessment of where student stands",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1 - why critical", "skill2 - why critical"],
  "skill_priority_order": [
    {"skill": "DSA", "reason": "Asked in 90% of tech interviews", "time_to_learn": "2-3 months", "difficulty": "Medium"}
  ],
  "learning_roadmap": [
    {
      "month": "Month 1",
      "title": "Foundation Month",
      "goal": "What student will achieve this month",
      "hours_per_week": 15,
      "daily_schedule": {
        "weekdays": "2 hrs DSA morning + 1.5 hrs project evening",
        "weekends": "3-4 hrs focused project work + revision"
      },
      "skills_covered": ["Skill 1", "Skill 2"],
      "weeks": [
        {
          "week": 1,
          "theme": "Week theme",
          "daily_tasks": [
            {"day": "Mon-Tue", "task": "Specific task", "duration": "2 hrs"},
            {"day": "Wed-Thu", "task": "Specific task", "duration": "2 hrs"},
            {"day": "Fri-Sat", "task": "Specific task", "duration": "3 hrs"},
            {"day": "Sun", "task": "Revision + practice", "duration": "2 hrs"}
          ],
          "coding_problems": {
            "platform": "LeetCode/GFG",
            "count": 10,
            "difficulty": "Easy",
            "topics": ["Arrays", "Strings"],
            "must_solve": ["Two Sum", "Valid Palindrome", "Reverse String"]
          },
          "checkpoint": "By end of week, you should be able to..."
        }
      ],
      "resources": [
        {
          "name": "Striver's A2Z DSA Course",
          "type": "YouTube Playlist",
          "url": "youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz",
          "why": "Best structured DSA course for placements",
          "how_to_use": "Watch 2 videos/day, code along, then solve related problems"
        }
      ],
      "projects": [
        {
          "name": "Project Name",
          "description": "Detailed description of what to build",
          "features": ["Feature 1", "Feature 2", "Feature 3"],
          "tech_stack": ["React", "Node.js", "MongoDB"],
          "time_required": "1 week",
          "github_tips": "Add proper README with screenshots, live demo link",
          "interview_talking_points": ["Explain challenge you faced", "Why you chose this tech stack"],
          "deploy_on": "Vercel/Netlify"
        }
      ],
      "interview_prep": {
        "concepts_to_master": ["Concept 1", "Concept 2"],
        "common_questions": [
          {"question": "Interview question?", "how_to_answer": "Key points to cover"}
        ],
        "practice_tip": "Explain concepts out loud to yourself"
      },
      "mistakes_to_avoid": [
        "Don't just watch tutorials without coding",
        "Don't skip easy problems - they build foundation"
      ],
      "end_of_month_checklist": [
        "Can solve X type of problems independently",
        "Have Y project on GitHub",
        "Can explain Z concept clearly"
      ]
    }
  ],
  "quick_wins": [
    {"task": "What to do", "time": "2 hours", "impact": "Why it matters"}
  ],
  "resume_tips": [
    "How to write bullet point for skill X",
    "Action verbs to use"
  ],
  "ats_analysis": {
    "score": 72,
    "summary": "Short ATS summary",
    "strengths": ["Clear section headings", "Relevant keywords included"],
    "issues": ["Missing project impact metrics", "Skills section is too generic"],
    "keyword_gaps": ["REST APIs", "Testing", "TypeScript"],
    "suggested_keywords": ["React", "JavaScript", "Git", "Responsive Design"],
    "section_scores": {
      "formatting": 80,
      "keyword_match": 65,
      "content_strength": 70,
      "impact": 60
    },
    "rewrite_suggestions": [
      "Rewrite weak bullet points using action + impact",
      "Add a dedicated skills section with exact job keywords"
    ]
  },
  "linkedin_tips": [
    "Profile optimization tip",
    "What to post"
  ],
  "motivation": "Encouraging message for the student",
  "final_outcome": "After completing this roadmap, you will be able to..."
}

Student Skills:
{{STUDENT_SKILLS}}

Selected Career Role:
{{CAREER_ROLE}}

Industry Skill Dataset:
{{INDUSTRY_SKILLS_JSON}}`;

const fileToGenerativePart = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result?.split(',')[1];

      if (!base64) {
        reject(new Error('Could not read resume file'));
        return;
      }

      resolve({
        inlineData: {
          data: base64,
          mimeType: file.type || 'application/octet-stream'
        }
      });
    };

    reader.onerror = () => reject(new Error('Failed to read resume file'));
    reader.readAsDataURL(file);
  });

const normalizeSectionScores = (scores = {}) => ({
  formatting: scores.formatting || 0,
  keyword_match: scores.keyword_match || 0,
  content_strength: scores.content_strength || 0,
  impact: scores.impact || 0
});

/**
 * Analyze skill gap using Gemini AI
 * 
 * @param {string[]} studentSkills - Array of student's current skills
 * @param {object} selectedRole - Selected career role object
 * @param {object[]} allRoles - All industry roles for context
 * @param {File|null} resumeFile - Optional uploaded resume file
 * @returns {Promise<object>} - Analysis result object
 */
export const analyzeT7LearningHub = async (studentSkills, selectedRole, allRoles, resumeFile = null) => {
  try {
    // Build the prompt with actual data
    const prompt = SKILL_GAP_PROMPT
      .replace('{{STUDENT_SKILLS}}', JSON.stringify(studentSkills, null, 2))
      .replace('{{CAREER_ROLE}}', selectedRole.role_name)
      .replace('{{INDUSTRY_SKILLS_JSON}}', JSON.stringify({
        role_name: selectedRole.role_name,
        description: selectedRole.description,
        required_skills: selectedRole.required_skills,
        priority_skills: selectedRole.priority_skills
      }, null, 2));

    // Build request parts
    const requestParts = [{ text: prompt }];

    if (resumeFile) {
      requestParts.push({
        text: `The uploaded file is the student's resume. Review it for ATS performance against the selected role "${selectedRole.role_name}".`
      });
      requestParts.push(await fileToGenerativePart(resumeFile));
    }

    // Try multiple models in order of preference
    const modelNames = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];

    let result = null;
    let lastModelError = null;

    for (const modelName of modelNames) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(requestParts);
        console.log(`Success with model: ${modelName}`);
        break;
      } catch (modelErr) {
        console.warn(`Model ${modelName} failed:`, modelErr.message);
        lastModelError = modelErr;
        continue;
      }
    }

    if (!result) {
      throw lastModelError || new Error('All Gemini models failed');
    }

    const response = await result.response;
    const text = response.text();

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonText = text;
    
    // Remove markdown code blocks if present
    if (text.includes('```json')) {
      jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (text.includes('```')) {
      jsonText = text.replace(/```\n?/g, '');
    }

    // Parse and validate JSON
    const analysisResult = JSON.parse(jsonText.trim());

    // Ensure required fields exist
    return {
      career_role: analysisResult.career_role || selectedRole.role_name,
      readiness_score: Math.min(100, Math.max(0, analysisResult.readiness_score || 0)),
      score_breakdown: analysisResult.score_breakdown || {},
      honest_assessment: analysisResult.honest_assessment || '',
      matched_skills: analysisResult.matched_skills || [],
      missing_skills: analysisResult.missing_skills || [],
      recommended_skills: analysisResult.recommended_skills || [],
      skill_priority_order: analysisResult.skill_priority_order || analysisResult.recommended_skills || [],
      learning_roadmap: analysisResult.learning_roadmap || [],
      quick_wins: analysisResult.quick_wins || [],
      resume_tips: analysisResult.resume_tips || [],
      linkedin_tips: analysisResult.linkedin_tips || [],
      motivation: analysisResult.motivation || '',
      final_outcome: analysisResult.final_outcome || '',
      ats_analysis: analysisResult.ats_analysis
        ? {
            score: Math.min(100, Math.max(0, analysisResult.ats_analysis.score || 0)),
            summary: analysisResult.ats_analysis.summary || '',
            strengths: analysisResult.ats_analysis.strengths || [],
            issues: analysisResult.ats_analysis.issues || [],
            keyword_gaps: analysisResult.ats_analysis.keyword_gaps || [],
            suggested_keywords: analysisResult.ats_analysis.suggested_keywords || [],
            section_scores: normalizeSectionScores(analysisResult.ats_analysis.section_scores),
            rewrite_suggestions: analysisResult.ats_analysis.rewrite_suggestions || []
          }
        : null,
      resume_meta: resumeFile
        ? {
            file_name: resumeFile.name,
            file_type: resumeFile.type || 'application/octet-stream'
          }
        : null
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Fallback: Generate basic analysis locally if API fails
    return generateFallbackAnalysis(studentSkills, selectedRole, resumeFile);
  }
};

/**
 * Perform a standalone ATS analysis against a selected career role
 */
export const analyzeResumeOnly = async (resumeFile, selectedRole, apiKey) => {
  if (!apiKey) throw new Error('API key is required');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const resumePart = await fileToGenerativePart(resumeFile);
  
  const prompt = `Analyze this resume against the "${selectedRole.role_name}" role.
  Role Skills: ${selectedRole.required_skills.map(s => s.name).join(', ')}

  Return ONLY a valid JSON object EXACTLY like this (no markdown, no other text):
  {
    "score": 65,
    "summary": "Short evaluation",
    "strengths": ["...", "..."],
    "issues": ["...", "..."],
    "keyword_gaps": ["...", "..."],
    "suggested_keywords": ["...", "..."],
    "section_scores": {
      "formatting": 70,
      "keyword_match": 50,
      "content_strength": 60,
      "impact": 55
    },
    "rewrite_suggestions": ["...", "..."]
  }`;

  try {
    const modelNames = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest'
    ];

    let result = null;
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        console.log(`ATS Standalone trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent([ prompt, resumePart ]);
        console.log(`ATS Standalone success with: ${modelName}`);
        break;
      } catch (err) {
        console.warn(`ATS Standalone model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    if (!result) throw lastError || new Error('All Gemini models failed for ATS');

    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error('Empty response from AI');
    
    // Parse JSON
    let jsonText = text;
    if (text.includes('```json')) {
      jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (text.includes('```')) {
      jsonText = text.replace(/```\n?/g, '');
    }

    const parsedResult = JSON.parse(jsonText.trim());
    
    return {
      ats_analysis: parsedResult,
      resume_meta: {
        file_name: resumeFile.name,
        file_type: resumeFile.type,
        size_kb: Math.round(resumeFile.size / 1024)
      }
    };
  } catch (err) {
    console.error('ATS ONLY Error:', err);
    throw err;
  }
};

/**
 * Fallback analysis when Gemini API is unavailable
 * Provides a basic skill gap analysis based on simple comparison
 */
const generateFallbackAnalysis = (studentSkills, selectedRole, resumeFile = null) => {
  const requiredSkillNames = selectedRole.required_skills.map(s => s.name);
  const studentSkillsLower = studentSkills.map(s => s.toLowerCase());
  
  const matched = requiredSkillNames.filter(skill => 
    studentSkillsLower.includes(skill.toLowerCase())
  );
  
  const missing = requiredSkillNames.filter(skill => 
    !studentSkillsLower.includes(skill.toLowerCase())
  );

  // Calculate readiness score based on matched priority skills
  const priorityMatched = selectedRole.priority_skills.filter(skill =>
    studentSkillsLower.includes(skill.toLowerCase())
  );
  
  const readinessScore = Math.round(
    (matched.length / requiredSkillNames.length) * 60 +
    (priorityMatched.length / selectedRole.priority_skills.length) * 40
  );

  // Generate basic roadmap
  const roadmap = [];
  const highPriorityMissing = missing.filter(skill => 
    selectedRole.required_skills.find(s => s.name === skill && s.priority === 'high')
  );
  const mediumPriorityMissing = missing.filter(skill => 
    selectedRole.required_skills.find(s => s.name === skill && s.priority === 'medium')
  );

  if (highPriorityMissing.length > 0) {
    roadmap.push({
      month: 'Month 1-2',
      focus: 'Core Foundation Skills',
      skills: highPriorityMissing.slice(0, 3),
      resources: ['Official documentation', 'Free YouTube tutorials', 'Practice projects']
    });
  }

  if (highPriorityMissing.length > 3 || mediumPriorityMissing.length > 0) {
    roadmap.push({
      month: 'Month 3-4',
      focus: 'Intermediate Skills Development',
      skills: [...highPriorityMissing.slice(3), ...mediumPriorityMissing.slice(0, 2)],
      resources: ['Build mini-projects', 'Online coding platforms', 'Open source contributions']
    });
  }

  roadmap.push({
    month: 'Month 5-6',
    focus: 'Project Building & Interview Prep',
    skills: ['Portfolio Development', 'Interview Skills'],
    resources: ['Build 2-3 projects', 'LeetCode practice', 'Mock interviews']
  });

  return {
    career_role: selectedRole.role_name,
    readiness_score: readinessScore,
    score_breakdown: {
      technical_skills: readinessScore,
      projects: Math.max(20, readinessScore - 10),
      interview_readiness: Math.max(25, readinessScore - 5)
    },
    honest_assessment: matched.length > 0
      ? `You already have some alignment with ${selectedRole.role_name}, but there are still important gaps to close before placements.`
      : `You are still at the starting point for ${selectedRole.role_name}, so focus on the highest-priority fundamentals first.`,
    matched_skills: matched,
    missing_skills: missing,
    recommended_skills: highPriorityMissing.slice(0, 5),
    skill_priority_order: highPriorityMissing.slice(0, 5).map((skill) => ({
      skill,
      reason: 'High-priority requirement for this role',
      time_to_learn: '2-4 weeks',
      difficulty: 'Medium'
    })),
    learning_roadmap: roadmap,
    quick_wins: highPriorityMissing.slice(0, 3).map((skill) => ({
      task: `Start practicing ${skill}`,
      time: '1-2 hours',
      impact: `Improves alignment with ${selectedRole.role_name}`
    })),
    resume_tips: [
      'Use measurable impact in project bullet points',
      'Add keywords from the job role naturally in skills and projects'
    ],
    linkedin_tips: [
      `Mention your interest in ${selectedRole.role_name} clearly in the headline`,
      'Post weekly progress about projects and learning milestones'
    ],
    motivation: 'Consistent weekly effort will compound quickly if you keep building and practicing.',
    final_outcome: `You will have a much stronger profile for ${selectedRole.role_name} interviews after following the roadmap.`,
    ats_analysis: resumeFile ? {
      score: 55,
      summary: 'Resume uploaded, but ATS-specific AI analysis is unavailable right now. Use the suggestions below as a starter checklist.',
      strengths: ['Resume is available for review'],
      issues: ['Detailed ATS parsing could not be completed in fallback mode'],
      keyword_gaps: selectedRole.priority_skills.slice(0, 5),
      suggested_keywords: selectedRole.priority_skills.slice(0, 6),
      section_scores: {
        formatting: 60,
        keyword_match: 50,
        content_strength: 55,
        impact: 50
      },
      rewrite_suggestions: [
        'Rewrite project bullets with action verbs and outcomes',
        'Mirror important role keywords in the skills and projects sections'
      ]
    } : null,
    resume_meta: resumeFile ? {
      file_name: resumeFile.name,
      file_type: resumeFile.type || 'application/octet-stream'
    } : null
  };
};

export default analyzeT7LearningHub;
