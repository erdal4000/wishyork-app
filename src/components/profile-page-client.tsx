'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, DocumentData, onSnapshot, getCountFromServer } from 'firebase/firestore';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MapPin, UserPlus, Edit, Package, Globe, Users, Lock, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';


// Data types
interface UserProfile extends DocumentData {
  uid: string;
  name: string;
  username: string;
  email: string;
  photoURL?: string;
  bio?: string;
}

interface Post extends DocumentData {
  id: string;
  content: string;
  imageUrl: string | null;
  aiHint: string | null;
}

interface Wishlist extends DocumentData {
  id: string;
  title: string;
  imageUrl: string;
  aiHint: string;
  category: string;
  progress: number;
  itemCount: number;
  privacy: 'public' | 'private' | 'friends';
  likes?: number;
}


function ProfilePageSkeleton() {
    return (
         <div className="space-y-6">
            <Card className="overflow-hidden">
                <Skeleton className="h-48 w-full md:h-64" />
                <CardContent className="p-4 sm:p-6">
                    <div className="relative flex flex-col items-center gap-4 sm:flex-row">
                        <div className="-mt-16 flex-shrink-0 sm:-mt-24">
                           <Skeleton className="h-24 w-24 rounded-full border-4 border-card sm:h-32 sm:w-32" />
                        </div>
                        <div className="flex-1 space-y-2 text-center sm:text-left">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-full max-w-lg" />
                        </div>
                         <div className="mt-2 flex-shrink-0 sm:mt-0">
                             <Skeleton className="h-10 w-32" />
                         </div>
                    </div>
                </CardContent>
            </Card>
             <Tabs defaultValue="wishlists" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="wishlists">Wishlists</TabsTrigger>
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                    <TabsTrigger value="favorites">Favorites</TabsTrigger>
                </TabsList>
            </Tabs>
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
            </div>
        </div>
    )
}


