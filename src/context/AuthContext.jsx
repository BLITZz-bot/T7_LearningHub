/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the app.
 * Handles Firebase Auth and user role management.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
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

  // Sign up with email and password
  const signup = async (email, password, { name, college = '', branch = '', phone = '', role = 'student' }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Generate unique T7 Account ID for extension linking
    const t7Id = generateT7Id();

    // Create user profile in Firestore
    const newProfile = {
      name: name || 'Student',
      email,
      phone: phone || '',
      college: college || '',
      branch: branch || '',
      role,
      t7Id,
      year: null,
      career_interest: '',
      skills: [],
      ytSkills: [],
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), newProfile);
    setUserProfile({ id: userCredential.user.uid, ...newProfile });
    return userCredential.user;
  };

  // Sign in with email and password
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  // Sign in with Google (Login page — only allows EXISTING users)
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user profile exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // User is not registered — sign out and prompt to sign up with their details
        await signOut(auth);
        const error = new Error('No account found with this Google email. Please sign up first.');
        error.code = 'auth/user-not-found';
        throw error;
      }
      
      return user;
    } catch (popupError) {
      if (popupError.code === 'auth/popup-blocked') {
        sessionStorage.setItem('t7_auth_intent', 'login');
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw popupError;
    }
  };

  // Sign up with Google (Signup page — creates NEW user profile with extra details)
  const signupWithGoogle = async ({ college = '', branch = '', phone = '', name = '' } = {}) => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user profile already exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const existing = { id: userDoc.id, ...userDoc.data() };
        const updates = {};
        if (college && !existing.college) updates.college = college;
        if (branch && !existing.branch) updates.branch = branch;
        if (phone && !existing.phone) updates.phone = phone;
        if (Object.keys(updates).length > 0) {
          await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
          existing.college = updates.college || existing.college;
          existing.branch = updates.branch || existing.branch;
          existing.phone = updates.phone || existing.phone;
        }
        setUserProfile(existing);
        return user;
      }

      // New user — create their Firestore profile with unique T7 ID
      const t7Id = generateT7Id();
      const newProfile = {
        name: name || user.displayName || 'Student',
        email: user.email,
        phone: phone || '',
        college: college || '',
        branch: branch || '',
        role: 'student',
        t7Id,
        year: null,
        career_interest: '',
        skills: [],
        ytSkills: [],
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setUserProfile({ id: user.uid, ...newProfile });
      return user;
    } catch (popupError) {
      if (popupError.code === 'auth/popup-blocked') {
        sessionStorage.setItem('t7_auth_intent', 'signup');
        sessionStorage.setItem('pending_google_signup', JSON.stringify({ college, branch, phone, name }));
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw popupError;
    }
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
      // Process any redirect results if popup was blocked
      getRedirectResult(auth).then(async (result) => {
        if (result && result.user) {
          const user = result.user;
          const intent = sessionStorage.getItem('t7_auth_intent');
          const pendingDataStr = sessionStorage.getItem('pending_google_signup');
          sessionStorage.removeItem('t7_auth_intent');
          sessionStorage.removeItem('pending_google_signup');

          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            if (intent === 'signup' && pendingDataStr) {
              const pendingData = JSON.parse(pendingDataStr);
              const t7Id = generateT7Id();
              const newProfile = {
                name: pendingData.name || user.displayName || 'Student',
                email: user.email,
                phone: pendingData.phone || '',
                college: pendingData.college || '',
                branch: pendingData.branch || '',
                role: 'student',
                t7Id,
                year: null,
                career_interest: '',
                skills: [],
                ytSkills: [],
                createdAt: serverTimestamp()
              };
              await setDoc(doc(db, 'users', user.uid), newProfile);
              setUserProfile({ id: user.uid, ...newProfile });
            } else {
              await signOut(auth);
            }
          }
        }
      }).catch((err) => {
        console.error('Redirect sign-in error:', err);
      });

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
