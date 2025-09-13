
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
import { Loader2, Trash2, Heart, MessageCircle, Repeat2, Bookmark, Share2 } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  likes: number;
}

const COMMENT_MAX_LENGTH = 300;

// #region Comment Form
interface CommentFormProps {
  parentComment?: Comment | null;
  onCommentPosted: () => void;
  docId: string;
  collectionType: 'posts' | 'wishlists';
}

function CommentForm({
  parentComment,
  onCommentPosted,
  docId,
  collectionType,
}: CommentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim() || commentText.length > COMMENT_MAX_LENGTH) return;

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
      toast({ title: "Error", description: "Failed to post reply.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const remainingChars = COMMENT_MAX_LENGTH - commentText.length;
  const placeholderText = parentComment ? `Replying to @${parentComment.authorUsername}...` : "Post your reply...";

  return (
    <form onSubmit={handleAddComment}>
      <div className="flex items-start gap-2 sm:gap-4 my-4">
        <Avatar className="hidden h-9 w-9 sm:flex">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'You'} />
          <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder={placeholderText}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={2}
            maxLength={COMMENT_MAX_LENGTH}
            className="bg-secondary/50"
            disabled={isSubmitting}
          />
          <div className="mt-2 flex items-center justify-between gap-4">
            <span className={`text-xs ${remainingChars < 20 ? (remainingChars < 0 ? 'text-destructive' : 'text-yellow-500') : 'text-muted-foreground'}`}>
              {remainingChars}
            </span>
            <div className="flex items-center gap-2">
              {parentComment && (
                <Button type="button" variant="ghost" size="sm" onClick={onCommentPosted} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
              <Button type="submit" size={parentComment ? "sm" : "default"} disabled={isSubmitting || !commentText.trim() || remainingChars < 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reply
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
// #endregion


// #region Comment Item

interface CommentItemProps {
  comment: Comment;
  docId: string;
  collectionType: 'posts' | 'wishlists';
  docAuthorId: string;
  activeReplyId: string | null;
  setActiveReplyId: (id: string | null) => void;
  isReply: boolean;
}

function CommentItem({ comment, docId, collectionType, activeReplyId, setActiveReplyId, docAuthorId, isReply }: CommentItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const { hasLiked, isLiking, toggleLike } = useCommentInteraction(docId, collectionType, comment.id);
  const isReplyFormOpen = activeReplyId === comment.id;

  const handleToggleReplyForm = () => {
    setActiveReplyId(isReplyFormOpen ? null : comment.id);
  };

  const handleDeleteComment = async (commentToDelete: Comment) => {
    if (!user || isDeleting) return;

    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      const parentDocRef = doc(db, collectionType, docId);
      const commentsColRef = collection(parentDocRef, 'comments');

      // Recursively find all replies to delete
      const repliesToDelete: string[] = [];
      const findReplies = async (parentId: string) => {
        const repliesQuery = query(commentsColRef, where("parentId", "==", parentId));
        const repliesSnapshot = await getDocs(repliesQuery);
        for (const replyDoc of repliesSnapshot.docs) {
          repliesToDelete.push(replyDoc.id);
          await findReplies(replyDoc.id);
        }
      };

      await findReplies(commentToDelete.id);

      // Delete the main comment and all its replies
      const mainCommentRef = doc(commentsColRef, commentToDelete.id);
      batch.delete(mainCommentRef);
      repliesToDelete.forEach(replyId => {
        batch.delete(doc(commentsColRef, replyId));
      });
      
      const totalDeleted = 1 + repliesToDelete.length;

      // Update reply count on parent if it's a reply
      if (commentToDelete.parentId) {
        const parentCommentRef = doc(commentsColRef, commentToDelete.parentId);
        batch.update(parentCommentRef, { replyCount: increment(-1) });
      }

      // Update total comment count on the main post/wishlist
      batch.update(parentDocRef, { commentCount: increment(-totalDeleted) });

      await batch.commit();
      toast({ title: "Success", description: "Comment and replies deleted." });
    } catch (error) {
      console.error("Error deleting comment and its replies: ", error);
      toast({ title: "Error", description: "Could not delete comment.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const hasLine = isReply;
  const isPostOwnerReply = isReply && comment.authorId === docAuthorId;

  return (
    <div className="flex w-full items-start gap-2 sm:gap-4 relative pt-4">
        {hasLine && (
            <div className="absolute bottom-0 left-[18px] top-0 w-0.5 bg-border -translate-x-1/2"></div>
        )}

      <Avatar className="h-9 w-9 z-10">
        <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
        <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 pt-1.5 min-w-0">
        <div className="group space-y-2">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <p className="font-semibold break-words">
                  <Link href={`/dashboard/profile/${comment.authorUsername}`} className="hover:underline">
                    {comment.authorName}
                  </Link>
                </p>
                <p className='text-xs text-muted-foreground whitespace-nowrap'>
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
              <p className="text-sm text-muted-foreground">
                Replying to <Link href={`/dashboard/profile/${comment.parentAuthorUsername}`} className="text-primary hover:underline">@{comment.parentAuthorUsername}</Link>
              </p>
            )}

            <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
          </div>

          <div className="flex justify-between -ml-2">
            <TooltipProvider>
              <div className="flex items-center text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleToggleReplyForm}>
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs"><p>Reply</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Repeat2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs"><p>Repost</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleLike} disabled={isLiking || !user}>
                      <Heart className={`h-5 w-5 ${hasLiked ? 'text-red-500 fill-current' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs"><p>Like</p></TooltipContent>
                </Tooltip>
                {comment.likes > 0 && <span className={`text-sm pr-2 ${hasLiked ? 'text-red-500' : ''}`}>{comment.likes}</span>}
              </div>

              <div className="flex items-center text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Bookmark className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs"><p>Bookmark</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs"><p>Share</p></TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>
      {isReplyFormOpen && (
        <div className="pl-11">
          <CommentForm docId={docId} collectionType={collectionType} parentComment={comment} onCommentPosted={() => setActiveReplyId(null)} />
        </div>
      )}
    </div>
  );
}

// #endregion


// #region Main Component
interface CommentSectionProps {
  docId: string;
  collectionType: 'posts' | 'wishlists';
  docAuthorId: string;
}

export function CommentSection({ docId, collectionType, docAuthorId }: CommentSectionProps) {
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!docId) return;

    setLoadingComments(true);
    const commentsRef = collection(db, collectionType, docId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setAllComments(commentsData);
      setLoadingComments(false);
    }, (error) => {
      console.error("Error fetching comments: ", error);
      toast({ title: "Error", description: "Could not load comments.", variant: "destructive" });
      setLoadingComments(false);
    });

    return () => unsubscribe();
  }, [docId, collectionType, toast]);
  
  const commentThreads = useMemo(() => {
    const commentMap = new Map<string, Comment>(allComments.map(c => [c.id, c]));
    const rootComments: Comment[] = [];
    const threads: Comment[][] = [];

    // First, identify root comments
    for (const comment of allComments) {
        if (!comment.parentId) {
            rootComments.push(comment);
        }
    }
    
    // Sort root comments by newest first
    rootComments.sort((a,b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));

    const buildThread = (commentId: string): Comment[] => {
        const replies: Comment[] = [];
        for (const comment of allComments) {
            if (comment.parentId === commentId) {
                replies.push(comment);
            }
        }
        replies.sort((a,b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
        
        const thread: Comment[] = [];
        for (const reply of replies) {
            thread.push(reply, ...buildThread(reply.id));
        }
        return thread;
    };
    
    for (const root of rootComments) {
        const thread = [root, ...buildThread(root.id)];
        threads.push(thread);
    }
    
    return threads;
  }, [allComments]);


  return (
    <div className="space-y-4">
      <CommentForm 
        docId={docId} 
        collectionType={collectionType} 
        onCommentPosted={() => { setActiveReplyId(null); }} 
      />

      <div className="flex flex-col">
        {loadingComments ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : commentThreads.length > 0 ? (
          commentThreads.map((thread, index) => (
            <div key={thread[0].id} className="border-t">
                {thread.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        docId={docId}
                        collectionType={collectionType}
                        docAuthorId={docAuthorId}
                        activeReplyId={activeReplyId}
                        setActiveReplyId={setActiveReplyId}
                        isReply={!!comment.parentId}
                    />
                ))}
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground border-t">No comments yet. Be the first to reply!</p>
        )}
      </div>
    </div>
  );
}
// #endregion

    