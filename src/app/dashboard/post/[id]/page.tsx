
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/utils';
import { usePostInteraction } from '@/hooks/use-post-interaction';
import { ArrowLeft, MoreHorizontal, Heart, MessageCircle, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentSection } from '@/components/comment-section';
import { Separator } from '@/components/ui/separator';

interface Post extends DocumentData {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  imageUrl: string | null;
  aiHint: string | null;
  createdAt: Timestamp;
  likes: number;
  commentCount: number;
}

function PostDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <Skeleton className="h-10 w-24" />
                 <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="aspect-video w-full rounded-xl" />
                </CardContent>
                <CardFooter className="p-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20 ml-2" />
                    <Skeleton className="h-8 w-24 ml-2" />
                </CardFooter>
            </Card>
            <Separator />
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-20 w-full" />
            </div>
        </div>
    )
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const { hasLiked, isLiking, toggleLike } = usePostInteraction(id);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const docRef = doc(db, 'posts', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() } as Post);
      } else {
        console.log("No such post!");
        setPost(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching post: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return <PostDetailSkeleton />;
  }

  if (!post) {
    return <div>Post not found.</div>;
  }

  const authorPhoto = post.authorAvatar || `https://picsum.photos/seed/${post.authorId}/200/200`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 p-4">
          <Avatar>
            <AvatarImage src={authorPhoto} alt={post.authorName} />
            <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-bold">{post.authorName}</p>
            <p className="text-sm text-muted-foreground">
              <Link href={`/dashboard/profile/${post.authorUsername}`}>@{post.authorUsername}</Link>
              {' · '}
              {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'just now'}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-2">
          <p className="whitespace-pre-wrap text-base">{post.content}</p>
          {post.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <Image
                src={post.imageUrl}
                alt={`Post by ${post.authorName}`}
                fill
                className="object-cover"
                data-ai-hint={post.aiHint ?? ''}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="p-2">
          <Button variant="ghost" className="flex items-center gap-2" onClick={toggleLike} disabled={isLiking || !user}>
            <Heart className={`h-5 w-5 ${hasLiked ? 'text-red-500 fill-current' : ''}`} />
            <span className="text-sm">{post.likes ?? 0}</span>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2" disabled>
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">{post.commentCount ?? 0}</span>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            <span className="text-sm">Share</span>
          </Button>
        </CardFooter>
      </Card>
      
      <Separator />

      {/* Comments Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Comments ({post.commentCount || 0})</h2>
        <CommentSection docId={post.id} collectionType="posts" />
      </div>
    </div>
  );
}

