

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
  updateDoc,
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2, Trash2, Heart, MessageCircle, Repeat2, Bookmark, Share2, MoreHorizontal, Edit, AlertTriangle } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  edited?: boolean;
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
        edited: false,
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
        edited: false,
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
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const { hasLiked, isLiking, toggleLike } = useCommentInteraction(docId, collectionType, comment.id);

  const handleUpdateComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;

    try {
        const commentRef = doc(db, collectionType, docId, 'comments', comment.id);
        await updateDoc(commentRef, {
            text: editText,
            edited: true,
        });
        setIsEditing(false);
        toast({ title: "Success", description: "Your comment has been updated." });
    } catch (error) {
        console.error("Error updating comment:", error);
        toast({ title: "Error", description: "Failed to update comment.", variant: "destructive" });
    }
  };

  const handleReportComment = async () => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'reports'), {
            type: 'comment',
            contentId: comment.id,
            parentContentId: docId,
            parentCollectionType: collectionType,
            reportedByUid: user.uid,
            reportedAt: serverTimestamp(),
            reason: 'User reported from menu.',
            status: 'new',
        });
        toast({ title: "Comment Reported", description: "Thank you for your feedback. Our moderation team will review this comment." });
    } catch (error) {
        console.error("Error reporting comment:", error);
        toast({ title: "Error", description: "Could not report comment.", variant: "destructive" });
    }
  };

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
        const parentSnap = await getDoc(parentCommentRef);
        if (parentSnap.exists()) {
             batch.update(parentCommentRef, { replyCount: increment(-1) });
        }
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
  
  const isOwnComment = user?.uid === comment.authorId;

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
                {comment.edited && <p className="text-xs text-muted-foreground">(edited)</p>}
              </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100" disabled={isDeleting}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {isOwnComment ? (
                            <>
                            <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
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
                            </>
                        ) : (
                            <DropdownMenuItem onSelect={handleReportComment}>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                <span>Report comment</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {comment.parentAuthorUsername && (
              <p className="text-sm text-muted-foreground">
                Replying to <Link href={`/dashboard/profile/${comment.parentAuthorUsername}`} className="text-primary hover:underline">@{comment.parentAuthorUsername}</Link>
              </p>
            )}

            {isEditing ? (
                <form onSubmit={handleUpdateComment} className="mt-2">
                    <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="text-sm"
                        autoFocus
                    />
                    <div className="mt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button type="submit" size="sm">Save</Button>
                    </div>
                </form>
            ) : (
                 <p className="whitespace-pre-wrap text-sm">{comment.text}</p>
            )}

          </div>

          {!isEditing && (
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
          )}
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
    const commentMap = new Map<string, Comment>(allComments.map(c => [c.id, c]));
    const rootComments: Comment[] = [];
    const threads: { main: Comment; replies: Comment[] }[] = [];

    // First, find all root comments (those with no parentId)
    for (const comment of allComments) {
        if (!comment.parentId) {
            rootComments.push(comment);
        }
    }

    // Now, for each root comment, find all its replies recursively
    const findReplies = (parentId: string): Comment[] => {
        const replies: Comment[] = [];
        for (const comment of allComments) {
            if (comment.parentId === parentId) {
                replies.push(comment);
                // Find replies to this reply
                replies.push(...findReplies(comment.id));
            }
        }
        return replies;
    };
    
    // Sort root comments by creation time
    rootComments.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    // Build the final threads structure
    for (const root of rootComments) {
        const replies = findReplies(root.id);
        // Replies should also be sorted by time
        replies.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
        threads.push({ main: root, replies: replies });
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
          <div className="space-y-0">
            {commentThreads.map((thread) => (
                <div key={thread.main.id} className="border-t first:border-t-0">
                    <CommentItem
                        comment={thread.main}
                        docId={docId}
                        collectionType={collectionType}
                        onReplyClick={handleReplyClick}
                    />
                    {thread.replies.map(reply => (
                        <div key={reply.id} className="">
                             <CommentItem
                                comment={reply}
                                docId={docId}
                                collectionType={collectionType}
                                onReplyClick={handleReplyClick}
                            />
                        </div>
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

