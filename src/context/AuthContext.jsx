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
  const signup = async (email, password, name, role = 'student') => {
    // DEMO: Allow admin/admin bypass without Firebase
    if (email === 'admin@demo.local' && password === 'admin123456') {
      const mockUser = {
        uid: 'demo-admin-uid-12345',
        email: 'admin@demo.local',
        displayName: name
      };
      setCurrentUser(mockUser);
      setUserProfile({
        id: 'demo-admin-uid-12345',
        name: name,
        email: 'admin@demo.local',
        role: 'admin',
        t7Id: 'T7-ADMIN0',
        branch: '',
        year: null,
        career_interest: '',
        skills: [],
        ytSkills: [],
        createdAt: new Date()
      });
      return mockUser;
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Generate unique T7 Account ID for extension linking
    const t7Id = generateT7Id();

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      role,
      t7Id,
      branch: '',
      year: null,
      career_interest: '',
      skills: [],
      ytSkills: [],
      createdAt: serverTimestamp()
    });

    return userCredential.user;
  };

  // Sign in with email and password
  const login = async (email, password) => {
    // DEMO: Allow admin/admin bypass without Firebase
    if (email === 'admin@demo.local' && password === 'admin123456') {
      // Create a mock user object
      const mockUser = {
        uid: 'demo-admin-uid-12345',
        email: 'admin@demo.local',
        displayName: 'Admin Demo'
      };
      setCurrentUser(mockUser);
      setUserProfile({
        id: 'demo-admin-uid-12345',
        name: 'Admin Demo',
        email: 'admin@demo.local',
        role: 'admin',
        t7Id: 'T7-ADMIN0'
      });
      return mockUser;
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  // Sign out
  const logout = async () => {
    // Handle demo user logout
    if (currentUser?.uid === 'demo-admin-uid-12345') {
      setCurrentUser(null);
      setUserProfile(null);
      return;
    }
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

  // Listen for auth state changes
  useEffect(() => {
    let unsubscribe;
    
    // Skip Firebase listener if demo user is logged in
    if (currentUser?.uid === 'demo-admin-uid-12345') {
      setLoading(false);
      return;
    }
    
    try {
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
  }, [currentUser?.uid]);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
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
