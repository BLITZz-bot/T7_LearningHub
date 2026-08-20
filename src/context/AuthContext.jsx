/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the app.
 * Handles Firebase Auth and user role management.
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

/**
 * Generate a unique T7 Account ID (format: T7-XXXXXX)
 * 6 alphanumeric uppercase characters for human-friendly sharing
 */
const generateT7Id = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let id = 'T7-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

const createProfile = async (uid, data) => {
  const t7Id = generateT7Id();
  const newProfile = {
    name: data.name || 'Student',
    email: data.email || '',
    phone: data.phone || '',
    college: data.college || '',
    branch: data.branch || '',
    role: 'student',
    t7Id,
    year: null,
    career_interest: '',
    skills: [],
    ytSkills: [],
    createdAt: serverTimestamp()
  };
  await setDoc(doc(db, 'users', uid), newProfile);
  return { id: uid, ...newProfile };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // Tracks if we need to redirect to signup after Google redirect (new user on login page)
  const [pendingRedirectSignup, setPendingRedirectSignup] = useState(null);
  const redirectHandled = useRef(false);

  // Sign up with email and password
  const signup = async (email, password, { name, college = '', branch = '', phone = '', role = 'student' }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const profile = await createProfile(userCredential.user.uid, { name, email, college, branch, phone });
    setUserProfile({ ...profile, role });
    return userCredential.user;
  };

  // Sign in with email and password (existing users only)
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Check if profile exists
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      await signOut(auth);
      const error = new Error('No account found with this email. Please sign up first.');
      error.code = 'auth/user-not-found';
      throw error;
    }
    return userCredential.user;
  };

  // Sign in with Google — uses full-page redirect (works even when popups are blocked)
  // intent: 'login' (existing users only) | 'signup' (new users, needs extra info)
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    sessionStorage.setItem('t7_auth_intent', 'login');
    await signInWithRedirect(auth, provider);
    // Page will redirect away — nothing runs after this
  };

  const signupWithGoogle = async ({ college = '', branch = '', phone = '', name = '' } = {}) => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    sessionStorage.setItem('t7_auth_intent', 'signup');
    sessionStorage.setItem('pending_google_signup', JSON.stringify({ college, branch, phone, name }));
    await signInWithRedirect(auth, provider);
    // Page will redirect away — nothing runs after this
  };

  // Sign out
  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  };

  // Update user profile
  const updateUserProfile = async (uid, data) => {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
    const updatedProfile = await fetchUserProfile(uid);
    setUserProfile(updatedProfile);
    return updatedProfile;
  };

  // Listen for auth state changes — runs once on mount
  useEffect(() => {
    let unsubscribe;
    try {
      // Handle redirect result when page loads back from Google
      if (!redirectHandled.current) {
        redirectHandled.current = true;
        getRedirectResult(auth).then(async (result) => {
          if (result && result.user) {
            const user = result.user;
            const intent = sessionStorage.getItem('t7_auth_intent') || 'login';
            const pendingDataStr = sessionStorage.getItem('pending_google_signup');
            sessionStorage.removeItem('t7_auth_intent');
            sessionStorage.removeItem('pending_google_signup');

            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (intent === 'login') {
              if (!userDoc.exists()) {
                // New user tried to log in → sign them out and show signup prompt
                await signOut(auth);
                setPendingRedirectSignup({ email: user.email, name: user.displayName || '' });
              }
              // If exists → onAuthStateChanged fires and ProtectedRoute routes them to /dashboard
            } else if (intent === 'signup') {
              if (userDoc.exists()) {
                // Already registered → just update empty fields and proceed
                const existing = { id: userDoc.id, ...userDoc.data() };
                if (pendingDataStr) {
                  const pd = JSON.parse(pendingDataStr);
                  const updates = {};
                  if (pd.college && !existing.college) updates.college = pd.college;
                  if (pd.branch && !existing.branch) updates.branch = pd.branch;
                  if (pd.phone && !existing.phone) updates.phone = pd.phone;
                  if (Object.keys(updates).length > 0) {
                    await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
                  }
                }
                setUserProfile(existing);
              } else {
                // New signup → create profile with their details
                const pd = pendingDataStr ? JSON.parse(pendingDataStr) : {};
                const profile = await createProfile(user.uid, {
                  name: pd.name || user.displayName || 'Student',
                  email: user.email,
                  college: pd.college || '',
                  branch: pd.branch || '',
                  phone: pd.phone || ''
                });
                setUserProfile(profile);
              }
              // onAuthStateChanged + ProtectedRoute routes them to /dashboard
            }
          }
        }).catch((err) => {
          console.error('Redirect sign-in error:', err);
        });
      }

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        
        if (user) {
          try {
            let profile = await fetchUserProfile(user.uid);
            
            // Migrate: generate T7 ID for existing users who don't have one
            if (profile && !profile.t7Id) {
              const t7Id = generateT7Id();
              await setDoc(doc(db, 'users', user.uid), { t7Id }, { merge: true });
              profile = { ...profile, t7Id };
            }
            
            setUserProfile(profile);
          } catch (err) {
            console.error('Error fetching user profile:', err);
          }
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }, (error) => {
        console.error('Auth state error:', error);
        setLoading(false);
      });
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setLoading(false);
    }

    return () => unsubscribe && unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    currentUser,
    userProfile,
    loading,
    pendingRedirectSignup,
    clearPendingRedirectSignup: () => setPendingRedirectSignup(null),
    signup,
    login,
    loginWithGoogle,
    signupWithGoogle,
    logout,
    updateUserProfile,
    isAdmin: userProfile?.role === 'admin',
    isStudent: userProfile?.role === 'student'
  };

  // Show loading spinner while initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
