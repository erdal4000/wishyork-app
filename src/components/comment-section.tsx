'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  writeBatch,
  increment,
  DocumentData,
  Timestamp,
  getDoc,
  where,
  getDocs,
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2, Trash2, MessageSquareReply, CornerDownRight } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';


interface Comment extends DocumentData {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  text: string;
  createdAt: Timestamp;
  parentId: string | null;
  replyCount: number;
  replies?: Comment[];
}

interface CommentSectionProps {
  docId: string;
  collectionType: 'posts' | 'wishlists';
}

function CommentForm({
    docId,
    collectionType,
    parentId = null,
    onCommentPosted,
  }: {
    docId: string;
    collectionType: 'posts' | 'wishlists';
    parentId?: string | null;
    onCommentPosted: () => void;
  }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    const handleAddComment = async (e: FormEvent) => {
      e.preventDefault();
      if (!user || !commentText.trim()) return;
  
      setIsSubmitting(true);
  
      try {
        const parentDocRef = doc(db, collectionType, docId);
        const commentsColRef = collection(parentDocRef, 'comments');
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
  
        const batch = writeBatch(db);
  
        const newCommentData = {
          text: commentText,
          authorId: user.uid,
          authorName: userData?.name || user.displayName,
          authorUsername: userData?.username || 'user',
          authorAvatar: userData?.photoURL || user.photoURL,
          createdAt: serverTimestamp(),
          parentId: parentId,
          replyCount: 0,
        };
  
        batch.set(doc(commentsColRef), newCommentData);
  
        if (parentId) {
          // It's a reply, increment replyCount on the parent comment
          const parentCommentRef = doc(commentsColRef, parentId);
          batch.update(parentCommentRef, { replyCount: increment(1) });
        }
  
        // Always increment the main post's comment count for both comments and replies
        batch.update(parentDocRef, { commentCount: increment(1) });
  
        await batch.commit();
        setCommentText('');
        onCommentPosted();
      } catch (error) {
        console.error("Error adding comment/reply: ", error);
        toast({ title: "Error", description: "Failed to post.", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    };
  
    if (!user) return null;
  
    return (
      <form onSubmit={handleAddComment} className="flex items-start gap-2 sm:gap-4">
        <Avatar className="hidden h-9 w-9 sm:flex">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'You'} />
          <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder={parentId ? "Write a reply..." : "Add a comment..."}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={parentId ? 2 : 2}
            className="bg-secondary/50"
            disabled={isSubmitting}
          />
          <div className="mt-2 flex justify-end gap-2">
            {parentId && (
              <Button type="button" variant="ghost" onClick={onCommentPosted} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" size={parentId ? "sm" : "default"} disabled={isSubmitting || !commentText.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {parentId ? "Reply" : "Post"}
            </Button>
          </div>
        </div>
      </form>
    );
}

function CommentWithReplies({ comment, docId, collectionType }: { comment: Comment; docId: string; collectionType: 'posts' | 'wishlists' }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
  
    const handleDeleteComment = async (commentToDelete: Comment) => {
      if (!user || isDeleting) return;
  
      setIsDeleting(true);
      try {
        const batch = writeBatch(db);
        const parentDocRef = doc(db, collectionType, docId);
        const commentsColRef = collection(parentDocRef, 'comments');
  
        // 1. Find all replies to be deleted (even if not loaded)
        const repliesQuery = query(commentsColRef, where("parentId", "==", commentToDelete.id));
        const repliesSnapshot = await getDocs(repliesQuery);
        let deletedCount = 1; // Start with the main comment itself

        // 2. Delete the main comment
        const mainCommentRef = doc(commentsColRef, commentToDelete.id);
        batch.delete(mainCommentRef);
  
        // 3. Delete all its replies
        repliesSnapshot.forEach(replyDoc => {
          batch.delete(replyDoc.ref);
          deletedCount++;
        });

        // 4. If it's a reply, decrement the replyCount of its parent comment
        if (commentToDelete.parentId) {
          const parentCommentRef = doc(commentsColRef, commentToDelete.parentId);
          batch.update(parentCommentRef, { replyCount: increment(-1) });
        }
  
        // 5. Decrement the main post's total comment count by the total number of deleted items
        batch.update(parentDocRef, { commentCount: increment(-deletedCount) });
  
        await batch.commit();
        toast({ title: "Success", description: "Comment and replies deleted." });
      } catch(error) {
        console.error("Error deleting comment and its replies: ", error);
        toast({ title: "Error", description: "Could not delete comment.", variant: "destructive" });
      } finally {
        setIsDeleting(false);
      }
    };
  
    return (
      <div className="flex items-start gap-2 sm:gap-4">
        <Avatar className="h-9 w-9">
          <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
          <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="group space-y-2">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  <Link href={`/dashboard/profile/${comment.authorUsername}`} className="hover:underline">
                    {comment.authorName}
                  </Link>
                </p>
                {user?.uid === comment.authorId && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" disabled={isDeleting}>
                         {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete your comment{comment.replyCount > 0 ? " and all of its replies" : ""}.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteComment(comment)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <p className="text-sm">{comment.text}</p>
            </div>
            <div className="flex items-center gap-2 pl-3">
              <p className="text-xs text-muted-foreground">
                {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'just now'}
              </p>
              {!comment.parentId && ( // Only show Reply button for top-level comments
                <>
                  <span className="text-xs text-muted-foreground">&middot;</span>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setShowReplyForm(!showReplyForm)}>
                    <MessageSquareReply className="mr-1 h-3 w-3" />
                    Reply
                  </Button>
                </>
              )}
            </div>
          </div>
  
          {/* Reply Form */}
          {showReplyForm && (
            <div className="pt-2">
              <CommentForm docId={docId} collectionType={collectionType} parentId={comment.id} onCommentPosted={() => setShowReplyForm(false)} />
            </div>
          )}
  
          {/* Replies Section */}
          <Collapsible open={comment.replies && comment.replies.length > 0}>
            <CollapsibleContent>
                <div className="pt-4 pl-4 border-l-2 ml-4 space-y-4">
                    {comment.replies?.map(reply => (
                        <CommentWithReplies key={reply.id} comment={reply} docId={docId} collectionType={collectionType} />
                    ))}
                </div>
            </CollapsibleContent>
             {!comment.parentId && comment.replyCount > 0 && (
                <CollapsibleTrigger asChild>
                    <Button variant="link" size="sm" className="pl-3 pt-1 text-xs">
                        {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
                    </Button>
                </CollapsibleTrigger>
             )}
          </Collapsible>

        </div>
      </div>
    );
}

export function CommentSection({ docId, collectionType }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!docId) return;

    setLoadingComments(true);
    const commentsRef = collection(db, collectionType, docId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      
      const commentMap = new Map<string, Comment>();
      const topLevelComments: Comment[] = [];

      // First pass: create map and identify top-level comments
      allComments.forEach(comment => {
        comment.replies = [];
        commentMap.set(comment.id, comment);
        if (!comment.parentId) {
          topLevelComments.push(comment);
        }
      });

      // Second pass: nest replies under their parents
      allComments.forEach(comment => {
        if (comment.parentId) {
          const parent = commentMap.get(comment.parentId);
          if (parent) {
            parent.replies?.push(comment);
          } else {
             // This case can happen if a parent comment is deleted but replies are not.
             // We can choose to show them as orphaned or hide them.
             // For now, we'll just log it.
             console.warn("Orphaned reply found:", comment.id);
          }
        }
      });

      setComments(topLevelComments);
      setLoadingComments(false);
    }, (error) => {
      console.error("Error fetching comments: ", error);
      toast({ title: "Error", description: "Could not load comments.", variant: "destructive" });
      setLoadingComments(false);
    });

    return () => unsubscribe();
  }, [docId, collectionType, toast]);
  

  return (
    <div className="space-y-4 border-t px-4 py-4">
      {/* Post a comment form */}
      <CommentForm docId={docId} collectionType={collectionType} onCommentPosted={() => {}} />

      {/* Comments List */}
      <div className="space-y-6 pt-4">
        {loadingComments ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentWithReplies key={comment.id} comment={comment} docId={docId} collectionType={collectionType} />
          ))
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}
