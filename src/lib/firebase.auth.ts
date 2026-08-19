import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  updateProfile,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
  createdAt: string;
  lastSeen: string;
}

/**
 * Authentication utility functions for Streamcast
 */
export const signUp = async (email: string, password: string, displayName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: user.photoURL,
    role: 'user',
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', user.uid), userProfile);
  await updateProfile(user, { displayName });

  return userCredential;
};

export const signInWithEmail = (email: string, password: string) => 
  signInWithEmailAndPassword(auth, email, password);

export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signOut = () => firebaseSignOut(auth);

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

/**
 * Hook to listen for auth state changes
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoading(false);
    });
  }, []);

  return { user, isLoading, isAuthenticated: !!user };
};
