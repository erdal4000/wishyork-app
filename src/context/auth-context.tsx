
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

function getCookie(name: string): string | undefined {
  // This function will only run on the client side
  if (typeof document === 'undefined') {
    return undefined;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
}

function deleteCookie(name: string) {
    // This function will only run on the client side
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // This entire block is now safe for server-side rendering because the
      // functions that depend on `document` will not execute.
      try {
        const customToken = getCookie('customToken');
        
        if (customToken) {
            // Only try to sign in if there's no current user and we have a token
            if (!auth.currentUser) {
              await signInWithCustomToken(auth, customToken);
            }
            // Clean up the cookie regardless of success or failure.
            deleteCookie('customToken');
        }
      } catch (e) {
        console.error("Custom token sign-in failed", e);
        deleteCookie('customToken'); // Also clean up on error
      } 
    };

    // The onAuthStateChanged listener is safe to run on both server and client.
    // Firebase's SDK handles the environment differences.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
    });

    // Run the one-time token check.
    initializeAuth();

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
