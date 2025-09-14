
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
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2, Bookmark, Repeat2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, Suspense } from 'react';
import { Timestamp } from "firebase-admin/firestore";
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cookies } from 'next/headers';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

// --- Data Types ---
interface Post {
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


// --- Server-Side Data Fetching ---

async function getUserIdFromServer(): Promise<string | null> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;

  try {
    const adminApp = await getAdminApp();
    const adminAuth = getAuth(adminApp);
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedToken.uid;
  } catch (error) {
    console.error("Session cookie verification failed:", error);
    return null;
  }
}

async function getFeedData(userId: string) {
    const adminDb = getFirestore(await getAdminApp());

    // 1. Get the user's own posts
    const myPostsQuery = adminDb.collection('posts')
        .where('authorId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(10);

    // 2. Get the list of people the user follows
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const following = userDoc.data()?.following || [];
    
    let followedPosts: Post[] = [];

    // 3. CRITICAL CHECK: Only query for followed posts if the user follows someone
    if (following.length > 0) {
        const followedPostsQuery = adminDb.collectionGroup('posts')
            .where('authorId', 'in', following)
            .orderBy('createdAt', 'desc')
            .limit(20);
        const followedPostsSnapshot = await followedPostsQuery.get();
        followedPosts = followedPostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Post);
    } else {
        console.log("User does not follow anyone. Skipping followed posts query.");
    }

    const myPostsSnapshot = await myPostsQuery.get();
    const myPosts = myPostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Post);

    // 4. Combine and sort the results
    const allItems = [...myPosts, ...followedPosts];
    const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());
    
    // Sort all items by creation date
    uniqueItems.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));

    return uniqueItems;
}


// --- Client Components ---

function PostCard({ item }: { item: Post }) {
  // This is a simplified version that can be rendered on the server.
  // For client-side interactions like 'like', we would need to make this a client component.
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
        {/* Interaction buttons are placeholders in this server component version */}
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

        const newPost = {
            content: postContent,
            authorId: userId,
            authorName: userData?.name || user.displayName,
            authorUsername: userData?.username || user.email?.split('@')[0],
            authorAvatar: userData?.photoURL || user.photoURL,
            createdAt: Timestamp.now(),
            imageUrl: null,
            aiHint: null,
            likes: 0,
            likedBy: [],
            commentCount: 0,
            type: 'post'
        };

        await adminDb.collection("posts").add(newPost);
        revalidatePath('/dashboard'); // This tells Next.js to refresh the data on this page

    } catch (error) {
        console.error("Error creating post: ", error);
        // Here you could rethrow the error to be caught by an error boundary
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
    // This case should be handled by the layout, but as a fallback:
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <h3 className="text-lg font-semibold">Authentication Error</h3>
        <p className="mt-2">Could not verify user session. Please try logging in again.</p>
      </Card>
    );
  }
  
  // We need some user info for the create post form.
  const adminApp = await getAdminApp();
  const adminAuth = getAuth(adminApp);
  const userRecord = await adminAuth.getUser(userId);
  const userForForm = {
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      email: userRecord.email,
  }

  const feedItems = await getFeedData(userId);

  return (
    <div className="space-y-6">
      <CreatePostForm userId={userId} user={userForForm} />

      {/* Feed Items */}
      <Suspense fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        {feedItems.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <h3 className="text-lg font-semibold">Your feed is looking empty!</h3>
            <p className="mt-2">Follow some people or create your first post to see content here.</p>
            <p className="mt-4 text-xs italic">If you have recently followed someone or created a post, please allow a few minutes for the database index to build.</p>
          </Card>
        ) : (
          feedItems.map((item) => (
             <PostCard key={`post-${item.id}`} item={item as Post} />
          ))
        )}
      </Suspense>
    </div>
  );
}
