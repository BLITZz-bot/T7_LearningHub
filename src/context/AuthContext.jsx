/**
 * Authentication Context
 * Handles Firebase Auth and Firestore user profile management.
 * Google auth uses signInWithRedirect (no popups - works on all browsers/devices).
 */

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

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
  // For new-user-tried-login-with-google case
  const [newUserEmail, setNewUserEmail] = useState(null);
  const redirectHandled = useRef(false);

  /* ─── helpers ─── */
  const fetchProfile = async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  };

  const createProfile = async (uid, data) => {
    const profile = {
      name:           data.name     || 'Student',
      email:          data.email    || '',
      phone:          data.phone    || '',
      college:        data.college  || '',
      branch:         data.branch   || '',
      role:           'student',
      t7Id:           generateT7Id(),
      year:           null,
      career_interest:'',
      skills:         [],
      ytSkills:       [],
      createdAt:      serverTimestamp(),
    };
    await setDoc(doc(db, 'users', uid), profile);
    return { id: uid, ...profile };
  };

  /* ─── email / password ─── */
  const signup = async (email, password, { name, college, branch, phone }) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    const profile  = await createProfile(user.uid, { name, email, college, branch, phone });
    setUserProfile(profile);
    return user;
  };

  const login = async (email, password) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    // Check Firestore profile exists
    const profile = await fetchProfile(user.uid);
    if (!profile) {
      await signOut(auth);
      const err = new Error('No account found. Please sign up first.');
      err.code = 'auth/user-not-found';
      throw err;
    }
    return user;
  };

  /* ─── Google (full-page redirect — works even when popups are blocked) ─── */
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    sessionStorage.setItem('t7_auth_intent', 'login');
    await signInWithRedirect(auth, provider);
  };

  const signupWithGoogle = async ({ college = '', branch = '', phone = '', name = '' } = {}) => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    sessionStorage.setItem('t7_auth_intent', 'signup');
    sessionStorage.setItem('t7_signup_data', JSON.stringify({ college, branch, phone, name }));
    await signInWithRedirect(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = async (uid, data) => {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
    const updated = await fetchProfile(uid);
    setUserProfile(updated);
    return updated;
  };

  /* ─── Core auth listener ─── */
  useEffect(() => {
    let unsubscribe;

    const init = async () => {
      // Process redirect result FIRST (before onAuthStateChanged settles)
      if (!redirectHandled.current) {
        redirectHandled.current = true;
        try {
          const result = await getRedirectResult(auth);
          if (result?.user) {
            const user   = result.user;
            const intent = sessionStorage.getItem('t7_auth_intent') || 'login';
            const rawData = sessionStorage.getItem('t7_signup_data');
            sessionStorage.removeItem('t7_auth_intent');
            sessionStorage.removeItem('t7_signup_data');

            let profile = await fetchProfile(user.uid);

            if (!profile) {
              if (intent === 'signup' && rawData) {
                const pd = JSON.parse(rawData);
                profile = await createProfile(user.uid, {
                  name:    pd.name    || user.displayName || '',
                  email:   user.email,
                  college: pd.college,
                  branch:  pd.branch,
                  phone:   pd.phone,
                });
              } else {
                // Login intent but no profile → sign out, prompt signup
                await signOut(auth);
                setNewUserEmail(user.email);
                setLoading(false);
                return;
              }
            } else if (intent === 'signup' && rawData) {
              // Already registered — update empty fields
              const pd = JSON.parse(rawData);
              const updates = {};
              if (pd.college && !profile.college) updates.college = pd.college;
              if (pd.branch  && !profile.branch)  updates.branch  = pd.branch;
              if (pd.phone   && !profile.phone)   updates.phone   = pd.phone;
              if (Object.keys(updates).length > 0) {
                await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
                profile = { ...profile, ...updates };
              }
            }

            // Migrate: ensure t7Id exists
            if (profile && !profile.t7Id) {
              const t7Id = generateT7Id();
              await setDoc(doc(db, 'users', user.uid), { t7Id }, { merge: true });
              profile.t7Id = t7Id;
            }

            setCurrentUser(user);
            setUserProfile(profile);
            setLoading(false);
            return; // Don't fall through to onAuthStateChanged for this render
          }
        } catch (err) {
          console.error('getRedirectResult error:', err);
        }
      }

      // Normal page load — use onAuthStateChanged
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        if (user) {
          try {
            let profile = await fetchProfile(user.uid);
            if (profile && !profile.t7Id) {
              const t7Id = generateT7Id();
              await setDoc(doc(db, 'users', user.uid), { t7Id }, { merge: true });
              profile = { ...profile, t7Id };
            }
            setUserProfile(profile);
          } catch (err) {
            console.error('Profile fetch error:', err);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }, (err) => {
        console.error('Auth state error:', err);
        setLoading(false);
      });
    };

    init();
    return () => unsubscribe?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    currentUser,
    userProfile,
    loading,
    newUserEmail,      // set when a new user tried to login via Google
    clearNewUserEmail: () => setNewUserEmail(null),
    signup,
    login,
    loginWithGoogle,
    signupWithGoogle,
    logout,
    updateUserProfile,
    isAdmin:   userProfile?.role === 'admin',
    isStudent: userProfile?.role === 'student',
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
