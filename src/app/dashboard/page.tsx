
'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, DocumentData, Timestamp, doc, getDoc, collectionGroup, where } from 'firebase/firestore';
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
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2, Bookmark, Repeat2, Package, AlertTriangle, Globe, Users, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { usePostInteraction } from '@/hooks/use-post-interaction';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface FeedItem extends DocumentData {
  id: string;
  type: 'post' | 'wishlist';
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  createdAt: Timestamp;
  // Post specific
  content?: string;
  // Wishlist specific
  title?: string;
  category?: string;
  privacy?: 'public' | 'private' | 'friends';
  progress?: number;
  itemCount?: number;
  // Common
  imageUrl: string | null;
  aiHint: string | null;
  likes: number;
  commentCount: number;
}

function FeedCardSkeleton() {
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

const getPrivacyIcon = (privacy?: string) => {
    switch (privacy) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'friends': return <Users className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
      default: return null;
    }
};
  
const getPrivacyLabel = (privacy?: string) => {
    if (!privacy) return 'Public';
    return privacy.charAt(0).toUpperCase() + privacy.slice(1);
}

function PostCard({ item }: { item: FeedItem }) {
  const { user } = useAuth();
  // Assuming usePostInteraction can work with any document that has likes, etc.
  const { hasLiked, isLiking, toggleLike } = usePostInteraction(item.id);

  const authorPhoto = item.authorAvatar || `https://picsum.photos/seed/${item.authorId}/200/200`;
  const itemDate = item.createdAt?.toDate();
  const timeAgo = itemDate ? formatDistanceToNow(itemDate, { addSuffix: true }) : 'just now';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={authorPhoto} alt={item.authorName} />
          <AvatarFallback>{getInitials(item.authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-bold">{item.authorName}</p>
          <p className="text-sm text-muted-foreground">
            <Link href={`/dashboard/profile/${item.authorUsername}`}>@{item.authorUsername}</Link> · {timeAgo}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {item.type === 'post' && <p className="whitespace-pre-wrap">{item.content}</p>}
        {item.type === 'wishlist' && (
            <div className='space-y-3'>
                <h3 className="font-bold text-lg">{item.title}</h3>
                 <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="secondary">{item.category}</Badge>
                    <Badge variant="outline" className="capitalize gap-1.5 pl-2 pr-3 py-1.5">
                        {getPrivacyIcon(item.privacy)}
                        <span>{getPrivacyLabel(item.privacy)}</span>
                    </Badge>
                 </div>
                 <div className="pt-2">
                    <div className="mb-1 flex justify-between text-sm text-muted-foreground">
                        <span>{item.progress || 0}% complete</span>
                        <span>{item.itemCount || 0} items</span>
                    </div>
                    <Progress value={item.progress || 0} className="h-2" />
                </div>
            </div>
        )}

        {item.imageUrl && (
          <Link href={item.type === 'post' ? `/dashboard/post/${item.id}` : `/dashboard/wishlist/${item.id}`} className="mt-4 block">
            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl border">
              <Image
                src={item.imageUrl}
                alt={`Image for ${item.type}`}
                fill
                className="object-cover"
                data-ai-hint={item.aiHint ?? ''}
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
            <span className="text-sm pr-2">{item.commentCount ?? 0}</span>

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
            <span className={`text-sm pr-2 ${hasLiked ? 'text-red-500' : ''}`}>{item.likes ?? 0}</span>
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
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchFeed = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        // Include the current user's ID in the list to show their own content
        const following = [...(userData?.following || []), user.uid];

        if (following.length === 0) {
            setLoading(false);
            setFeedItems([]);
            return;
        }

        // CollectionGroup queries for 'in' operator are limited to 30 items in the array.
        // For a real app, this would need pagination or a different data model.
        const followedIds = following.slice(0, 30);

        const postsQuery = query(
            collectionGroup(db, 'posts'), 
            where('authorId', 'in', followedIds),
            orderBy('createdAt', 'desc')
        );

        const wishlistsQuery = query(
            collectionGroup(db, 'wishlists'), 
            where('authorId', 'in', followedIds),
            where('privacy', '==', 'public'), // <-- THIS IS THE CRUCIAL FIX
            orderBy('createdAt', 'desc')
        );

        const unsubscribePosts = onSnapshot(postsQuery, 
            (querySnapshot) => {
                const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, type: 'post', ...doc.data() } as FeedItem));
                
                setFeedItems(currentItems => {
                    const otherItems = currentItems.filter(item => item.type !== 'post');
                    const allItems = [...postsData, ...otherItems];
                    return allItems.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                });

                setLoading(false);
                setError(null);
            }, 
            (err) => {
                console.error("Error fetching posts:", err);
                setError("Failed to load posts. Please try again later.");
                setLoading(false);
            }
        );

        const unsubscribeWishlists = onSnapshot(wishlistsQuery,
             (querySnapshot) => {
                const wishlistsData = querySnapshot.docs.map(doc => ({ id: doc.id, type: 'wishlist', ...doc.data() } as FeedItem));
                
                setFeedItems(currentItems => {
                    const otherItems = currentItems.filter(item => item.type !== 'wishlist');
                    const allItems = [...wishlistsData, ...otherItems];
                    return allItems.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                });

                // Do not set loading to false here, as posts might still be loading
            },
            (err) => {
                console.error("Error fetching wishlists:", err);
                // Don't set a global error, as posts might still load
            }
        );

        return () => {
            unsubscribePosts();
            unsubscribeWishlists();
        };
    }

    fetchFeed();

  }, [user]);

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
          <FeedCardSkeleton />
          <FeedCardSkeleton />
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
          {feedItems.length > 0 ? (
            feedItems.map(item => <PostCard key={`${item.type}-${item.id}`} item={item} />)
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
