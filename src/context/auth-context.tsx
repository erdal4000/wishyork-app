
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

async function setSessionCookie(idToken: string) {
    const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
        console.error("Failed to set session cookie. Status:", response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error("Error details:", errorData.error || "No details provided.");
        throw new Error("Failed to set session cookie.");
    }
}

async function clearSessionCookie() {
    await fetch('/api/auth/session', { method: 'DELETE' });
}


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
            const idToken = await user.getIdToken(true); // Force refresh to get a fresh token
            await setSessionCookie(idToken);
        } catch (error) {
            console.error("Error during session creation:", error);
            // If we can't create a session, something is wrong. Log the user out client-side.
            await auth.signOut();
        }
      } else {
        await clearSessionCookie();
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
