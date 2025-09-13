
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
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2, Trash2 } from 'lucide-react';
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

interface Comment extends DocumentData {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  text: string;
  createdAt: Timestamp;
}

interface CommentSectionProps {
  docId: string;
  collectionType: 'posts' | 'wishlists';
}

export function CommentSection({ docId, collectionType }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!docId) return;

    setLoadingComments(true);
    const commentsRef = collection(db, collectionType, docId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(fetchedComments);
      setLoadingComments(false);
    }, (error) => {
      console.error("Error fetching comments: ", error);
      toast({ title: "Error", description: "Could not load comments.", variant: "destructive" });
      setLoadingComments(false);
    });

    return () => unsubscribe();
  }, [docId, collectionType, toast]);

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);

    try {
        const parentDocRef = doc(db, collectionType, docId);
        const commentsColRef = collection(parentDocRef, 'comments');

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();

        const batch = writeBatch(db);

        batch.set(doc(commentsColRef), {
          text: newComment,
          authorId: user.uid,
          authorName: userData?.name || user.displayName,
          authorUsername: userData?.username || 'user',
          authorAvatar: userData?.photoURL || user.photoURL,
          createdAt: serverTimestamp(),
        });

        batch.update(parentDocRef, {
          commentCount: increment(1),
        });
        
        await batch.commit();
        setNewComment('');

    } catch (error) {
      console.error("Error adding comment: ", error);
      toast({ title: "Error", description: "Failed to post comment.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
        const parentDocRef = doc(db, collectionType, docId);
        const commentRef = doc(parentDocRef, 'comments', commentId);

        const batch = writeBatch(db);
        batch.delete(commentRef);
        batch.update(parentDocRef, { commentCount: increment(-1) });
        
        await batch.commit();
        toast({ title: "Success", description: "Comment deleted." });
    } catch(error) {
        console.error("Error deleting comment: ", error);
        toast({ title: "Error", description: "Could not delete comment.", variant: "destructive" });
    }
  };


  return (
    <div className="space-y-4 border-t px-4 py-4">
      {/* Post a comment form */}
      {user && (
        <form onSubmit={handleAddComment} className="flex items-start gap-4">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'You'} />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="bg-secondary/50"
              disabled={isSubmitting}
            />
            <div className="mt-2 flex justify-end">
              <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {loadingComments ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-4">
              <Avatar className="h-9 w-9">
                <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 group">
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
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your comment.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteComment(comment.id)} className="bg-destructive hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     )}
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
                <p className="mt-1.5 pl-3 text-xs text-muted-foreground">
                  {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}
