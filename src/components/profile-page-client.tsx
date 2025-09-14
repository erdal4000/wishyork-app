
'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  DocumentData,
  onSnapshot,
  getCountFromServer,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useFollow } from '@/hooks/use-follow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus,
  Edit,
  Package,
  Globe,
  Users,
  Lock,
  Heart,
  Search,
  MoreHorizontal,
  MessageCircle,
  Bookmark,
  Trash2,
  Repeat2,
  Share2,
  UserCheck,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditWishlistDialog } from './edit-wishlist-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

// Data types
interface UserProfile extends DocumentData {
  uid: string;
  name: string;
  username: string;
  photoURL?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
}

interface Post extends DocumentData {
  id: string;
  content: string;
  imageUrl: string | null;
  aiHint: string | null;
  createdAt: any;
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
  likes: number;
  comments: number;
  saves: number;
  createdAt: any;
  unitsFulfilled: number;
  totalUnits: number;
}


// The Client Component now receives the initial user data as a prop.
export function ProfilePageClient({
  initialProfileUser,
}: {
  initialProfileUser: UserProfile;
}) {
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<UserProfile>(initialProfileUser);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [editingWishlist, setEditingWishlist] = useState<Wishlist | null>(null);
  const { toast } = useToast();

  const { isFollowing, isTogglingFollow, toggleFollow } = useFollow(profileUser?.uid);


  // This useEffect is now only for fetching secondary data like wishlists and posts.
  // The main profile data is already available.
  useEffect(() => {
    if (!profileUser) return;

    setLoadingExtras(true);
    
    // --- User Profile Live Updates ---
    const userDocRef = doc(db, "users", profileUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
        if(doc.exists()){
            const data = doc.data();
            setProfileUser(prev => ({
                ...prev,
                name: data.name,
                username: data.username,
                bio: data.bio,
                followersCount: data.followersCount || 0,
                followingCount: data.followingCount || 0,
            }));
        }
    });

    // --- Wishlists Fetching ---
    const wishlistsQuery = query(
      collection(db, 'wishlists'),
      where('authorId', '==', profileUser.uid)
    );
    const unsubscribeWishlists = onSnapshot(
      wishlistsQuery,
      async (snapshot) => {
        const listsPromises = snapshot.docs.map(async (doc) => {
          const listData = { id: doc.id, ...doc.data() } as Wishlist;
          const itemsColRef = collection(db, 'wishlists', doc.id, 'items');
          const itemsSnapshot = await getCountFromServer(itemsColRef);
          listData.itemCount = itemsSnapshot.data().count;
          return listData;
        });
        const lists = await Promise.all(listsPromises);
        setWishlists(
          lists.sort(
            (a, b) =>
              (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
          )
        );
      }
    );

    // --- Posts Fetching ---
    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', profileUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Post)
      );
      setPosts(postsData);
      setLoadingExtras(false);
    });

    // Cleanup function
    return () => {
      unsubscribeUser();
      unsubscribeWishlists();
      unsubscribePosts();
    };
  }, [profileUser.uid]); // This effect now ONLY re-runs if the profile user's ID changes.


  if (!profileUser) {
    // This should theoretically not be reached if page.tsx works correctly
    return notFound();
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('');
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
  };

  const handleDeleteWishlist = async (wishlistId: string) => {
    try {
      await deleteDoc(doc(db, 'wishlists', wishlistId));
      toast({ title: 'Success', description: 'Wishlist has been deleted.' });
    } catch (error) {
      console.error('Error deleting wishlist: ', error);
      toast({
        title: 'Error',
        description: 'Could not delete the wishlist. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isOwnProfile = currentUser?.uid === profileUser.uid;

  const profilePhoto = profileUser.photoURL || `https://picsum.photos/seed/${profileUser.uid}/200/200`;

  const FollowButton = () => {
    if (isTogglingFollow) {
      return <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</Button>;
    }
    if (isFollowing) {
      return <Button variant="outline" onClick={toggleFollow}><UserCheck className="mr-2 h-4 w-4" /> Following</Button>;
    }
    return <Button onClick={toggleFollow}><UserPlus className="mr-2 h-4 w-4" /> Follow</Button>;
  };
  
  const visibleWishlists = wishlists.filter(list => {
      if (isOwnProfile) return true;
      if (list.privacy === 'public') return true;
      // TODO: Add 'friends' logic here if needed
      return false;
  });

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
                <AvatarImage src={profilePhoto} alt={profileUser.name ?? 'User'} />
                <AvatarFallback className="text-3xl">{getInitials(profileUser.name)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold sm:text-3xl">{profileUser.name ?? 'New User'}</h1>
              <p className="text-sm text-muted-foreground">@{profileUser.username}</p>
               <div className="mt-2 flex justify-center sm:justify-start gap-4 text-sm">
                    <p><span className="font-bold">{profileUser.followersCount || 0}</span> Followers</p>
                    <p><span className="font-bold">{profileUser.followingCount || 0}</span> Following</p>
                </div>
              <p className="mt-2 max-w-2xl text-sm">{profileUser.bio || "This user hasn't set a bio yet."}</p>
            </div>
            <div className="mt-2 flex-shrink-0 sm:mt-0">
              {isOwnProfile ? (
                <Button asChild><Link href="/dashboard/settings"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Link></Button>
              ) : (
                currentUser && <FollowButton />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="wishlists" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wishlists">Wishlists ({visibleWishlists.length})</TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <div className="relative my-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search in this profile..." className="pl-10" />
        </div>
        
        {loadingExtras ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}
            </div>
        ) : (
            <>
                <TabsContent value="wishlists" className="mt-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {visibleWishlists.length > 0 ? (
                    visibleWishlists.map((list) => (
                        <div key={list.id} className="group relative block">
                        <Link href={`/dashboard/wishlist/${list.id}`}>
                            <Card className="w-full overflow-hidden rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-xl">
                            <CardHeader className="relative h-48 w-full p-0">
                                <Image
                                src={list.imageUrl}
                                alt={list.title}
                                data-ai-hint={list.aiHint}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />
                                <Badge variant="secondary" className="absolute left-3 top-3 z-10">{list.category}</Badge>
                            </CardHeader>
                            <CardContent className="p-4">
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
                                <div className="mt-4">
                                <div className="mb-1 flex justify-between text-sm text-muted-foreground">
                                    <span>{list.progress || 0}% complete</span>
                                </div>
                                <Progress value={list.progress || 0} className="h-2" />
                                </div>
                            </CardContent>
                            <Separator />
                            <div className="flex justify-between p-2 text-sm text-muted-foreground">
                                <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="px-2">
                                    <Heart className="mr-1.5 h-4 w-4" />
                                    <span className="font-medium">{list.likes || 0}</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="px-2">
                                    <MessageCircle className="mr-1.5 h-4 w-4" />
                                    <span className="font-medium">{list.comments || 0}</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="px-2">
                                    <Bookmark className="mr-1.5 h-4 w-4" />
                                    <span className="font-medium">{list.saves || 0}</span>
                                </Button>
                                </div>
                                <Button variant="ghost" size="sm" onClick={(e) => e.preventDefault()}><Repeat2 className="mr-1.5 h-4 w-4" /> Repost</Button>
                            </div>
                            </Card>
                        </Link>
                        {isOwnProfile && (<div className="absolute right-3 top-3 z-20">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => e.preventDefault()}><MoreHorizontal className="h-5 w-5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
                                <DropdownMenuItem onSelect={() => {}}><Share2 className="mr-2 h-4 w-4" /> Share</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setEditingWishlist(list)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This action cannot be undone. This will permanently delete this wishlist.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteWishlist(list.id)} className="bg-destructive hover:bg-destructive/90">Yes, delete wishlist</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>)}
                        </div>
                    ))
                    ) : (
                    <div className="col-span-1 flex items-center justify-center rounded-lg border-2 border-dashed py-12 text-center sm:col-span-2">
                        <p className="text-muted-foreground">{isOwnProfile ? "You haven't created any wishlists yet." : 'This user has no public wishlists yet.'}</p>
                    </div>
                    )}
                </div>
                </TabsContent>
                <TabsContent value="posts" className="mt-6">
                <div className="space-y-6">
                    {posts.length > 0 ? (
                    posts.map((post) => (
                        <Card key={post.id}>
                        <CardContent className="p-4">
                            <p className="mb-4 whitespace-pre-wrap text-sm">{post.content}</p>
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
                    ))
                    ) : (
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
                        <p>{isOwnProfile ? "You haven't made any posts yet." : "This user hasn't made any posts yet."}</p>
                    </div>
                    )}
                </div>
                </TabsContent>
                <TabsContent value="favorites" className="mt-6">
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
                    <p>Favorites feature coming soon!</p>
                </div>
                </TabsContent>
            </>
        )}

      </Tabs>
      {editingWishlist && (
        <EditWishlistDialog
          wishlist={editingWishlist}
          open={!!editingWishlist}
          onOpenChange={(isOpen) => !isOpen && setEditingWishlist(null)}
          onSuccess={() => setEditingWishlist(null)}
        />
      )}
    </div>
  );
}
