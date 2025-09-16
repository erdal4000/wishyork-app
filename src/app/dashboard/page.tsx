'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2, Bookmark, Repeat2, Package, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { usePostInteraction } from '@/hooks/use-post-interaction';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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

function PostCardSkeleton() {
  return (
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
  );
}

function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const { hasLiked, isLiking, toggleLike } = usePostInteraction(post.id);

  const authorPhoto = post.authorAvatar || `https://picsum.photos/seed/${post.authorId}/200/200`;
  const postDate = post.createdAt?.toDate();
  const timeAgo = postDate ? formatDistanceToNow(postDate, { addSuffix: true }) : 'just now';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={authorPhoto} alt={post.authorName} />
          <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-bold">{post.authorName}</p>
          <p className="text-sm text-muted-foreground">
            <Link href={`/dashboard/profile/${post.authorUsername}`}>@{post.authorUsername}</Link> · {timeAgo}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <Link href={`/dashboard/post/${post.id}`} className="mt-4 block">
            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl border">
              <Image
                src={post.imageUrl}
                alt={`Post image by ${post.authorName}`}
                fill
                className="object-cover"
                data-ai-hint={post.aiHint ?? ''}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </Link>
        )}
      </CardContent>
      <CardFooter className="flex justify-between p-2">
        <TooltipProvider>
          <div className="flex items-center text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs"><p>Reply</p></TooltipContent>
            </Tooltip>
            <span className="text-sm pr-2">{post.commentCount ?? 0}</span>

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
            <span className={`text-sm pr-2 ${hasLiked ? 'text-red-500' : ''}`}>{post.likes ?? 0}</span>
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
      </CardFooter>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        setPosts(postsData);
        setLoading(false);
        setError(null);
      }, 
      (err) => {
        console.error("Error fetching posts:", err);
        setError("Failed to load feed. Please try again later.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
          <Avatar>
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback>{user ? getInitials(user.displayName) : '??'}</AvatarFallback>
          </Avatar>
          <div className="w-full">
            <Textarea
              name="postContent"
              placeholder="What's on your mind? Share a wish or a success story!"
              className="border-0 bg-secondary/50 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={3}
            />
          </div>
        </CardHeader>
        <CardFooter className="flex justify-end p-4 pt-0">
          <Button type="submit">Post</Button>
        </CardFooter>
      </Card>
      
      {loading && (
        <div className="space-y-6">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      )}

      {!loading && error && (
        <Card className="p-8 text-center text-muted-foreground">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive">Feed Unavailable</h3>
          <p className="mt-2">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <h3 className="text-lg font-semibold">It's quiet in here...</h3>
              <p className="mt-2">Be the first to share a post or follow others to see their activity.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
