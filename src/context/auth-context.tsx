
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

// This function will be called by the auth state change listener.
// It sends the ID token to our API route to create a session cookie.
const syncSessionCookie = async (user: User | null) => {
    if (user) {
        try {
            const idToken = await user.getIdToken(true); // Force refresh the token
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });
        } catch (error) {
            console.error("Failed to sync session cookie:", error);
            // Optional: Sign out the user if the session can't be created
            await auth.signOut();
        }
    } else {
        // User logged out, so clear the session cookie
        await fetch('/api/auth/session', { method: 'DELETE' });
    }
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // This is the standard way to listen for auth state changes.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      await syncSessionCookie(user);
      setLoading(false);
    });

    // Set up an interval to refresh the token and session cookie periodically.
    // This helps prevent "permission-denied" errors due to expired tokens.
    const interval = setInterval(async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            try {
                // This doesn't re-login the user, just gets a fresh token.
                await currentUser.getIdToken(true);
                // We can re-sync the cookie if needed, but the main purpose here
                // is to keep the client-side token fresh for Firestore requests.
            } catch (error) {
                console.error("Error refreshing ID token:", error);
                toast({ title: "Session Expired", description: "Your session has expired. Please log in again.", variant: "destructive"});
                await auth.signOut();
            }
        }
    }, 10 * 60 * 1000); // e.g., every 10 minutes

    // Cleanup subscription and interval on unmount
    return () => {
        unsubscribe();
        clearInterval(interval);
    };
  }, [toast]);

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
