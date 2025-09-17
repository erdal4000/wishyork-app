
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, getDoc, DocumentData, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bookmark, Heart, MessageCircle, Repeat2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';
import { usePostInteraction } from '@/hooks/use-post-interaction';
import { useBookmark } from '@/hooks/use-bookmark';

interface BookmarkedItem {
  id: string;
  refId: string;
  type: 'post' | 'cause';
  addedAt: any;
  content?: DocumentData;
  author?: DocumentData;
}

const useAuthorProfile = (authorId?: string) => {
    const [authorProfile, setAuthorProfile] = useState<DocumentData | null>(null);

    useEffect(() => {
        if (!authorId) return;

        const userDocRef = doc(db, 'users', authorId);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setAuthorProfile(docSnap.data());
            } else {
                setAuthorProfile(null);
            }
        });

        return () => unsubscribe();
    }, [authorId]);

    return authorProfile;
};


function BookmarkCard({ bookmark }: { bookmark: BookmarkedItem }) {
    const author = useAuthorProfile(bookmark.content?.authorId);
    const { hasLiked, isLiking, toggleLike } = usePostInteraction(bookmark.refId, bookmark.type === 'cause' ? 'wishlist' : 'post');
    const { isBookmarked, isToggling: isTogglingBookmark, toggleBookmark } = useBookmark({
        refId: bookmark.refId,
        type: bookmark.type,
        title: bookmark.content?.title || bookmark.content?.content,
        imageUrl: bookmark.content?.imageUrl,
        authorName: author?.name,
    });

    if (!bookmark.content) return null;

    if (bookmark.type === 'post') {
        return (
            <Card>
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Avatar>
                  <AvatarImage src={author?.photoURL} alt={author?.name} />
                  <AvatarFallback>{getInitials(author?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold">{author?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    <Link href={`/dashboard/profile/${author?.username}`}>@{author?.username}</Link> 
                    {bookmark.content.createdAt && ` · ${formatDistanceToNow(bookmark.content.createdAt.toDate(), { addSuffix: true })}`}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="whitespace-pre-wrap">{bookmark.content.content}</p>
                {bookmark.content.imageUrl && (
                  <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl border">
                    <Image
                      src={bookmark.content.imageUrl}
                      alt={`Image for post`}
                      fill
                      className="object-cover"
                      data-ai-hint={bookmark.content.aiHint ?? ''}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}
              </CardContent>
               <CardFooter className="flex justify-between p-2">
                    <div className="flex items-center text-muted-foreground">
                        <Button variant="ghost" size="icon"><MessageCircle className="h-5 w-5" /></Button>
                        <span className="text-sm pr-2">{bookmark.content.commentCount ?? 0}</span>
                        <Button variant="ghost" size="icon"><Repeat2 className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={toggleLike} disabled={isLiking}>
                            <Heart className={`h-5 w-5 ${hasLiked ? 'text-red-500 fill-current' : ''}`} />
                        </Button>
                        <span className={`text-sm pr-2 ${hasLiked ? 'text-red-500' : ''}`}>{bookmark.content.likes ?? 0}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={toggleBookmark} disabled={isTogglingBookmark}>
                        <Bookmark className={`h-5 w-5 ${isBookmarked ? 'text-yellow-500 fill-current' : ''}`} />
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    if (bookmark.type === 'cause') {
        return (
            <Card className="group relative flex flex-col overflow-hidden rounded-2xl shadow-lg">
                 <div className="absolute top-3 right-3 z-20">
                    <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full" onClick={(e) => { e.preventDefault(); toggleBookmark(); }} disabled={isTogglingBookmark}>
                        <Bookmark className={`h-5 w-5 ${isBookmarked ? 'text-yellow-500 fill-current' : ''}`} />
                    </Button>
                </div>
                <Link href={`/dashboard/wishlist/${bookmark.refId}`}>
                    <CardHeader className="relative p-0">
                    <Badge className="absolute left-3 top-3 z-10">{bookmark.content.category}</Badge>
                    <Image src={bookmark.content.imageUrl} alt={bookmark.content.title} data-ai-hint={bookmark.content.aiHint} width={400} height={250} className="h-56 w-full object-cover" />
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col p-6">
                    <h3 className="font-headline mb-2 text-xl font-bold">{bookmark.content.title}</h3>
                    <p className="mb-4 text-sm text-muted-foreground">by <Link href={`/dashboard/profile/${author?.username}`} className="font-semibold text-primary">{author?.name}</Link></p>
                    <div className="mb-1 flex justify-between text-sm text-muted-foreground"><span>Progress</span><span className="font-semibold text-foreground">{bookmark.content.progress}%</span></div>
                    <Progress value={bookmark.content.progress} className="h-2" />
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                        <Button asChild className="w-full"><Link href={`/dashboard/wishlist/${bookmark.refId}`}>View Cause <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                    </CardFooter>
                </Link>
            </Card>
        )
    }

    return null;
}

export default function BookmarksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<BookmarkedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const bookmarksRef = collection(db, 'users', user.uid, 'bookmarks');
    const q = query(bookmarksRef, orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const bookmarksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookmarkedItem));

      const populatedBookmarks = await Promise.all(
        bookmarksData.map(async (bookmark) => {
          try {
            const collectionName = bookmark.type === 'cause' 
                ? 'wishlists' 
                : bookmark.type === 'post' 
                ? 'posts' 
                : null;
            
            if (!collectionName || !bookmark.refId) {
                return null;
            }

            const contentRef = doc(db, collectionName, bookmark.refId);
            const contentSnap = await getDoc(contentRef);

            if (contentSnap.exists()) {
              bookmark.content = contentSnap.data();
              return bookmark;
            }
            return null; 
          } catch (e) {
            console.error(`Error fetching content for bookmark ${bookmark.refId}:`, e);
            return null;
          }
        })
      );
      
      setBookmarks(populatedBookmarks.filter((b): b is BookmarkedItem => b !== null && b.content !== undefined));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bookmarks:", error);
      toast({ title: 'Error', description: 'Could not fetch your bookmarks.', variant: 'destructive' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);
  
  const savedPosts = bookmarks.filter(b => b.type === 'post');
  const savedCauses = bookmarks.filter(b => b.type === 'cause');

  const renderSkeleton = (count: number, type: 'post' | 'cause') => {
    if (type === 'post') {
      return [...Array(count)].map((_, i) => (
        <Card key={i}><CardHeader className="flex-row items-center gap-4 p-4"><Skeleton className="h-12 w-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/4" /></div></CardHeader><CardContent className="space-y-2 px-4 pb-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent></Card>
      ));
    }
    if (type === 'cause') {
        return [...Array(count)].map((_, i) => (
            <Card key={i} className="flex flex-col overflow-hidden rounded-2xl"><Skeleton className="h-56 w-full" /><CardContent className="flex-1 flex-col p-6 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-8 w-full" /></CardContent></Card>
        ))
    }
    return null;
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
      <p className="text-muted-foreground">Your saved posts and causes for later.</p>
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">Posts ({savedPosts.length})</TabsTrigger>
          <TabsTrigger value="causes">Causes ({savedCauses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <div className="space-y-6">
            {loading ? renderSkeleton(2, 'post') : savedPosts.length > 0 ? (
              savedPosts.map((bookmark) => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} />
              ))
            ) : (
              <div className="flex items-center justify-center p-8 text-center text-muted-foreground">
                <p>You haven't bookmarked any posts yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="causes" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
            {loading ? renderSkeleton(2, 'cause') : savedCauses.length > 0 ? (
              savedCauses.map((bookmark) => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} />
              ))
            ) : (
              <div className="flex items-center justify-center p-8 text-center text-muted-foreground md:col-span-2 xl:col-span-2">
                <p>You haven't bookmarked any causes yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
