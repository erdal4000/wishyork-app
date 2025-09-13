
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, increment } from 'firebase/firestore';
import { useToast } from './use-toast';

export const useCommentInteraction = (docId: string, collectionType: 'posts' | 'wishlists', commentId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (!docId || !collectionType || !commentId || !user) return;

    const commentRef = doc(db, collectionType, docId, 'comments', commentId);
    const unsubscribe = onSnapshot(commentRef, (docSnap) => {
      if (docSnap.exists()) {
        const commentData = docSnap.data();
        const likedBy = commentData.likedBy || [];
        setHasLiked(likedBy.includes(user.uid));
      }
    });

    return () => unsubscribe();
  }, [docId, collectionType, commentId, user]);

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to like a comment.",
        variant: "destructive",
      });
      return;
    }
    if (isLiking) return;

    setIsLiking(true);

    const commentRef = doc(db, collectionType, docId, 'comments', commentId);

    try {
      if (hasLiked) {
        // Unlike
        await updateDoc(commentRef, {
          likedBy: arrayRemove(user.uid),
          likes: increment(-1),
        });
      } else {
        // Like
        await updateDoc(commentRef, {
          likedBy: arrayUnion(user.uid),
          likes: increment(1),
        });
      }
    } catch (error) {
      console.error("Error toggling comment like:", error);
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
