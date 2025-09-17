
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';
import { getInitials } from '@/lib/utils';
import { usePostInteraction } from '@/hooks/use-post-interaction';
import { ArrowLeft, MoreHorizontal, Heart, MessageCircle, Share2, Loader2, Repeat2, Bookmark, CalendarIcon, ClockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentSection } from '@/components/comment-section';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBookmark } from '@/hooks/use-bookmark';

interface Post extends DocumentData {
  id: string;
  authorId: string;
  content: string;
  imageUrl: string | null;
  aiHint: string | null;
  createdAt: Timestamp;
  likes: number;
  commentCount: number;
}

interface UserProfile extends DocumentData {
  name: string;
  username: string;
  photoURL?: string;
}

const useAuthorProfile = (authorId?: string) => {
    const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        if (!authorId) {
            setLoadingProfile(false);
            return;
        };

        const userDocRef = doc(db, 'users', authorId);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setAuthorProfile(docSnap.data() as UserProfile);
            } else {
                setAuthorProfile(null);
            }
            setLoadingProfile(false);
        });

        return () => unsubscribe();
    }, [authorId]);

    return { authorProfile, loadingProfile };
};

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

  const { authorProfile, loadingProfile } = useAuthorProfile(post?.authorId);
  const { hasLiked, isLiking, toggleLike } = usePostInteraction(id, 'post');
  const { isBookmarked, isToggling: isTogglingBookmark, toggleBookmark } = useBookmark({
    refId: id,
    type: 'post',
    title: post?.content,
    imageUrl: post?.imageUrl,
    authorName: authorProfile?.name,
  });

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

  if (loading || loadingProfile) {
    return <PostDetailSkeleton />;
  }

  if (!post || !authorProfile) {
    return <div>Post not found or author could not be loaded.</div>;
  }

  const postDate = post.createdAt?.toDate();

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
            <AvatarImage src={authorProfile.photoURL} alt={authorProfile.name} />
            <AvatarFallback>{getInitials(authorProfile.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-bold">{authorProfile.name}</p>
            <p className="text-sm text-muted-foreground">
              <Link href={`/dashboard/profile/${authorProfile.username}`}>@{authorProfile.username}</Link>
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <p className="whitespace-pre-wrap text-base">{post.content}</p>
          {post.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <Image
                src={post.imageUrl}
                alt={`Post by ${authorProfile.name}`}
                fill
                className="object-cover"
                data-ai-hint={post.aiHint ?? ''}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
           {postDate && (
             <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <ClockIcon className="h-4 w-4" />
                    <span>{format(postDate, 'h:mm a')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{format(postDate, 'MMM d, yyyy')}</span>
                </div>
             </div>
           )}
        </CardContent>
        <Separator />
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
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleBookmark} disabled={isTogglingBookmark || !user}>
                        <Bookmark className={`h-5 w-5 ${isBookmarked ? 'text-yellow-500 fill-current' : ''}`} />
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
      
      <Separator />

      {/* Comments Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Replies ({post.commentCount || 0})</h2>
        <CommentSection docId={post.id} collectionType="posts" docAuthorId={post.authorId} />
      </div>
    </div>
  );
}
