
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, increment } from 'firebase/firestore';
import { useToast } from './use-toast';

export const usePostInteraction = (itemId: string, itemType: 'post' | 'wishlist') => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (!itemId || !user) return;

    const itemRef = doc(db, `${itemType}s`, itemId);
    const unsubscribe = onSnapshot(itemRef, (docSnap) => {
      if (docSnap.exists()) {
        const postData = docSnap.data();
        const likedBy = postData.likedBy || [];
        setHasLiked(likedBy.includes(user.uid));
      }
    });

    return () => unsubscribe();
  }, [itemId, itemType, user]);

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to like an item.",
        variant: "destructive",
      });
      return;
    }
    if (isLiking) return;

    setIsLiking(true);

    const itemRef = doc(db, `${itemType}s`, itemId);

    try {
      if (hasLiked) {
        // Unlike
        await updateDoc(itemRef, {
          likedBy: arrayRemove(user.uid),
          likes: increment(-1),
        });
      } else {
        // Like
        await updateDoc(itemRef, {
          likedBy: arrayUnion(user.uid),
          likes: increment(1),
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Could not update your like. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  return { hasLiked, isLiking, toggleLike };
};
