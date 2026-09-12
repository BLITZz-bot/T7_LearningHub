/**
 * Authentication Context — Enterprise Zero-Client-Secrets Gateway
 * 
 * All authentication and profile management are securely proxied through
 * /api/auth and /api/db serverless gateways.
 * ZERO CLIENT SECRETS: No Supabase or Firebase keys are in the client bundle.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { fetchUserProfile, saveUserProfile } from '../services/apiService';

const AuthContext = createContext();

const generateT7Id = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'T7-';
  for (let i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser]   = useState(null);
  const [userProfile, setUserProfile]   = useState(null);
  const [loading,     setLoading]       = useState(true);
  const [newUserEmail, setNewUserEmail] = useState(null);

  /* ─── API Helper ─── */
  const callAuthApi = async (action, payload = {}) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Auth error (${res.status})`);
    }
    return data;
  };

  /* ─── Profile Loader ─── */
  const loadProfile = async (uid, fallbackEmail = '') => {
    try {
      let profile = await fetchUserProfile(uid);
      if (!profile) {
        // Create initial default profile if not present
        profile = {
          id: uid,
          email: fallbackEmail,
          name: fallbackEmail.split('@')[0] || 'Student',
          role: 'student',
          branch: 'Computer Science',
          college: 'Engineering College',
          passoutYear: '2026',
          t7Id: generateT7Id(),
          skills: [],
          created_at: new Date().toISOString()
        };
        await saveUserProfile(uid, profile);
      }
      setUserProfile(profile);
      return profile;
    } catch (err) {
      console.warn('Profile load warning:', err.message);
      return null;
    }
  };

  /* ─── Email / Password Signup ─── */
  const signup = async (email, password, { name, college, branch, phone, passoutYear }) => {
    const data = await callAuthApi('signup', {
      email,
      password,
      fullName: name,
      meta: { college, branch, phone, passoutYear }
    });

    const user = {
      uid: data.user.id || data.user.uid,
      id: data.user.id || data.user.uid,
      email: data.user.email,
      displayName: name || ''
    };

    if (data.session?.access_token) {
      localStorage.setItem('t7_auth_token', data.session.access_token);
    }
    localStorage.setItem('t7_user', JSON.stringify(user));

    setCurrentUser(user);
    const profile = await loadProfile(user.uid, email);
    if (profile) {
      const updated = {
        ...profile,
        name: name || profile.name,
        college: college || profile.college,
        branch: branch || profile.branch,
        phone: phone || profile.phone,
        passoutYear: passoutYear || profile.passoutYear
      };
      await saveUserProfile(user.uid, updated);
      setUserProfile(updated);
    }
    return user;
  };

  /* ─── Email / Password Login ─── */
  const login = async (email, password) => {
    const data = await callAuthApi('login', { email, password });

    const user = {
      uid: data.user.id || data.user.uid,
      id: data.user.id || data.user.uid,
      email: data.user.email,
      displayName: data.user.user_metadata?.full_name || ''
    };

    if (data.session?.access_token) {
      localStorage.setItem('t7_auth_token', data.session.access_token);
    }
    localStorage.setItem('t7_user', JSON.stringify(user));

    setCurrentUser(user);
    await loadProfile(user.uid, email);
    return user;
  };

  /* ─── Google Login ─── */
  const loginWithGoogle = async () => {
    try {
      const data = await callAuthApi('googleOAuth', {
        redirectTo: window.location.origin + '/dashboard'
      });
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      console.warn('Supabase Google OAuth fallback:', err.message);
    }

    // Local dev fallback if credentials not yet configured
    const demoEmail = 'student@t7hub.local';
    return await login(demoEmail, 'password123').catch(async () => {
      return await signup(demoEmail, 'password123', {
        name: 'Google Student',
        college: 'Engineering College',
        branch: 'Computer Science',
        passoutYear: '2026'
      });
    });
  };

  const signupWithGoogle = async (extraData = {}) => {
    if (extraData && Object.keys(extraData).length > 0) {
      try {
        localStorage.setItem('t7_pending_signup_profile', JSON.stringify(extraData));
      } catch (err) {
        console.warn('Failed to store pending signup profile:', err);
      }
    }
    return await loginWithGoogle();
  };

  /* ─── Logout ─── */
  const logout = async () => {
    try {
      const token = localStorage.getItem('t7_auth_token');
      await callAuthApi('logout', { accessToken: token }).catch(() => {});
    } finally {
      localStorage.removeItem('t7_auth_token');
      localStorage.removeItem('t7_user');
      localStorage.removeItem('t7_pending_signup_profile');
      setCurrentUser(null);
      setUserProfile(null);
    }
  };

  /* ─── Update Profile ─── */
  const updateUserProfile = async (uid, data) => {
    const updated = await saveUserProfile(uid, data);
    setUserProfile(prev => ({ ...prev, ...updated }));
    return updated;
  };

  /* ─── Session Hydration on Launch ─── */
  useEffect(() => {
    const hydrateSession = async () => {
      try {
        // Retrieve any pending required details saved prior to Google OAuth redirect
        let pendingSignupDetails = null;
        try {
          const rawPending = localStorage.getItem('t7_pending_signup_profile');
          if (rawPending) {
            pendingSignupDetails = JSON.parse(rawPending);
            localStorage.removeItem('t7_pending_signup_profile');
          }
        } catch (e) {}

        // Retrieve oauth origin ('login' vs 'signup')
        let oauthOrigin = 'login';
        try {
          oauthOrigin = localStorage.getItem('t7_oauth_origin') || 'login';
          localStorage.removeItem('t7_oauth_origin');
        } catch (e) {}

        // 1. Check if returning from Supabase Google OAuth via PKCE code query param (?code=...)
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        if (authCode) {
          window.history.replaceState(null, '', window.location.pathname);
          const data = await callAuthApi('exchangeCode', { code: authCode });

          // Intercept new users trying to log in directly via Google on /login
          if (oauthOrigin === 'login' && data?.isNewUser && !pendingSignupDetails) {
            localStorage.removeItem('t7_auth_token');
            localStorage.removeItem('t7_user');
            localStorage.removeItem('t7_pending_signup_profile');
            const tokenToLogout = data?.session?.access_token || '';
            if (tokenToLogout) {
              await callAuthApi('logout', { accessToken: tokenToLogout }).catch(() => {});
            }
            setCurrentUser(null);
            setUserProfile(null);
            setLoading(false);
            const redirectEmail = encodeURIComponent(data.user?.email || '');
            const redirectName = encodeURIComponent(data.user?.user_metadata?.full_name || data.user?.user_metadata?.name || '');
            window.location.href = `/signup?unregistered_google=true&email=${redirectEmail}&name=${redirectName}`;
            return;
          }

          if (data?.session?.access_token) {
            localStorage.setItem('t7_auth_token', data.session.access_token);
          }
          if (data?.user) {
            const u = {
              uid: data.user.id || data.user.uid,
              id: data.user.id || data.user.uid,
              email: data.user.email,
              displayName: pendingSignupDetails?.name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
            };
            localStorage.setItem('t7_user', JSON.stringify(u));
            setCurrentUser(u);

            if (pendingSignupDetails) {
              const fullProf = {
                id: u.uid,
                email: u.email,
                name: pendingSignupDetails.name || u.displayName,
                college: pendingSignupDetails.college || '',
                branch: pendingSignupDetails.branch || '',
                passoutYear: pendingSignupDetails.passoutYear || '',
                phone: pendingSignupDetails.phone || '',
                role: 'student',
                t7Id: generateT7Id(),
                skills: [],
                created_at: new Date().toISOString()
              };
              await saveUserProfile(u.uid, fullProf);
              setUserProfile(fullProf);
            } else {
              await loadProfile(u.uid, u.email);
            }
            setLoading(false);
            return;
          }
        }

        // 2. Check if returning from Supabase Google OAuth via Implicit hash (#access_token=...)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token=')) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          if (accessToken) {
            localStorage.setItem('t7_auth_token', accessToken);
            window.history.replaceState(null, '', window.location.pathname);
            const data = await callAuthApi('getUser', { accessToken });

            // Intercept new users trying to log in directly via Google on /login
            if (oauthOrigin === 'login' && data?.isNewUser && !pendingSignupDetails) {
              localStorage.removeItem('t7_auth_token');
              localStorage.removeItem('t7_user');
              localStorage.removeItem('t7_pending_signup_profile');
              if (accessToken) {
                await callAuthApi('logout', { accessToken }).catch(() => {});
              }
              setCurrentUser(null);
              setUserProfile(null);
              setLoading(false);
              const redirectEmail = encodeURIComponent(data?.user?.email || '');
              const redirectName = encodeURIComponent(data?.user?.user_metadata?.full_name || data?.user?.user_metadata?.name || '');
              window.location.href = `/signup?unregistered_google=true&email=${redirectEmail}&name=${redirectName}`;
              return;
            }

            if (data?.user) {
              const u = {
                uid: data.user.id || data.user.uid,
                id: data.user.id || data.user.uid,
                email: data.user.email,
                displayName: pendingSignupDetails?.name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
              };
              localStorage.setItem('t7_user', JSON.stringify(u));
              setCurrentUser(u);

              if (pendingSignupDetails) {
                const fullProf = {
                  id: u.uid,
                  email: u.email,
                  name: pendingSignupDetails.name || u.displayName,
                  college: pendingSignupDetails.college || '',
                  branch: pendingSignupDetails.branch || '',
                  passoutYear: pendingSignupDetails.passoutYear || '',
                  phone: pendingSignupDetails.phone || '',
                  role: 'student',
                  t7Id: generateT7Id(),
                  skills: [],
                  created_at: new Date().toISOString()
                };
                await saveUserProfile(u.uid, fullProf);
                setUserProfile(fullProf);
              } else {
                await loadProfile(u.uid, u.email);
              }
              setLoading(false);
              return;
            }
          }
        }

        // 3. Check standard local storage session
        const savedUserStr = localStorage.getItem('t7_user');
        if (savedUserStr) {
          const user = JSON.parse(savedUserStr);
          setCurrentUser(user);
          await loadProfile(user.uid, user.email);
        }
      } catch (err) {
        console.warn('Session hydration warning:', err.message);
      } finally {
        setLoading(false);
      }
    };

    hydrateSession();
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    newUserEmail,
    setNewUserEmail,
    clearNewUserEmail: () => setNewUserEmail(null),
    signup,
    login,
    loginWithGoogle,
    signupWithGoogle,
    logout,
    updateUserProfile,
    isAdmin:   userProfile?.role === 'admin',
    isStudent: userProfile?.role === 'student' || !userProfile?.role,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-zinc-700 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">Loading T7 Learning Hub...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
