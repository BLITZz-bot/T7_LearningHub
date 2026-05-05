/**
 * Consolidated API Service for T7 Learning Hub
 * Combines Firestore Database operations and Gemini AI Analysis
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// --- GEMINI AI FUNCTIONS ---

const SKILL_GAP_PROMPT = `
You are an expert Career Coach and ATS (Applicant Tracking System) Specialist.
Analyze the provided student skills against the target job role.

Return a JSON object with EXACTLY this structure:
{
  "readiness_score": number (0-100),
  "score_breakdown": {
    "technical": number,
    "projects": number,
    "interview": number
  },
  "honest_assessment": "short professional feedback",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill - reason why it's missing"],
  "recommended_skills": ["skill1", "skill2"],
  "skill_priority_order": [
    { "skill": "string", "reason": "string", "time": "string", "difficulty": "string" }
  ],
  "learning_roadmap": [
    {
      "month": "Month 1",
      "goal": "string",
      "weeks": [
        { "week": 1, "tasks": ["task1"], "resources": ["resource1"] }
      ]
    }
  ],
  "quick_wins": [{ "task": "string", "impact": "string" }],
  "resume_tips": ["tip1"],
  "linkedin_tips": ["tip1"],
  "motivation": "inspirational quote",
  "final_outcome": "career vision",
  "ats_analysis": {
    "overall_score": number,
    "summary": "string",
    "strengths": ["string"],
    "critical_issues": ["string"],
    "keyword_gaps": ["string"],
    "rewrite_suggestions": [{ "original": "string", "improved": "string" }]
  }
}
`;

/**
 * Convert file to generative part (for resume processing)
 */
const fileToGenerativePart = async (file) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeT7LearningHub = async (studentSkills, selectedRole, allRoles, resumeFile = null) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt = `Role: ${selectedRole.role_name}\nStudent Skills: ${studentSkills.join(", ")}\n\n${SKILL_GAP_PROMPT}`;
    
    let parts = [{ text: prompt }];
    if (resumeFile) {
      const resumePart = await fileToGenerativePart(resumeFile);
      parts.push(resumePart);
      prompt += "\n\nAlso analyze the attached resume for ATS optimization.";
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();
    
    // Improved JSON parsing
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");
    
    const analysisResult = JSON.parse(jsonMatch[0]);
    
    // Ensure all required fields exist for Results.jsx
    return {
      ...analysisResult,
      career_role: selectedRole.role_name,
      readiness_score: analysisResult.readiness_score || analysisResult.score || 0,
      ats_analysis: analysisResult.ats_analysis ? {
        ...analysisResult.ats_analysis,
        overall_score: analysisResult.ats_analysis.overall_score || analysisResult.ats_analysis.score || 0,
        critical_issues: analysisResult.ats_analysis.critical_issues || analysisResult.ats_analysis.issues || []
      } : null
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback
    return generateFallbackAnalysis(studentSkills, selectedRole);
  }
};

const generateFallbackAnalysis = (studentSkills, selectedRole) => {
  const matched = studentSkills.slice(0, 3);
  const missing = selectedRole.required_skills.slice(0, 5).map(s => `${s.name} - Essential for role`);
  return {
    career_role: selectedRole.role_name,
    readiness_score: 40,
    score_breakdown: { technical: 40, projects: 30, interview: 30 },
    honest_assessment: "Basic roadmap generated due to service limits.",
    matched_skills: matched,
    missing_skills: missing,
    recommended_skills: missing.slice(0, 3),
    skill_priority_order: missing.slice(0, 3).map(s => ({ skill: s.split(' - ')[0], reason: "High priority", time: "2 weeks", difficulty: "Medium" })),
    learning_roadmap: [{ month: "Month 1", goal: "Fundamentals", weeks: [{ week: 1, tasks: ["Initial setup"], resources: ["Docs"] }] }],
    quick_wins: [{ task: "Audit skills", impact: "High" }],
    resume_tips: ["Add keywords"],
    linkedin_tips: ["Update headline"],
    motivation: "Start today!",
    final_outcome: "Career success",
    ats_analysis: null
  };
};

// --- FIRESTORE FUNCTIONS ---

export const saveAnalysis = async (userId, analysisData) => {
  try {
    const analysisRef = collection(db, 'skill_analysis');
    const docRef = await addDoc(analysisRef, {
      userId,
      ...analysisData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving:', error);
    throw error;
  }
};

export const getLatestAnalysis = async (userId) => {
  try {
    const analysisRef = collection(db, 'skill_analysis');
    const q = query(analysisRef, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('Error fetching latest:', error);
    return null;
  }
};

export const getUserLearningActivity = async (userId) => {
  try {
    const activityRef = collection(db, 'learning_logs');
    const q = query(activityRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching activity:', error);
    return [];
  }
};


/**
 * Admin: Get all analyses for campus-wide insights
 */
export const getAllAnalyses = async () => {
  try {
    const analysisRef = collection(db, 'skill_analysis');
    const q = query(analysisRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching all:', error);
    return [];
  }
};

/**
 * Admin: Get aggregated campus analytics
 */
export const getCampusAnalytics = async () => {
  try {
    const analyses = await getAllAnalyses();
    if (analyses.length === 0) {
      return { totalStudents: 0, averageReadiness: 0, topMissingSkills: [], roleWiseStats: [] };
    }

    const uniqueUsers = new Set(analyses.map(a => a.userId));
    const totalScore = analyses.reduce((sum, a) => sum + (a.readiness_score || a.overall_score || 0), 0);
    
    const skillCount = {};
    analyses.forEach(a => {
      (a.missing_skills || []).forEach(s => skillCount[s] = (skillCount[s] || 0) + 1);
    });

    const topMissingSkills = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    const roleStats = {};
    analyses.forEach(a => {
      const role = a.career_role || 'Unknown';
      if (!roleStats[role]) roleStats[role] = { totalScore: 0, count: 0 };
      roleStats[role].totalScore += (a.readiness_score || a.overall_score || 0);
      roleStats[role].count += 1;
    });

    const roleWiseStats = Object.entries(roleStats).map(([role, stats]) => ({
      role,
      averageScore: Math.round(stats.totalScore / stats.count),
      studentCount: stats.count
    }));

    return { totalStudents: uniqueUsers.size, averageReadiness: Math.round(totalScore / analyses.length), topMissingSkills, roleWiseStats };
  } catch (error) {
    console.error('Error analytics:', error);
    return { totalStudents: 0, averageReadiness: 0, topMissingSkills: [], roleWiseStats: [] };
  }
};

export default {
  analyzeT7LearningHub,
  saveAnalysis,
  getLatestAnalysis,
  getUserLearningActivity,
  getAllAnalyses,
  getCampusAnalytics
};
