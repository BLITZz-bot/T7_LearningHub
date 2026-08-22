/**
 * Firestore Service
 * 
 * Handles all Firestore database operations for:
 * - User profiles
 * - Skill analyses
 * - Admin aggregations
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

/**
 * Save skill analysis result to Firestore
 * 
 * @param {string} userId - User ID
 * @param {object} analysisData - Analysis result from Gemini
 * @returns {Promise<string>} - Document ID of saved analysis
 */
export const saveAnalysis = async (userId, analysisData) => {
  try {
    const analysisRef = collection(db, 'skill_analysis');
    const docRef = await addDoc(analysisRef, {
      userId,
      career_role: analysisData.career_role,
      readiness_score: analysisData.readiness_score,
      score_breakdown: analysisData.score_breakdown || {},
      honest_assessment: analysisData.honest_assessment || '',
      matched_skills: analysisData.matched_skills,
      missing_skills: analysisData.missing_skills,
      recommended_skills: analysisData.recommended_skills,
      skill_priority_order: analysisData.skill_priority_order || [],
      learning_roadmap: analysisData.learning_roadmap,
      quick_wins: analysisData.quick_wins || [],
      resume_tips: analysisData.resume_tips || [],
      linkedin_tips: analysisData.linkedin_tips || [],
      motivation: analysisData.motivation || '',
      final_outcome: analysisData.final_outcome || '',
      ats_analysis: analysisData.ats_analysis || null,
      resume_meta: analysisData.resume_meta || null,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving analysis:', error);
    throw error;
  }
};

/**
 * Get the latest analysis for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} - Latest analysis or null
 */
export const getLatestAnalysis = async (userId) => {
  try {
    const analysisRef = collection(db, 'skill_analysis');
    try {
      const q = query(
        analysisRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (queryErr) {
      // Graceful fallback if composite index is not yet created
      console.warn('Composite index fallback for getLatestAnalysis:', queryErr.message);
      const qFallback = query(analysisRef, where('userId', '==', userId));
      const snapshot = await getDocs(qFallback);
      if (snapshot.empty) return null;
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (new Date(a.createdAt || 0)).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (new Date(b.createdAt || 0)).getTime();
        return timeB - timeA;
      });
      return docs[0] || null;
    }
  } catch (error) {
    console.error('Error fetching latest analysis:', error);
    return null;
  }
};

/**
 * Get all analyses for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object[]>} - Array of analyses
 */
export const getUserAnalyses = async (userId) => {
  try {
    const analysisRef = collection(db, 'skill_analysis');
    try {
      const q = query(
        analysisRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (queryErr) {
      // Graceful fallback if composite index is not yet created
      console.warn('Composite index fallback for getUserAnalyses:', queryErr.message);
      const qFallback = query(analysisRef, where('userId', '==', userId));
      const snapshot = await getDocs(qFallback);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (new Date(a.createdAt || 0)).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (new Date(b.createdAt || 0)).getTime();
        return timeB - timeA;
      });
      return docs;
    }
  } catch (error) {
    console.error('Error fetching user analyses:', error);
    return [];
  }
};

/**
 * Admin: Get all analyses for campus-wide insights
 * 
 * @returns {Promise<object[]>} - All analyses
 */
export const getAllAnalyses = async () => {
  try {
    const analysisRef = collection(db, 'skill_analysis');
    const q = query(analysisRef, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching all analyses:', error);
    return [];
  }
};

/**
 * Admin: Get aggregated campus analytics
 * 
 * @returns {Promise<object>} - Aggregated analytics data
 */
export const getCampusAnalytics = async () => {
  try {
    const analyses = await getAllAnalyses();
    
    if (analyses.length === 0) {
      return {
        totalStudents: 0,
        averageReadiness: 0,
        topMissingSkills: [],
        roleWiseStats: {}
      };
    }

    // Calculate total students analyzed
    const uniqueUsers = new Set(analyses.map(a => a.userId));
    const totalStudents = uniqueUsers.size;

    // Calculate average readiness score
    const totalScore = analyses.reduce((sum, a) => sum + (a.readiness_score || 0), 0);
    const averageReadiness = Math.round(totalScore / analyses.length);

    // Calculate most missing skills
    const skillCount = {};
    analyses.forEach(analysis => {
      (analysis.missing_skills || []).forEach(skill => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });

    const topMissingSkills = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Calculate role-wise statistics
    const roleStats = {};
    analyses.forEach(analysis => {
      const role = analysis.career_role || 'Unknown';
      if (!roleStats[role]) {
        roleStats[role] = { totalScore: 0, count: 0 };
      }
      roleStats[role].totalScore += analysis.readiness_score || 0;
      roleStats[role].count += 1;
    });

    const roleWiseStats = Object.entries(roleStats).map(([role, stats]) => ({
      role,
      averageScore: Math.round(stats.totalScore / stats.count),
      studentCount: stats.count
    }));

    return {
      totalStudents,
      averageReadiness,
      topMissingSkills,
      roleWiseStats
    };
  } catch (error) {
    console.error('Error calculating campus analytics:', error);
    return {
      totalStudents: 0,
      averageReadiness: 0,
      topMissingSkills: [],
      roleWiseStats: []
    };
  }
};

/**
 * Get all students (for admin view)
 * 
 * @returns {Promise<object[]>} - Array of student profiles
 */
export const getAllStudents = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'student'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

/**
 * Get all video learning entries for a user (synced from extension)
 * 
 * @param {string} userId - Firebase Auth UID (used as accountId in extension)
 * @returns {Promise<object[]>} - Array of video learning entries
 */
export const getVideoLearning = async (userId) => {
  try {
    const videoRef = collection(db, 'users', userId, 'videoLearning');
    const q = query(videoRef, orderBy('date', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        videoId: data.videoId || '',
        title: data.title || '',
        date: data.date || null,
        rating: data.rating || 0,
        relevance: data.relevance || 0,
        summary: data.summary || '',
        topSkills: (data.topSkills || [])
          .map(s => typeof s === 'string' ? s : s.stringValue || s)
          .filter(s => s && s.length >= 3 && !['this','that','with','from','video','the','and','for','are','you','was','has','have','not','but','can','our','out','how','who','its','all','one','get','use','also','just','well','using','best','good','great','like','make','each','only','over','been','will','more','some','very','your','many','most','such','here','both','does','learn','learning','course','tutorial','beginners','beginner','full','complete','introduction','intro','basic','basics','covers','covered','about','programming','coding','development','software','computer','science','technology','tech','web','app','application','build','building','create','creating','work','working','first','second','part','step','into','new','way','data','code','guide','master','advanced','intermediate','everything','need','know','start','started','getting','understanding','concepts','overview','easy','hard','simple','free','paid','online','project','projects','skill','skills','topics','topic','different','important','essential'].includes(s.toLowerCase().trim()))
      };
    });
  } catch (error) {
    console.error('Error fetching video learning:', error);
    return [];
  }
};

/**
 * Extract unique skills learned from all YouTube videos
 * 
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<string[]>} - Deduplicated array of skill names
 */
export const getVideoLearningSkills = async (userId) => {
  // Common words that are NOT skills (filter out old bad data)
  const JUNK_WORDS = new Set([
    'this', 'that', 'with', 'from', 'video', 'the', 'and', 'for', 'are',
    'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our',
    'out', 'has', 'have', 'been', 'will', 'more', 'when', 'who', 'how',
    'what', 'where', 'why', 'which', 'their', 'them', 'then', 'than',
    'into', 'also', 'just', 'about', 'would', 'make', 'like', 'time',
    'very', 'your', 'some', 'could', 'each', 'other', 'many', 'most',
    'such', 'only', 'over', 'here', 'both', 'after', 'these', 'those',
    'being', 'does', 'doing', 'during', 'before', 'between', 'through',
    'learn', 'learning', 'course', 'tutorial', 'beginners', 'beginner',
    'full', 'complete', 'introduction', 'intro', 'basic', 'basics',
    'covers', 'covered', 'best', 'well', 'good', 'great', 'using',
    'programming', 'coding', 'development', 'software', 'computer',
    'science', 'technology', 'tech', 'web', 'app', 'application',
    'build', 'building', 'create', 'creating', 'work', 'working',
    'first', 'second', 'part', 'step', 'into', 'new', 'way', 'data',
    'code', 'guide', 'master', 'advanced', 'intermediate', 'everything',
    'need', 'know', 'start', 'started', 'getting', 'understanding',
    'concepts', 'overview', 'easy', 'hard', 'simple', 'free', 'paid',
    'online', 'project', 'projects', 'skill', 'skills', 'topics',
    'topic', 'different', 'important', 'essential'
  ]);

  try {
    const videos = await getVideoLearning(userId);
    const skillSet = new Set();
    videos.forEach(video => {
      (video.topSkills || []).forEach(skill => {
        if (skill && typeof skill === 'string' && skill.length >= 3) {
          const lower = skill.toLowerCase().trim();
          if (!JUNK_WORDS.has(lower)) {
            // Capitalize first letter for consistency
            skillSet.add(skill.charAt(0).toUpperCase() + skill.slice(1));
          }
        }
      });
    });
    return Array.from(skillSet);
  } catch (error) {
    console.error('Error extracting video skills:', error);
    return [];
  }
};

export default {
  saveAnalysis,
  getLatestAnalysis,
  getUserAnalyses,
  getAllAnalyses,
  getCampusAnalytics,
  getAllStudents,
  getVideoLearning,
  getVideoLearningSkills
};

