/**
 * API Service — Enterprise Client Gateway
 * 
 * ZERO CLIENT SECRETS:
 * All database operations are proxied through the secure serverless gateway at /api/db.
 * No Supabase URLs or secret keys are exposed or bundled into the frontend client.
 */

async function callDbProxy(action, payload = {}) {
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Graceful handling if credentials are not yet added
      if (res.status === 503) {
        return { error: data.error || 'Database pending configuration', configured: false };
      }
      throw new Error(data?.error || `DB proxy error (${res.status})`);
    }
    return data;
  } catch (err) {
    console.warn(`[apiService] ${action} warning:`, err.message);
    return { error: err.message, failed: true };
  }
}

// ----------------------------------------------------------------
// 1. Profile Management
// ----------------------------------------------------------------
export const fetchUserProfile = async (userId) => {
  const res = await callDbProxy('getProfile', { userId });
  return res.profile || null;
};

export const saveUserProfile = async (userId, profileData) => {
  const res = await callDbProxy('updateProfile', { userId, profileData });
  return res.profile || profileData;
};

// ----------------------------------------------------------------
// 2. Skill Gap & Roadmap Analyses
// ----------------------------------------------------------------
export const saveAnalysisResult = async (userId, analysisData) => {
  const res = await callDbProxy('saveAnalysis', { userId, analysisData });
  return res.analysis?.id || null;
};

export const fetchLatestAnalysis = async (userId) => {
  const res = await callDbProxy('getLatestAnalysis', { userId });
  return res.analysis || null;
};

// ----------------------------------------------------------------
// 3. Resume Scans & ATS History
// ----------------------------------------------------------------
export const recordResumeScan = async (userId, scanData, analysisId = null, resumeMeta = {}) => {
  const res = await callDbProxy('saveResumeScan', { userId, scanData, analysisId, resumeMeta });
  return res.scan || null;
};

export const fetchResumeHistory = async (userId, limit = 5) => {
  const res = await callDbProxy('getResumeHistory', { userId, limit });
  return res.history || [];
};

// ----------------------------------------------------------------
// 4. Student Activity Timeline (Eliminates the "Re-Scan" issue)
// ----------------------------------------------------------------
export const fetchUserActivities = async (userId, limit = 10) => {
  const res = await callDbProxy('getActivities', { userId, limit });
  return res.activities || [];
};

export const recordUserActivity = async (userId, type, title, description = '', metadata = {}) => {
  const res = await callDbProxy('logActivity', { userId, type, title, description, metadata });
  return res.activity || null;
};

// ----------------------------------------------------------------
// 5. YouTube Learning Extension Sync
// ----------------------------------------------------------------
export const syncExtensionVideo = async (t7AccountId, videoData) => {
  const res = await callDbProxy('syncVideo', { t7AccountId, videoData });
  return res;
};

// Aliases for seamless drop-in compatibility
export const saveAnalysis = saveAnalysisResult;
export const getLatestAnalysis = fetchLatestAnalysis;

export const getVideoLearning = async (userId) => {
  const res = await callDbProxy('getVideoLearning', { userId });
  return res.videos || [];
};

export const getVideoLearningSkills = async (userId) => {
  const res = await callDbProxy('getVideoLearningSkills', { userId });
  return res.skills || [];
};

export const getCampusAnalytics = async () => {
  const res = await callDbProxy('getCampusAnalytics', {});
  return res.analytics || {
    totalStudents: 0,
    averageReadiness: 0,
    departmentBreakdown: {},
    topSkills: [],
    recentAnalyses: []
  };
};

// ----------------------------------------------------------------
// 6. DB Gateway Health Check
// ----------------------------------------------------------------
export const checkDbGatewayStatus = async () => {
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status' })
    });
    return await res.json();
  } catch {
    return { configured: false };
  }
};

