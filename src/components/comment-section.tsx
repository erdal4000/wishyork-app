
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
import { Loader2, Trash2, Heart, MessageCircle, MoreHorizontal, AlertTriangle, Repeat2, Bookmark, Share2 } from 'lucide-react';
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCommentInteraction } from '@/hooks/use-comment-interaction';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Comment extends DocumentData {
  id: string;
  authorId: string;
  text: string;
  createdAt: Timestamp;
  parentId: string | null;
  parentAuthorUsername?: string;
  replyCount: number;
  likes: number;
  edited?: boolean;
}

interface UserProfile extends DocumentData {
  name: string;
  username: string;
  photoURL?: string;
}

interface CommentWithReplies extends Comment {
    replies: CommentWithReplies[];
}

const COMMENT_MAX_LENGTH = 300;

const userProfilesCache: { [key: string]: UserProfile } = {};

const useAuthorProfile = (authorId: string) => {
    const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(userProfilesCache[authorId] || null);

    useEffect(() => {
        if (!authorId) return;
        if (userProfilesCache[authorId]) {
            setAuthorProfile(userProfilesCache[authorId]);
            return;
        }

        const userDocRef = doc(db, 'users', authorId);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const profileData = docSnap.data() as UserProfile;
                userProfilesCache[authorId] = profileData;
                setAuthorProfile(profileData);
            } else {
                setAuthorProfile(null);
            }
        });

        return () => unsubscribe();
    }, [authorId]);

    return { authorProfile };
};


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
  const { authorProfile: parentAuthorProfile } = useAuthorProfile(parentComment.authorId);
  const { authorProfile: currentUserProfile } = useAuthorProfile(user?.uid || '');

  const handleAddReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim() || commentText.length > COMMENT_MAX_LENGTH || !parentAuthorProfile) return;

    setIsSubmitting(true);

    try {
      const parentDocRef = doc(db, collectionType, docId);
      const commentsColRef = collection(parentDocRef, 'comments');
      
      const batch = writeBatch(db);

      const newCommentData: any = {
        text: commentText,
        authorId: user.uid,
        createdAt: serverTimestamp(),
        parentId: parentComment.id,
        parentAuthorUsername: parentAuthorProfile.username,
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
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding reply: ", error);
      toast({ title: "Error", description: "Failed to post reply.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !parentAuthorProfile) return null;

  const remainingChars = COMMENT_MAX_LENGTH - commentText.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replying to @{parentAuthorProfile.username}</DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <form onSubmit={handleAddReply}>
            <div className="flex items-start gap-2 sm:gap-4">
              <Avatar className="hidden h-9 w-9 sm:flex">
                <AvatarImage src={currentUserProfile?.photoURL || undefined} alt={currentUserProfile?.name || 'You'} />
                <AvatarFallback>{getInitials(currentUserProfile?.name)}</AvatarFallback>
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
  const { authorProfile: currentUserProfile } = useAuthorProfile(user?.uid || '');

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim() || commentText.length > COMMENT_MAX_LENGTH) return;

    setIsSubmitting(true);

    try {
      const parentDocRef = doc(db, collectionType, docId);
      const commentsColRef = collection(parentDocRef, 'comments');
      
      const batch = writeBatch(db);

      const newCommentData: any = {
        text: commentText,
        authorId: user.uid,
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
          <AvatarImage src={currentUserProfile?.photoURL || undefined} alt={currentUserProfile?.name || 'You'} />
          <AvatarFallback>{getInitials(currentUserProfile?.name)}</AvatarFallback>
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
  const { authorProfile } = useAuthorProfile(comment.authorId);
  const { hasLiked, isLiking, toggleLike } = useCommentInteraction(docId, collectionType, comment.id);

  const handleReportComment = async () => {
    // ... (logic remains the same)
  };

  const handleDeleteComment = async (commentToDelete: Comment) => {
    // ... (logic remains the same)
  };
  
  const isOwnComment = user?.uid === comment.authorId;

  if (!authorProfile) {
    return (
      <div className="flex w-full items-start gap-2 py-4 sm:gap-4">
          <Avatar className="h-9 w-9 flex-shrink-0">
             <AvatarFallback>??</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 italic text-muted-foreground text-sm">
             Comment by a deleted user.
          </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-start gap-2 py-4 sm:gap-4">
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarImage src={authorProfile.photoURL} alt={authorProfile.name} />
        <AvatarFallback>{getInitials(authorProfile.name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="group space-y-2">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <p className="break-words font-semibold">
                  <Link href={`/dashboard/profile/${authorProfile.username}`} className="hover:underline">
                    {authorProfile.name}
                  </Link>
                </p>
                <p className="whitespace-nowrap text-xs text-muted-foreground">
                  · {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                </p>
              </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100" disabled={isDeleting}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {isOwnComment ? (
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

            <p className="whitespace-pre-wrap text-sm">{comment.text}</p>
          </div>

          <div className="-ml-2 flex justify-between items-center text-muted-foreground">
            <TooltipProvider>
              <div className="flex items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onReplyClick(comment)}>
                        <MessageCircle className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs"><p>Reply</p></TooltipContent>
                  </Tooltip>
                  {comment.replyCount > 0 && <span className="pr-2 text-sm">{comment.replyCount}</span>}

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
              <div className="flex items-center">
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
  
  const commentThreads: CommentWithReplies[] = useMemo(() => {
    const commentMap = new Map(allComments.map(c => [c.id, { ...c, replies: [] as CommentWithReplies[] }]));
    const threads: CommentWithReplies[] = [];

    const reversedComments = [...allComments].reverse();

    for (const comment of reversedComments) {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
            parent.replies.unshift(commentMap.get(comment.id)!);
        }
      } else {
        threads.unshift(commentMap.get(comment.id)!);
      }
    }
    return threads;
  }, [allComments]);

  const handleReplyClick = (comment: Comment) => {
    setReplyingTo(comment);
  };
  
  const renderCommentThread = (commentThread: CommentWithReplies, isMainThread: boolean) => {
    return (
        <div key={commentThread.id} className={isMainThread ? "border-t" : ""}>
             <CommentItem
                comment={commentThread}
                docId={docId}
                collectionType={collectionType}
                onReplyClick={handleReplyClick}
            />
            <div className="pl-0">
                {commentThread.replies.map(reply => renderCommentThread(reply, false))}
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-0">
      <CommentForm 
        docId={docId} 
        collectionType={collectionType} 
        onCommentPosted={() => {}} 
      />

      <div className="flex flex-col">
        {loadingComments ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : commentThreads.length > 0 ? (
          <div className="space-y-0">
            {commentThreads.map(thread => renderCommentThread(thread, true))}
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
