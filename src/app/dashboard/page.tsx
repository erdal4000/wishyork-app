
'use server';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2, Bookmark, Repeat2, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { Timestamp, DocumentData } from "firebase-admin/firestore";
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cookies } from 'next/headers';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// --- Data Types ---
interface Post {
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
  commentCount: number;
}

interface Wishlist {
  id: string;
  type: 'wishlist';
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  title: string;
  description?: string;
  category: string;
  imageUrl: string;
  aiHint: string;
  createdAt: Timestamp;
  progress: number;
  itemCount: number;
  likes: number;
  commentCount: number;
  privacy: 'public' | 'private' | 'friends';
}

type FeedItem = Post | Wishlist;

// --- Server-Side Data Fetching ---
async function getUserIdFromServer(): Promise<string | null> {
  const sessionCookieValue = cookies().get('session')?.value;
  if (!sessionCookieValue) {
    // This is not an error, it just means the user is not logged in.
    return null;
  }
  
  try {
    const adminApp = await getAdminApp();
    const adminAuth = getAuth(adminApp);
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookieValue, true);
    return decodedToken.uid;
  } catch (error) {
    // This can happen if the cookie is expired or invalid.
    // We log it for debugging but treat it as "not logged in".
    console.error('❌ SUNUCU TARAFI KİMLİK DOĞRULAMA HATASI:', error);
    return null;
  }
}

async function getFeedPosts(following: string[]): Promise<Post[]> {
  if (following.length === 0) {
    return [];
  }
  const adminDb = getFirestore(await getAdminApp());
  const postsQuery = adminDb
    .collectionGroup('posts')
    .where('authorId', 'in', following)
    .orderBy('createdAt', 'desc')
    .limit(20);

  const querySnapshot = await postsQuery.get();
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'post' }) as Post);
}

async function getFeedWishlists(following: string[]): Promise<Wishlist[]> {
    if (following.length === 0) {
      return [];
    }
    const adminDb = getFirestore(await getAdminApp());
    const wishlistsQuery = adminDb
      .collectionGroup('wishlists')
      .where('authorId', 'in', following)
      .where('privacy', '==', 'public')
      .orderBy('createdAt', 'desc')
      .limit(20);
  
    const querySnapshot = await wishlistsQuery.get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'wishlist' }) as Wishlist);
}


// --- Client Components ---

function PostCard({ item }: { item: Post }) {
  const authorPhoto = item.authorAvatar || `https://picsum.photos/seed/${item.authorId}/200/200`;

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
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><MessageCircle className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Reply</p></TooltipContent></Tooltip>
                <span className="text-sm pr-2">{item.commentCount ?? 0}</span>

                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><Repeat2 className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Repost</p></TooltipContent></Tooltip>
                
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><Heart className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Like</p></TooltipContent></Tooltip>
                <span className="text-sm pr-2">{item.likes ?? 0}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><Bookmark className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Bookmark</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><Share2 className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Share</p></TooltipContent></Tooltip>
            </div>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}

function WishlistCard({ item }: { item: Wishlist }) {
  const authorPhoto = item.authorAvatar || `https://picsum.photos/seed/${item.authorId}/200/200`;
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
            created a new wishlist · <Link href={`/dashboard/profile/${item.authorUsername}`}>@{item.authorUsername}</Link>{' '}
            · {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'just now'}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
       <Link href={`/dashboard/wishlist/${item.id}`} className="block hover:bg-muted/20 transition-colors">
         <CardContent className="space-y-4 px-4 pb-2">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                 <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    data-ai-hint={item.aiHint ?? ''}
                    sizes="(max-width: 768px) 100vw, 50vw"
                />
            </div>
            <div className="pt-2">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <Badge variant="secondary">{item.category}</Badge>
                </div>
                 <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>{item.itemCount || 0} items</span>
                      </div>
                      <span>{item.progress || 0}% complete</span>
                  </div>
                  <Progress value={item.progress || 0} className="h-2" />
                </div>
            </div>
         </CardContent>
       </Link>
        <CardFooter className="flex justify-between p-2">
            <TooltipProvider>
                <div className="flex items-center text-muted-foreground">
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><MessageCircle className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Reply</p></TooltipContent></Tooltip>
                    <span className="text-sm pr-2">{item.commentCount ?? 0}</span>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><Repeat2 className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Repost</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><Heart className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Like</p></TooltipContent></Tooltip>
                    <span className="text-sm pr-2">{item.likes ?? 0}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><Bookmark className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Bookmark</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><Share2 className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Share</p></TooltipContent></Tooltip>
                </div>
            </TooltipProvider>
        </CardFooter>
    </Card>
  )
}

