
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, runTransaction, DocumentReference, increment } from 'firebase/firestore';
import { useToast } from './use-toast';

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

    // Listen to changes in the current user's "following" list
    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
        const followingList = doc.data()?.following || [];
        setIsFollowing(followingList.includes(profileUserId));
    }, (error) => {
        console.error("Failed to listen for follow status:", error);
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

    // The logic is now simplified to only update the current user's document
    // to comply with security rules that only allow a user to write to their own document.
    try {
        if (isFollowing) {
          // --- Unfollow Logic ---
          await updateDoc(currentUserRef, {
            following: arrayRemove(profileUserId),
            followingCount: increment(-1)
          });
           toast({ title: "Unfollowed", description: "You are no longer following this user." });
        } else {
          // --- Follow Logic ---
          await updateDoc(currentUserRef, {
            following: arrayUnion(profileUserId),
            followingCount: increment(1)
          });
           toast({ title: "Followed", description: "You are now following this user." });
        }
        // The UI will update automatically thanks to the onSnapshot listener.
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: `Could not perform the follow action. Please check your permissions and try again.`,
        variant: "destructive",
      });
    } finally {
      setIsTogglingFollow(false);
    }
  }, [currentUser, profileUserId, isTogglingFollow, isFollowing, toast]);

  return { isFollowing, isTogglingFollow, toggleFollow };
};
