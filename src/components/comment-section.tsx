'use client';

import { useState, useEffect, FormEvent } from 'react';
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
import { Loader2, Trash2, MessageSquareReply, Heart } from 'lucide-react';
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
import { useCommentInteraction } from '@/hooks/use-comment-interaction';


interface Comment extends DocumentData {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  text: string;
  createdAt: Timestamp;
  parentId: string | null;
  parentAuthorUsername?: string;
  replyCount: number;
  replies?: Comment[];
  likes: number;
}

interface CommentSectionProps {
  docId: string;
  collectionType: 'posts' | 'wishlists';
}

function CommentForm({
    docId,
    collectionType,
    parentComment,
    onCommentPosted,
  }: {
    docId: string;
    collectionType: 'posts' | 'wishlists';
    parentComment?: Comment | null;
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
  
        const newCommentData: any = {
          text: commentText,
          authorId: user.uid,
          authorName: userData?.name || user.displayName,
          authorUsername: userData?.username || 'user',
          authorAvatar: userData?.photoURL || user.photoURL,
          createdAt: serverTimestamp(),
          parentId: parentComment?.id || null,
          replyCount: 0,
          likes: 0,
          likedBy: [],
        };

        if (parentComment) {
          newCommentData.parentAuthorUsername = parentComment.authorUsername;
        }
  
        const newCommentRef = doc(commentsColRef);
        batch.set(newCommentRef, newCommentData);
  
        if (parentComment) {
          const parentCommentRef = doc(commentsColRef, parentComment.id);
          batch.update(parentCommentRef, { replyCount: increment(1) });
        }
  
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
            placeholder={parentComment ? `Replying to @${parentComment.authorUsername}...` : "Add a comment..."}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={2}
            className="bg-secondary/50"
            disabled={isSubmitting}
          />
          <div className="mt-2 flex justify-end gap-2">
            {parentComment && (
              <Button type="button" variant="ghost" onClick={onCommentPosted} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" size={parentComment ? "sm" : "default"} disabled={isSubmitting || !commentText.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {parentComment ? "Reply" : "Post"}
            </Button>
          </div>
        </div>
      </form>
    );
}

function CommentWithReplies({ comment, docId, collectionType, activeReplyId, setActiveReplyId, isReply = false }: { comment: Comment; docId: string; collectionType: 'posts' | 'wishlists', activeReplyId: string | null, setActiveReplyId: (id: string | null) => void, isReply?: boolean }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const { hasLiked, isLiking, toggleLike } = useCommentInteraction(docId, collectionType, comment.id);

    const isReplyFormOpen = activeReplyId === comment.id;

    const handleToggleReplyForm = () => {
        if(isReplyFormOpen) {
            setActiveReplyId(null);
        } else {
            setActiveReplyId(comment.id);
        }
    }
  
    const handleDeleteComment = async (commentToDelete: Comment) => {
      if (!user || isDeleting) return;
  
      setIsDeleting(true);
      try {
        const batch = writeBatch(db);
        const parentDocRef = doc(db, collectionType, docId);
        const commentsColRef = collection(parentDocRef, 'comments');
  
        const repliesQuery = query(commentsColRef, where("parentId", "==", commentToDelete.id));
        const repliesSnapshot = await getDocs(repliesQuery);
        let deletedCount = 1;

        const mainCommentRef = doc(commentsColRef, commentToDelete.id);
        batch.delete(mainCommentRef);
  
        repliesSnapshot.forEach(replyDoc => {
          batch.delete(replyDoc.ref);
          deletedCount++;
        });

        if (commentToDelete.parentId) {
          const parentCommentRef = doc(commentsColRef, commentToDelete.parentId);
          batch.update(parentCommentRef, { replyCount: increment(-1) });
        }
  
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
      <div className="relative flex items-start gap-2 sm:gap-4">
        {isReply && <div className="absolute left-4 top-0 h-full w-px bg-border -translate-x-1/2"></div>}
        <div className="flex-shrink-0 z-10 bg-background">
            <Avatar className="h-9 w-9">
              <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
              <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
            </Avatar>
        </div>
        <div className="flex-1">
          <div className="group space-y-2">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <p className="font-semibold">
                    <Link href={`/dashboard/profile/${comment.authorUsername}`} className="hover:underline">
                      {comment.authorName}
                    </Link>
                  </p>
                  <p className='text-xs text-muted-foreground'>
                     · {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                  </p>
                </div>
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

               {comment.parentAuthorUsername && (
                  <p className="text-xs text-muted-foreground">
                    Replying to <Link href={`/dashboard/profile/${comment.parentAuthorUsername}`} className="text-primary hover:underline">@{comment.parentAuthorUsername}</Link>
                  </p>
                )}

              <p className="text-sm">{comment.text}</p>
            </div>
            <div className="flex items-center gap-2 pl-3">
               <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground" onClick={toggleLike} disabled={isLiking || !user}>
                <Heart className={`mr-1 h-4 w-4 ${hasLiked ? 'text-red-500 fill-current' : ''}`} />
                {comment.likes > 0 ? comment.likes : ''}
              </Button>
              <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={handleToggleReplyForm}>
                <MessageSquareReply className="mr-1 h-3 w-3" />
                Reply
              </Button>
            </div>
          </div>
  
          {isReplyFormOpen && (
            <div className="pt-4">
              <CommentForm docId={docId} collectionType={collectionType} parentComment={comment} onCommentPosted={() => setActiveReplyId(null)} />
            </div>
          )}
  
          {comment.replyCount > 0 && !showReplies && (
             <Button variant="link" size="sm" className="pl-3 pt-1 text-xs" onClick={() => setShowReplies(true)}>
                 View {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
            </Button>
          )}

          {showReplies && (
            <div className='pt-4'>
                <Button variant="link" size="sm" className="pl-3 pt-1 text-xs" onClick={() => setShowReplies(false)}>
                    Hide replies
                </Button>
            </div>
          )}

          {showReplies && comment.replies && comment.replies.length > 0 && (
             <div className="pt-4 space-y-4">
                {comment.replies.map(reply => (
                    <CommentWithReplies key={reply.id} comment={reply} docId={docId} collectionType={collectionType} activeReplyId={activeReplyId} setActiveReplyId={setActiveReplyId} isReply={true}/>
                ))}
             </div>
          )}

        </div>
      </div>
    );
}

export function CommentSection({ docId, collectionType }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
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

      allComments.forEach(comment => {
        comment.replies = [];
        commentMap.set(comment.id, comment);
      });
      
      allComments.forEach(comment => {
        if (comment.parentId) {
          const parent = commentMap.get(comment.parentId);
          if (parent) {
            parent.replies?.push(comment);
          }
        } else {
          topLevelComments.push(comment);
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
    <div className="space-y-4">
      <CommentForm docId={docId} collectionType={collectionType} onCommentPosted={() => {}} />

      <div className="space-y-6 pt-4">
        {loadingComments ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="relative">
                <CommentWithReplies comment={comment} docId={docId} collectionType={collectionType} activeReplyId={activeReplyId} setActiveReplyId={setActiveReplyId} isReply={false} />
                {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-4 sm:ml-6 pl-4 sm:pl-6 border-l space-y-4 mt-4">
                        {comment.replies.map(reply => (
                           <CommentWithReplies key={reply.id} comment={reply} docId={docId} collectionType={collectionType} activeReplyId={activeReplyId} setActiveReplyId={setActiveReplyId} isReply={true} />
                        ))}
                    </div>
                )}
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}