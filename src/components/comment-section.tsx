
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
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

// #region Reply Dialog
interface ReplyDialogProps {
  parentComment: Comment;
  docId: string;
  collectionType: 'posts' | 'wishlists';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ReplyDialog({ parentComment, docId, collectionType, open, onOpenChange }: ReplyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddReply = async (e: FormEvent) => {
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
        parentId: parentComment.id,
        parentAuthorUsername: parentComment.authorUsername,
        replyCount: 0,
        likes: 0,
        likedBy: [],
      };

      const newCommentRef = doc(commentsColRef);
      batch.set(newCommentRef, newCommentData);

      const parentCommentRef = doc(commentsColRef, parentComment.id);
      batch.update(parentCommentRef, { replyCount: increment(1) });
      batch.update(parentDocRef, { commentCount: increment(1) });

      await batch.commit();
      setCommentText('');
      onOpenChange(false); // Close dialog on success
    } catch (error) {
      console.error("Error adding reply: ", error);
      toast({ title: "Error", description: "Failed to post reply.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const remainingChars = COMMENT_MAX_LENGTH - commentText.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replying to @{parentComment.authorUsername}</DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <form onSubmit={handleAddReply}>
            <div className="flex items-start gap-2 sm:gap-4">
              <Avatar className="hidden h-9 w-9 sm:flex">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'You'} />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder={`Post your reply...`}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                  maxLength={COMMENT_MAX_LENGTH}
                  className="bg-background"
                  disabled={isSubmitting}
                  autoFocus
                />
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className={`text-xs ${remainingChars < 20 ? (remainingChars < 0 ? 'text-destructive' : 'text-yellow-500') : 'text-muted-foreground'}`}>
                    {remainingChars}
                  </span>
                  <DialogFooter className="sm:justify-end">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !commentText.trim() || remainingChars < 0}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Reply
                    </Button>
                  </DialogFooter>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// #endregion

// #region Comment Form
interface CommentFormProps {
  onCommentPosted: () => void;
  docId: string;
  collectionType: 'posts' | 'wishlists';
}

function CommentForm({
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
        parentId: null,
        replyCount: 0,
        likes: 0,
        likedBy: [],
      };

      const newCommentRef = doc(commentsColRef);
      batch.set(newCommentRef, newCommentData);
      batch.update(parentDocRef, { commentCount: increment(1) });
      await batch.commit();

      setCommentText('');
      onCommentPosted();
    } catch (error) {
      console.error("Error adding comment: ", error);
      toast({ title: "Error", description: "Failed to post comment.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const remainingChars = COMMENT_MAX_LENGTH - commentText.length;

  return (
    <form onSubmit={handleAddComment}>
      <div className="flex items-start gap-2 sm:gap-4 my-4">
        <Avatar className="hidden h-9 w-9 sm:flex">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'You'} />
          <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Post your reply..."
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
              <Button type="submit" disabled={isSubmitting || !commentText.trim() || remainingChars < 0}>
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
  onReplyClick: (comment: Comment) => void;
}

function CommentItem({ comment, docId, collectionType, onReplyClick }: CommentItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const { hasLiked, isLiking, toggleLike } = useCommentInteraction(docId, collectionType, comment.id);

  const handleDeleteComment = async (commentToDelete: Comment) => {
    if (!user || isDeleting) return;

    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      const parentDocRef = doc(db, collectionType, docId);
      const commentsColRef = collection(parentDocRef, 'comments');

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

      const mainCommentRef = doc(commentsColRef, commentToDelete.id);
      batch.delete(mainCommentRef);
      repliesToDelete.forEach(replyId => {
        batch.delete(doc(commentsColRef, replyId));
      });
      
      const totalDeleted = 1 + repliesToDelete.length;

      if (commentToDelete.parentId) {
        const parentCommentRef = doc(commentsColRef, commentToDelete.parentId);
        batch.update(parentCommentRef, { replyCount: increment(-1) });
      }

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

  return (
    <div className="flex w-full items-start gap-2 py-4 sm:gap-4">
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
        <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="group space-y-2">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <p className="break-words font-semibold">
                  <Link href={`/dashboard/profile/${comment.authorUsername}`} className="hover:underline">
                    {comment.authorName}
                  </Link>
                </p>
                <p className="whitespace-nowrap text-xs text-muted-foreground">
                  · {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                </p>
              </div>
              {user?.uid === comment.authorId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100" disabled={isDeleting}>
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

            <p className="whitespace-pre-wrap text-sm">{comment.text}</p>
          </div>

          <div className="-ml-2 flex justify-between">
            <TooltipProvider>
              <div className="flex items-center text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onReplyClick(comment)}>
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
                {comment.likes > 0 && <span className={`pr-2 text-sm ${hasLiked ? 'text-red-500' : ''}`}>{comment.likes}</span>}
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

export function CommentSection({ docId, collectionType }: CommentSectionProps) {
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
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
    const threads: { main: Comment; replies: Comment[] }[] = [];
    const commentMap = new Map(allComments.map(c => [c.id, c]));
    const handledIds = new Set<string>();

    for (const comment of allComments) {
      if (handledIds.has(comment.id)) continue;
      if (!comment.parentId) {
        const main = comment;
        const replies: Comment[] = [];
        
        const findReplies = (parentId: string) => {
          allComments.forEach(reply => {
            if (reply.parentId === parentId) {
              replies.push(reply);
              handledIds.add(reply.id);
              findReplies(reply.id);
            }
          });
        };
        
        findReplies(main.id);
        replies.sort((a,b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
        threads.push({ main, replies });
        handledIds.add(main.id);
      }
    }
    
    return threads;
  }, [allComments]);


  const handleReplyClick = (comment: Comment) => {
    setReplyingTo(comment);
  };
  
  return (
    <div className="space-y-4">
      <CommentForm 
        docId={docId} 
        collectionType={collectionType} 
        onCommentPosted={() => { /* maybe scroll to top */ }} 
      />

      <div className="flex flex-col">
        {loadingComments ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : commentThreads.length > 0 ? (
          <div>
              {commentThreads.map((thread, index) => (
                  <div key={thread.main.id} className="border-t">
                      {/* Render main comment */}
                      <CommentItem
                          comment={thread.main}
                          docId={docId}
                          collectionType={collectionType}
                          onReplyClick={handleReplyClick}
                      />
                      {/* Render replies */}
                      {thread.replies.map(reply => (
                          <CommentItem
                              key={reply.id}
                              comment={reply}
                              docId={docId}
                              collectionType={collectionType}
                              onReplyClick={handleReplyClick}
                          />
                      ))}
                  </div>
              ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground border-t">No comments yet. Be the first to reply!</p>
        )}
      </div>

      {replyingTo && (
        <ReplyDialog
          docId={docId}
          collectionType={collectionType}
          parentComment={replyingTo}
          open={!!replyingTo}
          onOpenChange={(open) => !open && setReplyingTo(null)}
        />
      )}
    </div>
  );
}
// #endregion

