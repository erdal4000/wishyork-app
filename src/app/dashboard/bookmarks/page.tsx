
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, where, getDoc, DocumentData, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trash2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';

// Interfaces for our data
interface BookmarkedItem {
  id: string; // The bookmark document ID
  refId: string; // The ID of the original post, cause, or item
  type: 'post' | 'cause' | 'item';
  addedAt: any;
  content?: DocumentData; // This will hold the fetched data of the original item
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
    const q = query(bookmarksRef, where('type', 'in', ['post', 'cause', 'item']));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const bookmarksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookmarkedItem));

      const populatedBookmarks = await Promise.all(
        bookmarksData.map(async (bookmark) => {
          try {
            const collectionName = bookmark.type === 'cause' ? 'wishlists' : `${bookmark.type}s`;
            const contentRef = doc(db, collectionName, bookmark.refId);
            const contentSnap = await getDoc(contentRef);
            if (contentSnap.exists()) {
              bookmark.content = contentSnap.data();
            }
            return bookmark;
          } catch (e) {
            console.error(`Error fetching content for bookmark ${bookmark.refId}:`, e);
            return bookmark; // Return bookmark even if content fetch fails
          }
        })
      );
      
      const populatedAndAuthorBookmarks = await Promise.all(
         populatedBookmarks.map(async (bookmark) => {
            if(bookmark.content?.authorId) {
                 const authorRef = doc(db, 'users', bookmark.content.authorId);
                 const authorSnap = await getDoc(authorRef);
                 if(authorSnap.exists()) {
                    bookmark.content.author = authorSnap.data();
                 }
            }
            return bookmark;
         })
      );

      setBookmarks(populatedAndAuthorBookmarks);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bookmarks:", error);
      toast({ title: 'Error', description: 'Could not fetch your bookmarks.', variant: 'destructive' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleRemoveBookmark = async (bookmarkId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'bookmarks', bookmarkId));
      toast({ title: 'Removed', description: 'The item has been removed from your bookmarks.' });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      toast({ title: 'Error', description: 'Could not remove the bookmark.', variant: 'destructive' });
    }
  };
  
  const savedPosts = bookmarks.filter(b => b.type === 'post' && b.content);
  const savedCauses = bookmarks.filter(b => b.type === 'cause' && b.content);
  const savedItems = bookmarks.filter(b => b.type === 'item' && b.content);

  const renderSkeleton = (count: number, type: 'post' | 'cause' | 'item') => {
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
     if (type === 'item') {
        return [...Array(count)].map((_, i) => (
            <Card key={i}><div className="aspect-square w-full rounded-t-lg bg-muted"></div><CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-4 w-1/4 mt-1" /></CardContent><CardFooter><Skeleton className="h-9 w-full" /></CardFooter></Card>
        ))
    }
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
      <p className="text-muted-foreground">Your saved posts, causes, and items for later.</p>
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts ({savedPosts.length})</TabsTrigger>
          <TabsTrigger value="causes">Causes ({savedCauses.length})</TabsTrigger>
          <TabsTrigger value="items">Items ({savedItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <div className="space-y-6">
            {loading ? renderSkeleton(2, 'post') : savedPosts.length > 0 ? (
              savedPosts.map(({ id, content }) => (
                <Card key={id}>
                  <CardHeader className="flex flex-row items-center gap-4 p-4">
                    <Avatar>
                      <AvatarImage src={content.author?.photoURL} alt={content.author?.name} />
                      <AvatarFallback>{getInitials(content.author?.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold">{content.author?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        <Link href={`/profile/${content.author?.username}`}>@{content.author?.username}</Link> · {formatDistanceToNow(content.createdAt.toDate(), { addSuffix: true })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveBookmark(id)}>
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="whitespace-pre-wrap">{content.content}</p>
                  </CardContent>
                </Card>
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
              savedCauses.map(({ id, content }) => (
                <Card key={id} className="flex flex-col overflow-hidden rounded-2xl shadow-lg">
                  <CardHeader className="relative p-0">
                    <Badge className="absolute right-3 top-3 z-10">{content.category}</Badge>
                    <Image src={content.imageUrl} alt={content.title} data-ai-hint={content.aiHint} width={400} height={250} className="h-56 w-full object-cover" />
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col p-6">
                    <h3 className="font-headline mb-2 text-xl font-bold">{content.title}</h3>
                    <p className="mb-4 text-sm text-muted-foreground">by <Link href={`/dashboard/profile/${content.author?.username}`} className="font-semibold text-primary">{content.author?.name}</Link></p>
                    <div className="mb-1 flex justify-between text-sm text-muted-foreground"><span>Progress</span><span className="font-semibold text-foreground">{content.progress}%</span></div>
                    <Progress value={content.progress} className="h-2" />
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Button asChild className="w-full"><Link href={`/dashboard/wishlist/${id}`}>View Cause <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="flex items-center justify-center p-8 text-center text-muted-foreground md:col-span-2 xl:col-span-3">
                <p>You haven't bookmarked any causes yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="items" className="mt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
            {loading ? renderSkeleton(3, 'item') : savedItems.length > 0 ? (
              savedItems.map(({ id, content }) => (
                <Card key={id} className="group">
                  <div className="relative aspect-square w-full overflow-hidden rounded-t-lg">
                    <Image src={content.imageUrl} alt={content.name} data-ai-hint={content.aiHint} fill className="object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold leading-tight">{content.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground truncate">{content.description}</p>
                    <p className="mt-2 font-bold">{content.price}</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => handleRemoveBookmark(id)}>Remove</Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
               <div className="flex items-center justify-center p-8 text-center text-muted-foreground sm:col-span-2 md:col-span-3 lg:col-span-4">
                <p>You haven't bookmarked any items yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}

    