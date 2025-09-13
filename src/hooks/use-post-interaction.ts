
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, increment } from 'firebase/firestore';
import { useToast } from './use-toast';

export const usePostInteraction = (postId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (!postId || !user) return;

    const postRef = doc(db, 'posts', postId);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const postData = docSnap.data();
        const likedBy = postData.likedBy || [];
        setHasLiked(likedBy.includes(user.uid));
      }
    });

    return () => unsubscribe();
  }, [postId, user]);

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to like a post.",
        variant: "destructive",
      });
      return;
    }
    if (isLiking) return;

    setIsLiking(true);

    const postRef = doc(db, 'posts', postId);

    try {
      if (hasLiked) {
        // Unlike
        await updateDoc(postRef, {
          likedBy: arrayRemove(user.uid),
          likes: increment(-1),
        });
      } else {
        // Like
        await updateDoc(postRef, {
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
