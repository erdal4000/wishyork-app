
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, runTransaction, DocumentReference } from 'firebase/firestore';
import { useToast } from './use-toast';

// Debounce function to prevent spamming follow/unfollow actions
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

export const useFollow = (profileUserId?: string) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  useEffect(() => {
    if (!currentUser || !profileUserId) {
        setIsFollowing(false);
        return;
    };

    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
        const followingList = doc.data()?.following || [];
        setIsFollowing(followingList.includes(profileUserId));
    }, () => {
        // Handle potential errors, e.g. if user is logged out
        setIsFollowing(false);
    });

    return () => unsub();

  }, [currentUser, profileUserId]);


  const toggleFollow = useCallback(async () => {
    if (!currentUser || !profileUserId || isTogglingFollow) {
      if (!currentUser) {
        toast({
          title: "Login Required",
          description: "You must be logged in to follow users.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsTogglingFollow(true);
    
    const currentUserRef = doc(db, "users", currentUser.uid);
    const profileUserRef = doc(db, "users", profileUserId);

    try {
      await runTransaction(db, async (transaction) => {
        const currentUserDoc = await transaction.get(currentUserRef);
        const profileUserDoc = await transaction.get(profileUserRef);

        if (!currentUserDoc.exists() || !profileUserDoc.exists()) {
          throw "User document not found!";
        }

        const currentUserData = currentUserDoc.data();
        const currentlyFollowing = (currentUserData.following || []).includes(profileUserId);

        if (currentlyFollowing) {
          // Unfollow logic
          transaction.update(currentUserRef, {
            following: arrayRemove(profileUserId),
            followingCount: Math.max(0, (currentUserData.followingCount || 0) - 1)
          });
          transaction.update(profileUserRef, {
            followers: arrayRemove(currentUser.uid),
            followersCount: Math.max(0, (profileUserDoc.data().followersCount || 0) - 1)
          });
        } else {
          // Follow logic
          transaction.update(currentUserRef, {
            following: arrayUnion(profileUserId),
            followingCount: (currentUserData.followingCount || 0) + 1
          });
          transaction.update(profileUserRef, {
            followers: arrayUnion(currentUser.uid),
            followersCount: (profileUserDoc.data().followersCount || 0) + 1
          });
        }
      });

      // Optimistic update for UI responsiveness
      setIsFollowing(prev => !prev);
      
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: `Could not perform the follow action. Please try again.`,
        variant: "destructive",
      });
      // Revert optimistic update on error
      setIsFollowing(prev => !prev);
    } finally {
      setIsTogglingFollow(false);
    }
  }, [currentUser, profileUserId, isTogglingFollow, toast]);

  // Debounced version of toggleFollow to be used in the UI
  const debouncedToggleFollow = useCallback(debounce(toggleFollow, 300), [toggleFollow]);


  return { isFollowing, isTogglingFollow, toggleFollow: debouncedToggleFollow };
};
