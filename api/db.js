/**
 * Vercel Serverless Function: /api/db
 * 
 * Enterprise Database Gateway for Supabase PostgreSQL.
 * ZERO CLIENT SECRETS: All database credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 * are server-only environment variables and are NEVER exposed to the browser.
 * 
 * Supported Actions (POST body: { action, payload }):
 *   - getProfile             { userId }
 *   - updateProfile          { userId, profileData }
 *   - saveAnalysis           { userId, analysisData }
 *   - getLatestAnalysis      { userId }
 *   - saveResumeScan         { userId, scanData, analysisId }
 *   - getResumeHistory       { userId, limit }
 *   - getActivities          { userId, limit }
 *   - logActivity            { userId, type, title, description, metadata }
 *   - syncVideo              { t7AccountId, videoData }
 *   - getVideoLearning       { userId }
 *   - getVideoLearningSkills { userId }
 *   - getCampusAnalytics     {}
 *   - status                 {}
 */

import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

function getSupabase() {
  const rawUrl = process.env.SUPABASE_URL || '';
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  const url = rawUrl.trim().replace(/^["']|["']$/g, '');
  const key = rawKey.trim().replace(/^["']|["']$/g, '');

  if (!url || !key) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false }
    });
  }
  return supabaseClient;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase();
  const { action, payload = {} } = req.body || {};

  // Status check endpoint (works even without credentials)
  if (action === 'status' || req.method === 'GET') {
    return res.status(200).json({
      configured: Boolean(supabase),
      hasUrl: Boolean(process.env.SUPABASE_URL),
      hasKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
      provider: 'Supabase PostgreSQL'
    });
  }

  // In-memory dev store when Supabase credentials are not yet added to .env
  if (!supabase) {
    return handleDevFallback(action, payload, res);
  }

  try {
    switch (action) {
      // -----------------------------------------------------------
      // 1. Student Profile
      // -----------------------------------------------------------
      case 'getProfile': {
        const { userId } = payload;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(200).json({ profile: null });

        // Normalize DB columns to frontend structure
        const normalized = {
          ...data,
          id: data.id || userId,
          uid: data.id || userId,
          name: data.full_name || data.name || '',
          branch: data.department || data.branch || '',
          college: data.college || '',
          passoutYear: data.year_of_study || data.passoutYear || '',
          phone: data.phone || '',
          role: data.role || 'student',
          t7Id: data.t7_account_id || data.t7Id || '',
          geminiApiKey: data.gemini_api_key || data.geminiApiKey || '',
          geminiModel: data.gemini_model || data.geminiModel || 'auto',
          targetRole: data.target_role || data.targetRole || '',
          targetRoleName: data.target_role_name || data.targetRoleName || '',
          career_interest: data.target_role || data.targetRole || data.career_interest || '',
          lastAnalysis: data.last_analysis || data.lastAnalysis || null
        };
        return res.status(200).json({ profile: normalized });
      }

      case 'updateProfile': {
        const { userId, profileData = {} } = payload;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        // Ensure email is resolved to satisfy NOT NULL constraint
        let userEmail = profileData.email;
        if (!userEmail) {
          const { data: existing } = await supabase.from('profiles').select('email').eq('id', userId).maybeSingle();
          if (existing?.email) {
            userEmail = existing.email;
          } else {
            const { data: authUser } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: null }));
            if (authUser?.user?.email) {
              userEmail = authUser.user.email;
            }
          }
        }

        const updates = {
          id: userId,
          email: userEmail || undefined,
          full_name: profileData.name !== undefined ? profileData.name : profileData.full_name,
          department: profileData.branch !== undefined ? profileData.branch : profileData.department,
          college: profileData.college,
          year_of_study: profileData.passoutYear !== undefined ? profileData.passoutYear : profileData.year_of_study,
          phone: profileData.phone,
          role: profileData.role || 'student',
          t7_account_id: profileData.t7Id !== undefined ? profileData.t7Id : profileData.t7_account_id,
          gemini_api_key: profileData.geminiApiKey !== undefined ? profileData.geminiApiKey : profileData.gemini_api_key,
          gemini_model: profileData.geminiModel !== undefined ? profileData.geminiModel : profileData.gemini_model,
          skills: profileData.skills,
          target_role: profileData.targetRole !== undefined ? profileData.targetRole : (profileData.target_role !== undefined ? profileData.target_role : profileData.career_interest),
          target_role_name: profileData.targetRoleName || profileData.target_role_name,
          updated_at: new Date().toISOString()
        };

        // Remove undefined keys
        Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

        const { data, error } = await supabase
          .from('profiles')
          .upsert(updates)
          .select()
          .single();

        if (error) throw error;

        const normalized = {
          ...data,
          id: data.id || userId,
          uid: data.id || userId,
          name: data.full_name || '',
          branch: data.department || '',
          college: data.college || '',
          passoutYear: data.year_of_study || '',
          phone: data.phone || '',
          role: data.role || 'student',
          t7Id: data.t7_account_id || '',
          geminiApiKey: data.gemini_api_key || data.geminiApiKey || '',
          geminiModel: data.gemini_model || data.geminiModel || 'auto',
          targetRole: data.target_role || data.targetRole || '',
          targetRoleName: data.target_role_name || data.targetRoleName || '',
          career_interest: data.target_role || data.targetRole || data.career_interest || '',
          lastAnalysis: data.last_analysis || data.lastAnalysis || null
        };
        return res.status(200).json({ profile: normalized });
      }

      // -----------------------------------------------------------
      // 2. Skill Gap & Roadmap Analyses
      // -----------------------------------------------------------
      case 'saveAnalysis': {
        const { userId, analysisData = {} } = payload;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const { data, error } = await supabase
          .from('skill_analyses')
          .insert({
            user_id: userId,
            career_role: analysisData.career_role || 'Target Role',
            readiness_score: analysisData.readiness_score || 0,
            score_breakdown: analysisData.score_breakdown || {},
            honest_assessment: analysisData.honest_assessment || '',
            matched_skills: analysisData.matched_skills || [],
            missing_skills: analysisData.missing_skills || [],
            recommended_skills: analysisData.recommended_skills || [],
            skill_priority_order: analysisData.skill_priority_order || [],
            learning_roadmap: analysisData.learning_roadmap || [],
            quick_wins: analysisData.quick_wins || [],
            resume_tips: analysisData.resume_tips || [],
            linkedin_tips: analysisData.linkedin_tips || [],
            motivation: analysisData.motivation || '',
            final_outcome: analysisData.final_outcome || ''
          })
          .select()
          .single();

        if (error) throw error;

        // Also update profiles.last_analysis for instant loading
        await supabase
          .from('profiles')
          .update({ last_analysis: analysisData, updated_at: new Date().toISOString() })
          .eq('id', userId);

        // Auto-save ATS scan if included in analysis
        if (analysisData.ats_analysis) {
          const ats = analysisData.ats_analysis;
          const meta = analysisData.resume_meta || {};
          await supabase.from('resume_scans').insert({
            user_id: userId,
            analysis_id: data.id,
            file_name: meta.file_name || meta.name || 'resume.pdf',
            file_type: meta.file_type || 'application/pdf',
            size_kb: meta.size_kb || 0,
            ats_score: ats.score || 0,
            summary: ats.summary || '',
            strengths: ats.strengths || [],
            issues: ats.issues || [],
            keyword_gaps: ats.keyword_gaps || [],
            suggested_keywords: ats.suggested_keywords || [],
            section_scores: ats.section_scores || {},
            rewrite_suggestions: ats.rewrite_suggestions || []
          }).catch(e => console.warn('Auto ATS save note:', e.message));
        }

        // Auto-log activity event
        await supabase.from('user_activities').insert({
          user_id: userId,
          activity_type: 'skill_analysis',
          title: `Completed ${analysisData.career_role || 'Career'} Audit (${analysisData.readiness_score || 0}% Ready)`,
          metadata: { analysis_id: data.id, role: analysisData.career_role }
        });

        return res.status(200).json({ analysis: data });
      }

      case 'getLatestAnalysis': {
        const { userId } = payload;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const { data, error } = await supabase
          .from('skill_analyses')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        return res.status(200).json({ analysis: data || null });
      }

      // -----------------------------------------------------------
      // 3. Resume Scans & ATS History
      // -----------------------------------------------------------
      case 'saveResumeScan': {
        const { userId, scanData = {}, analysisId = null, resumeMeta = {} } = payload;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const { data, error } = await supabase
          .from('resume_scans')
          .insert({
            user_id: userId,
            analysis_id: analysisId,
            file_name: resumeMeta.file_name || 'resume.pdf',
            file_type: resumeMeta.file_type || 'application/pdf',
            size_kb: resumeMeta.size_kb || 0,
            ats_score: scanData.score || 0,
            summary: scanData.summary || '',
            strengths: scanData.strengths || [],
            issues: scanData.issues || [],
            keyword_gaps: scanData.keyword_gaps || [],
            suggested_keywords: scanData.suggested_keywords || [],
            section_scores: scanData.section_scores || {},
            rewrite_suggestions: scanData.rewrite_suggestions || []
          })
          .select()
          .single();

        if (error) throw error;

        // Log activity
        await supabase.from('user_activities').insert({
          user_id: userId,
          activity_type: 'ats_scan',
          title: `Resume ATS Audit: ${scanData.score || 0}% Score`,
          metadata: { scan_id: data.id, score: scanData.score }
        });

        return res.status(200).json({ scan: data });
      }

      case 'getResumeHistory': {
        const { userId, limit = 5 } = payload;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const { data, error } = await supabase
          .from('resume_scans')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return res.status(200).json({ history: data || [] });
      }

      // -----------------------------------------------------------
      // 4. Student Activity Timeline
      // -----------------------------------------------------------
      case 'getActivities': {
        const { userId, limit = 10 } = payload;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const { data, error } = await supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return res.status(200).json({ activities: data || [] });
      }

      case 'logActivity': {
        const { userId, type, title, description = '', metadata = {} } = payload;
        if (!userId || !title) return res.status(400).json({ error: 'userId and title are required' });

        const { data, error } = await supabase
          .from('user_activities')
          .insert({
            user_id: userId,
            activity_type: type || 'general',
            title,
            description,
            metadata
          })
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json({ activity: data });
      }

      // -----------------------------------------------------------
      // 5. YouTube Extension Video Sync & Learning Records
      // -----------------------------------------------------------
      case 'syncVideo': {
        const { t7AccountId, videoData = {} } = payload;
        if (!t7AccountId) return res.status(400).json({ error: 't7AccountId is required' });

        // Find user by T7 Account ID or UUID fallback
        let userProfile = null;
        const { data: byT7 } = await supabase
          .from('profiles')
          .select('id, skills')
          .eq('t7_account_id', t7AccountId)
          .maybeSingle();

        if (byT7) {
          userProfile = byT7;
        } else {
          const { data: byId } = await supabase
            .from('profiles')
            .select('id, skills')
            .eq('id', t7AccountId)
            .maybeSingle();
          if (byId) userProfile = byId;
        }

        if (!userProfile) {
          return res.status(404).json({ error: 'Invalid T7 Account ID. Please verify in profile settings.' });
        }

        const userId = userProfile.id;

        // Insert video log
        const { data: logEntry, error: logErr } = await supabase
          .from('video_learning')
          .insert({
            user_id: userId,
            video_id: videoData.videoId || '',
            video_title: videoData.videoTitle || 'YouTube Video',
            video_url: videoData.videoUrl || '',
            channel_title: videoData.channelTitle || '',
            detected_skills: videoData.detectedSkills || [],
            summary: videoData.summary || ''
          })
          .select()
          .single();

        if (logErr) throw logErr;

        // Merge detected skills into user's profile skills
        if (videoData.detectedSkills && videoData.detectedSkills.length > 0) {
          const currentSkills = new Set(userProfile.skills || []);
          videoData.detectedSkills.forEach(s => currentSkills.add(s));
          await supabase
            .from('profiles')
            .update({ skills: Array.from(currentSkills), updated_at: new Date().toISOString() })
            .eq('id', userId);
        }

        // Log activity
        await supabase.from('user_activities').insert({
          user_id: userId,
          activity_type: 'youtube_sync',
          title: `Watched: ${videoData.videoTitle || 'Educational Video'}`,
          metadata: { video_id: videoData.videoId, skills: videoData.detectedSkills || [] }
        });

        return res.status(200).json({ success: true, log: logEntry });
      }

      case 'getVideoLearning': {
        const { userId } = payload;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        let targetUserId = userId;
        if (typeof userId === 'string' && userId.startsWith('T7-')) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('id')
            .eq('t7_account_id', userId)
            .maybeSingle();
          if (prof?.id) targetUserId = prof.id;
        }

        const { data, error } = await supabase
          .from('video_learning')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const videos = (data || []).map(row => ({
          id: row.id,
          videoId: row.video_id || '',
          title: row.video_title || 'YouTube Video',
          videoUrl: row.video_url || '',
          channelTitle: row.channel_title || '',
          topSkills: Array.isArray(row.detected_skills) ? row.detected_skills : [],
          summary: row.summary || '',
          date: row.created_at,
          rating: 4.8,
          relevance: 92
        }));

        return res.status(200).json({ videos });
      }

      case 'getVideoLearningSkills': {
        const { userId } = payload;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        let targetUserId = userId;
        if (typeof userId === 'string' && userId.startsWith('T7-')) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('id')
            .eq('t7_account_id', userId)
            .maybeSingle();
          if (prof?.id) targetUserId = prof.id;
        }

        const { data, error } = await supabase
          .from('video_learning')
          .select('detected_skills')
          .eq('user_id', targetUserId);

        if (error) throw error;

        const JUNK_WORDS = new Set([
          'this', 'that', 'with', 'from', 'video', 'the', 'and', 'for', 'are',
          'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our',
          'out', 'has', 'have', 'been', 'will', 'more', 'when', 'who', 'how',
          'what', 'where', 'why', 'which', 'their', 'them', 'then', 'than',
          'into', 'also', 'just', 'about', 'would', 'make', 'like', 'time',
          'very', 'your', 'some', 'could', 'each', 'other', 'many', 'most',
          'such', 'only', 'over', 'here', 'both', 'after', 'these', 'those',
          'learn', 'learning', 'course', 'tutorial', 'beginners', 'beginner',
          'full', 'complete', 'introduction', 'intro', 'basic', 'basics'
        ]);

        const skillSet = new Set();
        (data || []).forEach(row => {
          (row.detected_skills || []).forEach(skill => {
            if (skill && typeof skill === 'string' && skill.trim().length >= 2) {
              const cleaned = skill.trim();
              if (!JUNK_WORDS.has(cleaned.toLowerCase())) {
                skillSet.add(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
              }
            }
          });
        });

        return res.status(200).json({ skills: Array.from(skillSet) });
      }

      // -----------------------------------------------------------
      // 6. Campus Analytics (Admin View)
      // -----------------------------------------------------------
      case 'getCampusAnalytics': {
        const { data: analyses, error: anErr } = await supabase
          .from('skill_analyses')
          .select('*')
          .order('created_at', { ascending: false });

        if (anErr) throw anErr;

        const { data: profiles, error: prErr } = await supabase
          .from('profiles')
          .select('id, department, college, role');

        if (prErr) throw prErr;

        const allAnalyses = analyses || [];
        const studentProfiles = (profiles || []).filter(p => p.role !== 'admin');
        const uniqueUserIds = new Set(allAnalyses.map(a => a.user_id));
        const totalStudents = Math.max(studentProfiles.length, uniqueUserIds.size);

        let averageReadiness = 0;
        if (allAnalyses.length > 0) {
          const totalScore = allAnalyses.reduce((sum, a) => sum + (a.readiness_score || 0), 0);
          averageReadiness = Math.round(totalScore / allAnalyses.length);
        }

        const skillCount = {};
        allAnalyses.forEach(a => {
          (a.missing_skills || []).forEach(skill => {
            if (skill && typeof skill === 'string') {
              const s = skill.trim();
              if (s) skillCount[s] = (skillCount[s] || 0) + 1;
            }
          });
        });

        const topMissingSkills = Object.entries(skillCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([skill, count]) => ({ skill, count }));

        const roleStats = {};
        allAnalyses.forEach(a => {
          const role = a.career_role || 'Target Role';
          if (!roleStats[role]) roleStats[role] = { totalScore: 0, count: 0 };
          roleStats[role].totalScore += (a.readiness_score || 0);
          roleStats[role].count += 1;
        });

        const roleWiseStats = Object.entries(roleStats).map(([role, stats]) => ({
          role,
          averageScore: Math.round(stats.totalScore / stats.count),
          studentCount: stats.count
        }));

        return res.status(200).json({
          analytics: {
            totalStudents,
            averageReadiness,
            topMissingSkills,
            roleWiseStats
          }
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: "${action}"` });
    }
  } catch (err) {
    console.error('[/api/db] Error:', err);
    return res.status(500).json({ error: err.message || 'Database operation failed' });
  }
}

// ----------------------------------------------------------------
// Local Dev In-Memory Fallback (Active until SUPABASE_URL is provided)
// ----------------------------------------------------------------
const devDb = {
  profiles: new Map(),
  analyses: new Map(),
  activities: new Map(),
  scans: new Map(),
  videos: new Map(),
};

function handleDevFallback(action, payload, res) {
  const { userId } = payload;
  const now = new Date().toISOString();

  switch (action) {
    case 'getProfile': {
      const profile = devDb.profiles.get(userId) || null;
      if (profile) {
        profile.id = profile.id || userId;
        profile.uid = profile.uid || userId;
        profile.career_interest = profile.career_interest || profile.targetRole || profile.target_role || '';
      }
      return res.status(200).json({ profile, devMode: true });
    }

    case 'updateProfile': {
      const existing = devDb.profiles.get(userId) || {};
      const targetRoleVal = payload.profileData.targetRole || payload.profileData.target_role || payload.profileData.career_interest || existing.target_role || existing.targetRole || '';
      const updated = {
        ...existing,
        ...payload.profileData,
        id: userId,
        uid: userId,
        target_role: targetRoleVal,
        targetRole: targetRoleVal,
        career_interest: payload.profileData.career_interest || targetRoleVal,
        geminiApiKey: payload.profileData.geminiApiKey || existing.geminiApiKey || '',
        geminiModel: payload.profileData.geminiModel || existing.geminiModel || 'auto',
        updated_at: now
      };
      devDb.profiles.set(userId, updated);
      return res.status(200).json({ profile: updated, devMode: true });
    }

    case 'saveAnalysis': {
      const id = 'analysis-' + Date.now();
      const analysis = { id, user_id: userId, ...payload.analysisData, created_at: now };
      if (!devDb.analyses.has(userId)) devDb.analyses.set(userId, []);
      devDb.analyses.get(userId).unshift(analysis);

      // Update profile
      const prof = devDb.profiles.get(userId) || { id: userId };
      prof.last_analysis = payload.analysisData;
      devDb.profiles.set(userId, prof);

      return res.status(200).json({ analysis, devMode: true });
    }

    case 'getLatestAnalysis': {
      const list = devDb.analyses.get(userId) || [];
      return res.status(200).json({ analysis: list[0] || null, devMode: true });
    }

    case 'saveResumeScan': {
      const id = 'scan-' + Date.now();
      const scan = { id, user_id: userId, ...payload.scanData, meta: payload.resumeMeta, created_at: now };
      if (!devDb.scans.has(userId)) devDb.scans.set(userId, []);
      devDb.scans.get(userId).unshift(scan);
      return res.status(200).json({ scan, devMode: true });
    }

    case 'getResumeHistory': {
      const list = devDb.scans.get(userId) || [];
      return res.status(200).json({ history: list.slice(0, payload.limit || 5), devMode: true });
    }

    case 'getActivities': {
      const list = devDb.activities.get(userId) || [];
      return res.status(200).json({ activities: list.slice(0, payload.limit || 10), devMode: true });
    }

    case 'logActivity': {
      const id = 'act-' + Date.now();
      const act = { id, user_id: userId, type: payload.type, title: payload.title, metadata: payload.metadata, created_at: now };
      if (!devDb.activities.has(userId)) devDb.activities.set(userId, []);
      devDb.activities.get(userId).unshift(act);
      return res.status(200).json({ activity: act, devMode: true });
    }

    case 'syncVideo': {
      const { t7AccountId, videoData = {} } = payload;
      let targetId = t7AccountId;
      for (const [uid, prof] of devDb.profiles.entries()) {
        if (prof.t7Id === t7AccountId || prof.t7_account_id === t7AccountId) {
          targetId = uid;
          break;
        }
      }
      if (!devDb.videos.has(targetId)) devDb.videos.set(targetId, []);
      const vidObj = {
        id: 'vid-' + Date.now(),
        videoId: videoData.videoId || '',
        title: videoData.videoTitle || 'YouTube Video',
        videoUrl: videoData.videoUrl || '',
        channelTitle: videoData.channelTitle || '',
        topSkills: videoData.detectedSkills || [],
        summary: videoData.summary || '',
        date: now,
        rating: 4.8,
        relevance: 92
      };
      devDb.videos.get(targetId).unshift(vidObj);
      return res.status(200).json({ success: true, devMode: true, log: vidObj });
    }

    case 'getVideoLearning': {
      const list = devDb.videos.get(userId) || [];
      return res.status(200).json({ videos: list, devMode: true });
    }

    case 'getVideoLearningSkills': {
      const list = devDb.videos.get(userId) || [];
      const skillSet = new Set();
      list.forEach(v => {
        (v.topSkills || []).forEach(s => {
          if (s && typeof s === 'string') skillSet.add(s.charAt(0).toUpperCase() + s.slice(1));
        });
      });
      return res.status(200).json({ skills: Array.from(skillSet), devMode: true });
    }

    case 'getCampusAnalytics': {
      let allAnalyses = [];
      devDb.analyses.forEach(list => { allAnalyses = allAnalyses.concat(list); });
      
      const totalStudents = Math.max(devDb.profiles.size, devDb.analyses.size, 1);
      const avgScore = allAnalyses.length > 0
        ? Math.round(allAnalyses.reduce((s, a) => s + (a.readiness_score || 0), 0) / allAnalyses.length)
        : 74;

      const topMissingSkills = [
        { skill: 'Docker & Kubernetes', count: 18 },
        { skill: 'System Design', count: 15 },
        { skill: 'Microservices Architecture', count: 12 },
        { skill: 'TypeScript', count: 10 },
        { skill: 'Cloud (AWS/GCP)', count: 9 },
        { skill: 'Redis Caching', count: 7 }
      ];

      const roleWiseStats = [
        { role: 'Full Stack Developer', averageScore: 74, studentCount: 14 },
        { role: 'AI / ML Engineer', averageScore: 68, studentCount: 9 },
        { role: 'Data Analyst', averageScore: 81, studentCount: 11 },
        { role: 'DevOps Engineer', averageScore: 64, studentCount: 6 }
      ];

      return res.status(200).json({
        analytics: {
          totalStudents,
          averageReadiness: avgScore,
          topMissingSkills,
          roleWiseStats
        },
        devMode: true
      });
    }

    default:
      return res.status(200).json({ success: true, devMode: true });
  }
}
