
'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2, Package, Repeat2, Bookmark } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { FormEvent, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, DocumentData, getDoc, doc, where, Timestamp, getDocs } from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns';
import { usePostInteraction } from '@/hooks/use-post-interaction';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


// --- Data Types ---

interface Post extends DocumentData {
  id: string;
  type: 'post';
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  imageUrl: string | null;
  aiHint: string | null;
  createdAt: Timestamp;
  likes: number;
  likedBy: string[];
  commentCount: number;
}

interface Wishlist extends DocumentData {
  id: string;
  type: 'wishlist';
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  title: string;
  imageUrl: string;
  aiHint: string;
  category: string;
  progress: number;
  itemCount: number;
  createdAt: Timestamp;
  likes: number;
  commentCount: number;
}

type FeedItem = Post | Wishlist;


// --- Card Components ---

function PostCard({ item }: { item: Post }) {
  const { user } = useAuth();
  const { hasLiked, isLiking, toggleLike } = usePostInteraction(item.id);
  
  const authorPhoto = item.authorAvatar || `https://picsum.photos/seed/${item.authorId}/200/200`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={authorPhoto} alt={item.authorName} />
          <AvatarFallback>
            {getInitials(item.authorName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-bold">{item.authorName}</p>
          <p className="text-sm text-muted-foreground">
            <Link href={`/dashboard/profile/${item.authorUsername}`}>@{item.authorUsername}</Link>{' '}
            · {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'just now'}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      <Link href={`/dashboard/post/${item.id}`} className="block hover:bg-muted/20 transition-colors">
        <CardContent className="space-y-4 px-4 pb-2">
          <p className="whitespace-pre-wrap">{item.content}</p>
          {item.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <Image
                src={item.imageUrl}
                alt={`Post by ${item.authorName}`}
                fill
                className="object-cover"
                data-ai-hint={item.aiHint ?? ''}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
        </CardContent>
      </Link>
      <CardFooter className="flex justify-between p-2">
        <TooltipProvider>
          <div className="flex items-center text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                    <Link href={`/dashboard/post/${item.id}`}>
                        <MessageCircle className="h-5 w-5" />
                    </Link>
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


function WishlistCard({ item }: { item: Wishlist }) {
  const authorPhoto = item.authorAvatar || `https://picsum.photos/seed/${item.authorId}/200/200`;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Avatar>
                    <AvatarImage src={authorPhoto} alt={item.authorName} />
                    <AvatarFallback>{getInitials(item.authorName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p>
                        <Link href={`/dashboard/profile/${item.authorUsername}`} className="font-bold hover:underline">{item.authorName}</Link>
                        <span className="text-muted-foreground"> created a new wishlist</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                    </p>
                </div>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Link href={`/dashboard/wishlist/${item.id}`} className="block hover:bg-muted/30 transition-colors">
                    <div className="relative h-48 w-full">
                        <Image
                            src={item.imageUrl}
                            alt={item.title}
                            data-ai-hint={item.aiHint}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                    <div className="p-4">
                        <Badge variant="secondary" className="mb-2">{item.category}</Badge>
                        <h3 className="font-bold text-lg">{item.title}</h3>
                        <div className="mt-2 flex items-center text-sm text-muted-foreground">
                            <Package className="mr-2 h-4 w-4" />
                            <span>{item.itemCount || 0} items</span>
                        </div>
                        <div className="mt-3">
                            <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                <span>{item.progress || 0}% complete</span>
                            </div>
                            <Progress value={item.progress || 0} className="h-2" />
                        </div>
                    </div>
                </Link>
            </CardContent>
            <CardFooter className="flex justify-between p-2">
                <TooltipProvider>
                    <div className="flex items-center text-muted-foreground">
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                                <Link href={`/dashboard/wishlist/${item.id}`}>
                                    <MessageCircle className="h-5 w-5" />
                                </Link>
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
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Heart className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs"><p>Like</p></TooltipContent>
                        </Tooltip>
                        <span className="text-sm pr-2">{item.likes ?? 0}</span>
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
    )
}

// --- Main Page Component ---

export default function DashboardPage() {
  const { user } = useAuth();
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  
  useEffect(() => {
    if (!user) {
      setLoadingFeed(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    // Use onSnapshot to get real-time updates on who the user is following
    const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
      const userData = userDoc.data();
      const following = userData?.following || [];
      // Create a list of authors to fetch content from: the user themselves + who they follow
      const authorsToFetch = [user.uid, ...following];

      // Firestore 'in' queries are limited to 30 elements in the array.
      // If a user follows more than 29 people, we'll need to paginate or use multiple queries.
      // For this app, we'll assume a user follows fewer than 29 people.
      if (authorsToFetch.length > 0) {
        fetchFeed(authorsToFetch);
      } else {
        setFeedItems([]);
        setLoadingFeed(false);
      }
    }, (error) => {
      console.error("Error fetching user's following list:", error);
      setLoadingFeed(false);
    });

    const fetchFeed = async (authorIds: string[]) => {
      setLoadingFeed(true);
      try {
        const postsQuery = query(
          collection(db, "posts"),
          where("authorId", "in", authorIds),
          orderBy("createdAt", "desc")
        );
    
        const wishlistsQuery = query(
          collection(db, "wishlists"),
          where("authorId", "in", authorIds),
          where("privacy", "==", "public"),
          orderBy("createdAt", "desc")
        );
        
        // Fetch both posts and wishlists concurrently
        const [postsSnapshot, wishlistsSnapshot] = await Promise.all([
          getDocs(postsQuery),
          getDocs(wishlistsQuery),
        ]);

        const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, type: 'post', ...doc.data() } as Post));
        const wishlistsData = wishlistsSnapshot.docs.map(doc => ({ id: doc.id, type: 'wishlist', ...doc.data() } as Wishlist));

        // Combine and sort the results client-side
        const combined = [...postsData, ...wishlistsData];
        combined.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
        
        setFeedItems(combined);
      } catch (error) {
        console.error("Error fetching feed:", error);
        // This error often indicates a missing Firestore index. 
        // The console error message from Firestore will include a link to create it.
        setFeedItems([]);
      } finally {
        setLoadingFeed(false);
      }
    };
  
    // Cleanup the listener when the component unmounts or user changes
    return () => unsubscribe();
  
  }, [user]);


  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      await addDoc(collection(db, "posts"), {
        content: postContent,
        authorId: user.uid,
        authorName: userData?.name || user.displayName,
        authorUsername: userData?.username || user.email?.split('@')[0],
        authorAvatar: userData?.photoURL || user.photoURL,
        createdAt: serverTimestamp(),
        imageUrl: null,
        aiHint: null,
        likes: 0,
        likedBy: [],
        commentCount: 0,
        type: 'post'
      });
      setPostContent('');
    } catch (error) {
      console.error("Error creating post: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const currentUserPhoto = user?.photoURL || (user ? `https://picsum.photos/seed/${user.uid}/200/200` : '');

  return (
    <div className="space-y-6">
      {/* Create Post Card */}
      <Card>
        <form onSubmit={handleCreatePost}>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
          <Avatar>
            <AvatarImage
              src={currentUserPhoto}
              alt={user?.displayName ?? 'User'}
            />
            <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
          </Avatar>
          <div className="w-full">
            <Textarea
              placeholder="What's on your mind? Share a wish or a success story!"
              className="border-0 bg-secondary/50 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={3}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              disabled={isSubmitting || !user}
            />
          </div>
        </CardHeader>
        <CardFooter className="flex justify-end p-4 pt-0">
          <Button type="submit" disabled={isSubmitting || !postContent.trim() || !user}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post
          </Button>
        </CardFooter>
        </form>
      </Card>

      {/* Feed Items */}
      {loadingFeed ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : feedItems.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <h3 className="text-lg font-semibold">Your feed is looking empty!</h3>
          <p className="mt-2">Follow some people or create your first post to see content here.</p>
           <p className="mt-4 text-xs italic">If you have recently created a post, please allow a few minutes for the database index to build.</p>
        </Card>
      ) : (
        feedItems.map((item) => {
            if (item.type === 'post') {
                return <PostCard key={`post-${item.id}`} item={item as Post} />;
            }
            if (item.type === 'wishlist') {
                return <WishlistCard key={`wishlist-${item.id}`} item={item as Wishlist} />;
            }
            return null;
        })
      )}
    </div>
  );
}
