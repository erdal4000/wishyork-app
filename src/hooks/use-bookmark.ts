
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';

export interface BookmarkData {
  refId: string;
  type: 'post' | 'cause' | 'item';
  title?: string;
  imageUrl?: string | null;
  authorName?: string | null;
}

export const useBookmark = (bookmarkData: BookmarkData) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  const { refId, type } = bookmarkData;
  const bookmarkId = `${type}_${refId}`;

  useEffect(() => {
    if (!user || !refId) return;

    const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', bookmarkId);
    const unsubscribe = onSnapshot(bookmarkRef, (docSnap) => {
      setIsBookmarked(docSnap.exists());
    }, (error) => {
      console.error("Error checking bookmark status:", error);
    });

    return () => unsubscribe();
  }, [user, refId, bookmarkId]);

  const toggleBookmark = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to bookmark items.",
        variant: "destructive",
      });
      return;
    }
    if (isToggling || !refId) return;

    setIsToggling(true);
    const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', bookmarkId);

    try {
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        toast({ title: "Removed", description: "Item removed from your bookmarks." });
      } else {
        // Now we save the additional context with the bookmark
        await setDoc(bookmarkRef, {
          ...bookmarkData,
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
