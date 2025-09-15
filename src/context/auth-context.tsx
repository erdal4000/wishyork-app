
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// Helper for client-side cookie management
const setCookie = (name: string, value: string, days: number) => {
  let expires = "";
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  if (typeof document !== 'undefined') {
    // Setting a more generic path and ensuring it's secure in production
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax" + secure;
  }
};

const eraseCookie = (name: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
};


interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        try {
            // STRATEGY CHANGE: Directly store the idToken in a client-side cookie.
            // This bypasses the problematic /api/auth/session route.
            const idToken = await user.getIdToken(true); // Force refresh for freshness
            setCookie('idToken', idToken, 1); // Store for 1 day
        } catch (error) {
            console.error("Error getting/setting idToken cookie on auth state change:", error);
            eraseCookie('idToken');
        }
      } else {
        // If user logs out, clear the idToken cookie.
        eraseCookie('idToken');
      }
    });

    return () => unsubscribe();
  }, [router]);

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