async function CreatePostForm({ userId, user }: { userId: string, user: { displayName?: string | null, photoURL?: string | null, email?: string | null } }) {
  
  async function handleCreatePost(formData: FormData) {
    'use server';
    
    const postContent = formData.get('postContent') as string;

    if (!postContent?.trim() || !userId) return;

    try {
        const adminDb = getFirestore(await getAdminApp());
        const userDocRef = adminDb.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        const userData = userDoc.data();

        const newPost: Omit<Post, 'id' | 'type'> = {
            content: postContent,
            authorId: userId,
            authorName: userData?.name || user.displayName || 'Anonymous',
            authorUsername: userData?.username || user.email?.split('@')[0] || 'user',
            authorAvatar: userData?.photoURL || user.photoURL || '',
            createdAt: Timestamp.now(),
            imageUrl: null,
            aiHint: null,
            likes: 0,
            commentCount: 0,
        };

        await adminDb.collection("posts").add(newPost);
        revalidatePath('/dashboard');

    } catch (error) {
        console.error("Error creating post: ", error);
    }
  }
  
  const currentUserPhoto = user?.photoURL || (userId ? `https://picsum.photos/seed/${userId}/200/200` : '');

  return (
    <Card>
      <form action={handleCreatePost}>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
          <Avatar>
            <AvatarImage src={currentUserPhoto} alt={user?.displayName ?? 'User'} />
            <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
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
      </form>
    </Card>
  );
}


// --- Main Page Component ---
export default async function DashboardPage() {
  const userId = await getUserIdFromServer();

  if (!userId) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <h3 className="text-lg font-semibold">Authentication Error</h3>
        <p className="mt-2">Could not verify user session. Please try logging in again.</p>
      </Card>
    );
  }
  
  const adminDb = getFirestore(await getAdminApp());
  const adminAuth = getAuth(await getAdminApp());

  const userDoc = await adminDb.collection('users').doc(userId).get();
  const userRecord = await adminAuth.getUser(userId);

  const following = userDoc.data()?.following || [];

  const [feedPosts, feedWishlists] = await Promise.all([
    getFeedPosts([userId, ...following]),
    getFeedWishlists([userId, ...following]),
  ]);

  const allItems = [...feedPosts, ...feedWishlists];
  const uniqueItems = Array.from(new Map(allItems.map(item => [`${item.type}-${item.id}`, item])).values());
  const sortedFeed = uniqueItems.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  
  const userForForm = {
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      email: userRecord.email,
  }

  return (
    <div className="space-y-6">
      <CreatePostForm userId={userId} user={userForForm} />

      <Suspense fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        {sortedFeed.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <h3 className="text-lg font-semibold">Your feed is looking empty!</h3>
            <p className="mt-2">Follow some people or create your first post to see content here.</p>
             <p className="mt-4 text-xs italic">If you have recently created a post, please allow a few minutes for the database index to build.</p>
          </Card>
        ) : (
          sortedFeed.map((item) => {
             if (item.type === 'post') {
                return <PostCard key={`post-${item.id}`} item={item as Post} />;
             }
             if (item.type === 'wishlist') {
                return <WishlistCard key={`wishlist-${item.id}`} item={item as Wishlist} />;
             }
             return null;
          })
        )}
      </Suspense>
    </div>
  );
}
