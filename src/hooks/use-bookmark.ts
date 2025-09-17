
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from './use-toast';

export const useBookmark = (refId: string, type: 'post' | 'cause' | 'item') => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  // Create a consistent bookmark ID from the refId and type
  const bookmarkId = `${type}_${refId}`;

  useEffect(() => {
    if (!user) return;

    const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', bookmarkId);
    const unsubscribe = onSnapshot(bookmarkRef, (docSnap) => {
      setIsBookmarked(docSnap.exists());
    });

    return () => unsubscribe();
  }, [user, bookmarkId]);

  const toggleBookmark = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to bookmark items.",
        variant: "destructive",
      });
      return;
    }
    if (isToggling) return;

    setIsToggling(true);
    const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', bookmarkId);

    try {
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        toast({ title: "Removed", description: "Item removed from your bookmarks." });
      } else {
        await setDoc(bookmarkRef, {
          refId: refId,
          type: type,
          addedAt: serverTimestamp(),
        });
        toast({ title: "Saved!", description: "Item added to your bookmarks." });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Could not update your bookmarks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  return { isBookmarked, isToggling, toggleBookmark };
};
