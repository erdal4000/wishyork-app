
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
import { Loader2, Trash2, MessageSquareReply, Heart, X } from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';
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
  likes: number;
}

const COMMENT_MAX_LENGTH = 300;

interface CommentSectionProps {
  docId: string;
  collectionType: 'posts' | 'wishlists';
  docAuthorId: string;
}

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


interface CommentItemProps {
    comment: Comment;
    docId: string;
    collectionType: 'posts' | 'wishlists';
    docAuthorId: string;
    activeReplyId: string | null;
    setActiveReplyId: (id: string | null) => void;
    isReply?: boolean;
}


function CommentItem({ comment, docId, collectionType, docAuthorId, activeReplyId, setActiveReplyId }: CommentItemProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const { hasLiked, isLiking, toggleLike } = useCommentInteraction(docId, collectionType, comment.id);

    const isReplyFormOpen = activeReplyId === comment.id;

    const handleToggleReplyForm = () => {
        setActiveReplyId(isReplyFormOpen ? null : comment.id);
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
          const parentCommentRef = doc(commentsCol-colRef, commentToDelete.parentId);
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
      <div className="flex w-full flex-col">
        <div className="flex w-full items-start gap-2 sm:gap-4">
            <Avatar className="h-9 w-9">
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
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="p-1 h-auto text-muted-foreground flex items-center gap-1" onClick={toggleLike} disabled={isLiking || !user}>
                            <Heart className={`h-4 w-4 ${hasLiked ? 'text-red-500 fill-current' : ''}`} />
                            {comment.likes > 0 && <span className="text-xs">{comment.likes}</span>}
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1 h-auto text-muted-foreground flex items-center gap-1" onClick={handleToggleReplyForm}>
                            <MessageSquareReply className="h-4 w-4" />
                            <span className='text-xs'>Reply</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        {isReplyFormOpen && (
            <div className="w-full pl-0">
                <CommentForm docId={docId} collectionType={collectionType} parentComment={comment} onCommentPosted={() => setActiveReplyId(null)} />
            </div>
        )}
      </div>
    );
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
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

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
  
  const sortedComments = useMemo(() => {
    const commentMap = new Map(allComments.map(c => [c.id, {...c, children: [] as Comment[]}]));
    const rootComments: Comment[] = [];

    allComments.forEach(comment => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        commentMap.get(comment.parentId)?.children.push(comment as never);
      } else {
        rootComments.push(comment);
      }
    });

    const flattened: Comment[] = [];
    const walk = (comments: Comment[]) => {
      comments.forEach(comment => {
        flattened.push(comment);
        const children = commentMap.get(comment.id)?.children;
        if (children) {
          walk(children.sort((a,b) => a.createdAt.toMillis() - b.createdAt.toMillis()));
        }
      });
    };

    walk(rootComments);
    return flattened;

  }, [allComments]);


  return (
    <div className="space-y-4">
      <CommentForm 
        docId={docId} 
        collectionType={collectionType} 
        onCommentPosted={() => { setActiveReplyId(null); }} 
      />

      <div className="space-y-6">
        {loadingComments ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sortedComments.length > 0 ? (
          sortedComments.map((comment) => (
            <CommentItem 
                key={comment.id} 
                comment={comment} 
                docId={docId} 
                collectionType={collectionType}
                docAuthorId={docAuthorId}
                activeReplyId={activeReplyId} 
                setActiveReplyId={setActiveReplyId} 
            />
          ))
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">No comments yet. Be the first to reply!</p>
        )}
      </div>
    </div>
  );
}
