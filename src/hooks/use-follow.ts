
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, writeBatch, onSnapshot, getDoc } from 'firebase/firestore';
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

    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
        const followingList = doc.data()?.following || [];
        setIsFollowing(followingList.includes(profileUserId));
    });

    return () => unsub();

  }, [currentUser, profileUserId]);


  const toggleFollow = async () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "You must be logged in to follow users.",
        variant: "destructive",
      });
      return;
    }

    if (!profileUserId || isTogglingFollow) return;

    setIsTogglingFollow(true);
    
    const currentUserRef = doc(db, "users", currentUser.uid);
    const profileUserRef = doc(db, "users", profileUserId);

    const batch = writeBatch(db);

    try {
        if (isFollowing) {
            // Unfollow logic
            batch.update(currentUserRef, { 
                following: arrayRemove(profileUserId),
                followingCount: increment(-1) 
            });
            batch.update(profileUserRef, { 
                followers: arrayRemove(currentUser.uid),
                followersCount: increment(-1)
            });
            toast({ title: "Unfollowed", description: "You are no longer following this user." });

        } else {
            // Follow logic
            batch.update(currentUserRef, { 
                following: arrayUnion(profileUserId),
                followingCount: increment(1)
            });
            batch.update(profileUserRef, { 
                followers: arrayUnion(currentUser.uid),
                followersCount: increment(1)
            });
            toast({ title: "Followed!", description: "You are now following this user." });
        }
        await batch.commit();

    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: `Could not perform the follow action. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsTogglingFollow(false);
    }
  };

  return { isFollowing, isTogglingFollow, toggleFollow };
};
