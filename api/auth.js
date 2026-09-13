/**
 * Vercel Serverless Function: /api/auth
 * 
 * Enterprise Authentication Gateway for Supabase Auth.
 * ZERO CLIENT SECRETS: The client never talks to Supabase Auth directly.
 * All credentials remain securely inside server-side environment variables.
 * 
 * Supported Actions (POST body: { action, payload }):
 *   - signup  { email, password, fullName, meta }
 *   - login   { email, password }
 *   - getUser { accessToken }
 *   - logout  { accessToken }
 *   - status  {}
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

  // Status check endpoint
  if (action === 'status' || req.method === 'GET') {
    return res.status(200).json({
      configured: Boolean(supabase),
      hasUrl: Boolean(process.env.SUPABASE_URL),
      hasKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
      provider: 'Supabase Auth'
    });
  }

  // Graceful fallback for local development if credentials haven't been pasted into .env yet
  if (!supabase) {
    if (action === 'signup' || action === 'login') {
      const email = payload.email || 'student@t7hub.local';
      const mockId = 'demo-user-' + Buffer.from(email).toString('hex').substring(0, 12);
      const mockUser = {
        id: mockId,
        uid: mockId,
        email,
        user_metadata: { full_name: payload.fullName || payload.name || 'Demo Student' }
      };
      const mockSession = {
        access_token: 'mock-session-token-' + Date.now(),
        user: mockUser
      };
      return res.status(200).json({
        user: mockUser,
        session: mockSession,
        mode: 'demo-local'
      });
    }

    if (action === 'getUser') {
      return res.status(200).json({
        user: { id: 'demo-user', email: 'student@t7hub.local' },
        mode: 'demo-local'
      });
    }

    if (action === 'exchangeCode' || action === 'googleOAuth') {
      const mockUser = {
        id: 'demo-user-google',
        uid: 'demo-user-google',
        email: 'student@t7hub.local',
        user_metadata: { full_name: 'Demo Student' }
      };
      return res.status(200).json({
        user: mockUser,
        session: { access_token: 'mock-session-token-' + Date.now(), user: mockUser },
        isNewUser: false,
        profile: null,
        url: payload.redirectTo || 'http://localhost:3000/dashboard',
        mode: 'demo-local'
      });
    }

    if (action === 'logout') {
      return res.status(200).json({ success: true });
    }

    return res.status(503).json({
      error: 'Supabase credentials are not yet configured in .env',
      configured: false
    });
  }

  try {
    switch (action) {
      case 'signup': {
        const { email, password, fullName, meta = {} } = payload;
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || '', ...meta }
          }
        });

        if (error) throw error;

        // Auto-provision student profile row
        if (data?.user) {
          const t7Id = 'T7-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName || '',
            college: meta.college || 'Engineering College',
            department: meta.branch || 'Computer Science',
            year_of_study: meta.passoutYear || '3rd Year',
            phone: meta.phone || '',
            t7_account_id: t7Id
          }).catch(err => console.warn('Profile provisioning note:', err.message));
        }

        return res.status(200).json({
          user: data.user,
          session: data.session
        });
      }

      case 'googleOAuth': {
        const { redirectTo } = payload;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectTo || 'http://localhost:3000/dashboard',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        });

        if (error) throw error;
        return res.status(200).json({ url: data.url });
      }

      case 'exchangeCode': {
        const { code } = payload;
        if (!code) {
          return res.status(400).json({ error: 'Auth code is required' });
        }
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        let isNewUser = false;
        let profile = null;
        if (data?.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          profile = prof;
          if (!prof || !prof.college || !prof.department || prof.college === 'Engineering College') {
            isNewUser = true;
          }
        }

        return res.status(200).json({
          user: data.user,
          session: data.session,
          isNewUser,
          profile
        });
      }

      case 'login': {
        const { email, password } = payload;
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        return res.status(200).json({
          user: data.user,
          session: data.session
        });
      }

      case 'getUser': {
        const authHeader = req.headers.authorization || '';
        const token = payload.accessToken || (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

        if (!token) return res.status(401).json({ error: 'Access token required' });

        const { data, error } = await supabase.auth.getUser(token);
        if (error) throw error;

        let isNewUser = false;
        let profile = null;
        if (data?.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          profile = prof;
          if (!prof || !prof.college || !prof.department || prof.college === 'Engineering College') {
            isNewUser = true;
          }
        }

        return res.status(200).json({
          user: data.user,
          isNewUser,
          profile
        });
      }

      case 'logout': {
        const authHeader = req.headers.authorization || '';
        const token = payload.accessToken || (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

        if (token && supabase.auth.admin) {
          await supabase.auth.admin.signOut(token).catch(() => {});
        }
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: "${action}"` });
    }
  } catch (err) {
    console.error('[/api/auth] Error:', err);
    return res.status(400).json({ error: err.message || 'Authentication error' });
  }
}
