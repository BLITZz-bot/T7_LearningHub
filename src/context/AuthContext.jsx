/**
 * Authentication Context
 * Handles Firebase Auth and Firestore user profile management.
 * Google auth uses signInWithPopup for fast, reliable, pop-up sign-in without page redirects.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
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
  const [newUserEmail, setNewUserEmail] = useState(null);

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
    let profile = await fetchProfile(user.uid);
    if (!profile) {
      await signOut(auth);
      const err = new Error('No account found. Please sign up first.');
      err.code = 'auth/user-not-found';
      throw err;
    }
    setUserProfile(profile);
    return user;
  };

  /* ─── Google Sign-In with Popup ─── */
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    let profile = await fetchProfile(user.uid);
    if (!profile) {
      // Auto-create basic profile so new users logging in with Google aren't blocked
      profile = await createProfile(user.uid, {
        name: user.displayName || 'Student',
        email: user.email || '',
      });
    } else if (!profile.t7Id) {
      const t7Id = generateT7Id();
      await setDoc(doc(db, 'users', user.uid), { t7Id }, { merge: true });
      profile.t7Id = t7Id;
    }

    setCurrentUser(user);
    setUserProfile(profile);
    return user;
  };

  const signupWithGoogle = async ({ college = '', branch = '', phone = '', name = '' } = {}) => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    let profile = await fetchProfile(user.uid);
    if (!profile) {
      profile = await createProfile(user.uid, {
        name: name || user.displayName || 'Student',
        email: user.email || '',
        college,
        branch,
        phone,
      });
    } else {
      const updates = {};
      if (college && !profile.college) updates.college = college;
      if (branch && !profile.branch) updates.branch = branch;
      if (phone && !profile.phone) updates.phone = phone;
      if (name && (!profile.name || profile.name === 'Student')) updates.name = name;
      if (!profile.t7Id) updates.t7Id = generateT7Id();

      if (Object.keys(updates).length > 0) {
        await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
        profile = { ...profile, ...updates };
      }
    }

    setCurrentUser(user);
    setUserProfile(profile);
    return user;
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    newUserEmail,
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
