import { useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user is an admin
        const isAdmin = await checkAdminStatus(user.email);
        setState({
          user,
          isAdmin,
          loading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          isAdmin: false,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Check admin status
      const isAdmin = await checkAdminStatus(result.user.email);

      setState({
        user: result.user,
        isAdmin,
        loading: false,
        error: null,
      });

      return { success: true, isAdmin };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Sign in failed';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
      return { success: false, isAdmin: false };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setState({
        user: null,
        isAdmin: false,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Sign out failed';
      setState((prev) => ({ ...prev, error: message }));
    }
  };

  return {
    user: state.user,
    isAdmin: state.isAdmin,
    loading: state.loading,
    error: state.error,
    signIn,
    signOut,
  };
}

// Check if user email is in adminUsers collection
async function checkAdminStatus(email: string | null): Promise<boolean> {
  if (!email) return false;

  try {
    // Try to check Firestore for admin status
    const adminDoc = await getDoc(doc(db, 'adminUsers', email));
    return adminDoc.exists();
  } catch (error) {
    console.log('Could not check admin status (Firestore may not be configured)');
    // For development, allow any authenticated user
    return true;
  }
}