export function ProfilePageClient() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const params = useParams();
  const username = params?.username as string;

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFound, setUserFound] = useState(true);

  useEffect(() => {
    if (!username || authLoading) {
      if (!authLoading) setLoading(false);
      return;
    }

    setLoading(true);
    
    const fetchUserProfile = async () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()), limit(1));
      
      try {
        const userSnapshot = await getDocs(q);

        if (userSnapshot.empty) {
          setUserFound(false);
          setLoading(false);
          return;
        }

        const userDoc = userSnapshot.docs[0];
        const userData = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
        setProfileUser(userData);

        const isOwnProfile = currentUser?.uid === userData.uid;
        let initialWishlistsLoaded = false;
        let initialPostsLoaded = false;

        const turnOffLoading = () => {
            if (initialWishlistsLoaded && initialPostsLoaded) {
                setLoading(false);
            }
        }

        // Wishlist listener
        const wishlistsQuery = isOwnProfile
          ? query(collection(db, 'wishlists'), where('authorId', '==', userData.uid), orderBy('createdAt', 'desc'))
          : query(collection(db, 'wishlists'), where('authorId', '==', userData.uid), where('privacy', '==', 'public'), orderBy('createdAt', 'desc'));
          
        const unsubscribeWishlists = onSnapshot(wishlistsQuery, async (snapshot) => {
            const listsPromises = snapshot.docs.map(async (doc) => {
                const listData = { id: doc.id, ...doc.data() } as Wishlist;
                const itemsColRef = collection(db, 'wishlists', doc.id, 'items');
                const itemsSnapshot = await getCountFromServer(itemsColRef);
                listData.itemCount = itemsSnapshot.data().count;
                return listData;
            });
            const lists = await Promise.all(listsPromises);
            setWishlists(lists);
            initialWishlistsLoaded = true;
            turnOffLoading();
        });

        // Posts listener
        const postsQuery = query(collection(db, 'posts'), where('authorId', '==', userData.uid), orderBy('createdAt', 'desc'));
        const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
            setPosts(postsData);
            initialPostsLoaded = true;
            turnOffLoading();
        });

        return () => {
            unsubscribeWishlists();
            unsubscribePosts();
        };

      } catch (error) {
        console.error("Error fetching profile data:", error);
        setUserFound(false);
        setLoading(false);
      }
    };

    const cleanupPromise = fetchUserProfile();

    return () => {
        cleanupPromise.then(cleanup => cleanup && cleanup());
    };

  }, [username, authLoading, currentUser]);
  
  if (loading) {
    return <ProfilePageSkeleton />;
  }
  
  if (!userFound || !profileUser) {
    return notFound();
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };
  
  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'friends': return <Users className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPrivacyLabel = (privacy: string) => {
      if (!privacy) return 'Public';
      return privacy.charAt(0).toUpperCase() + privacy.slice(1);
  }

  const isOwnProfile = currentUser?.uid === profileUser?.uid;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative h-48 w-full bg-secondary md:h-64">
          <Image
            src={`https://picsum.photos/seed/${profileUser.uid}/1200/400`}
            alt="Cover image"
            data-ai-hint="abstract landscape"
            fill
            className="object-cover"
            priority
          />
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="relative flex flex-col items-center gap-4 sm:flex-row">
            <div className="-mt-16 flex-shrink-0 sm:-mt-24">
              <Avatar className="h-24 w-24 border-4 border-card sm:h-32 sm:w-32">
                <AvatarImage
                  src={profileUser.photoURL ?? ''}
                  alt={profileUser.name ?? 'User'}
                />
                <AvatarFallback className="text-3xl">{getInitials(profileUser.name)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold sm:text-3xl">{profileUser.name ?? 'New User'}</h1>
              <p className="text-sm text-muted-foreground">@{profileUser.username}</p>
              <p className="mt-2 max-w-2xl text-sm">
                {profileUser.bio ?? "This user hasn't set a bio yet."}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground sm:justify-start">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Planet Earth</span>
                </div>
              </div>
            </div>
            <div className="mt-2 flex-shrink-0 sm:mt-0">
               {isOwnProfile ? (
                 <Button>
                   <Edit className="mr-2 h-4 w-4" />
                   Edit Profile
                 </Button>
               ) : (
                 <Button>
                   <UserPlus className="mr-2 h-4 w-4" />
                   Follow
                 </Button>
               )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="wishlists" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wishlists">Wishlists ({wishlists.length})</TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <TabsContent value="wishlists" className="mt-6">
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {wishlists.length > 0 ? wishlists.map((list) => (
                    <Link href={`/dashboard/wishlist/${list.id}`} key={list.id}>
                        <Card className="group flex h-full flex-col overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
                           <CardHeader className="relative p-0 h-48">
                               <Badge className="absolute right-3 top-3 z-10">{list.category}</Badge>
                               <Image src={list.imageUrl} alt={list.title} data-ai-hint={list.aiHint} fill className="object-cover" />
                           </CardHeader>
                           <CardContent className="flex flex-1 flex-col p-4">
                                <h3 className="font-headline text-lg font-bold">{list.title}</h3>
                                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        <span>{list.itemCount || 0} items</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {getPrivacyIcon(list.privacy)}
                                        <span>{getPrivacyLabel(list.privacy)}</span>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4">
                                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                        <span>Progress</span>
                                        <span className="font-semibold">{list.progress || 0}%</span>
                                    </div>
                                    <Progress value={list.progress || 0} className="h-2" />
                                </div>
                           </CardContent>
                           <Separator />
                            <div className="flex items-center justify-end p-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5 p-1">
                                    <Heart className="h-4 w-4" />
                                    <span>{list.likes || 0}</span>
                                </div>
                            </div>
                        </Card>
                    </Link>
                )) : (
                     <div className="col-span-1 flex items-center justify-center rounded-lg border-2 border-dashed py-12 text-center sm:col-span-2 xl:col-span-3">
                        <p className="text-muted-foreground">{isOwnProfile ? "You haven't created any wishlists yet." : "This user has no public wishlists yet."}</p>
                    </div>
                )}
            </div>
        </TabsContent>
        <TabsContent value="posts" className="mt-6">
          <div className="space-y-6">
            {posts.length > 0 ? posts.map((post) => (
               <Card key={post.id}>
                <CardHeader>
                    {/* Minimal post header, can be expanded */}
                </CardHeader>
                <CardContent className="p-4">
                  <p className="mb-4 text-sm whitespace-pre-wrap">{post.content}</p>
                  {post.imageUrl && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                      <Image
                        src={post.imageUrl}
                        alt="Post image"
                        fill
                        className="object-cover"
                        data-ai-hint={post.aiHint ?? ''}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )) : (
                 <div className="flex items-center justify-center p-8 text-center text-muted-foreground rounded-lg border-2 border-dashed">
                    <p>{isOwnProfile ? "You haven't made any posts yet." : "This user hasn't made any posts yet."}</p>
                </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="favorites" className="mt-6">
           <div className="flex items-center justify-center p-8 text-center text-muted-foreground rounded-lg border-2 border-dashed">
              <p>Favorites feature coming soon!</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
