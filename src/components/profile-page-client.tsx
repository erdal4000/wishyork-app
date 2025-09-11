'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  DocumentData,
  onSnapshot,
  getCountFromServer,
  deleteDoc,
  doc,
} from 'firebase/firestore';

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
  AlertTriangle,
  MessageCircle,
  Bookmark,
  Trash2,
  Repeat2,
  Share2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
              <Skeleton className="mx-auto h-8 w-48 sm:mx-0" />
              <Skeleton className="mx-auto h-5 w-32 sm:mx-0" />
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
      <div className="relative my-4">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-80 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
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
  const [editingWishlist, setEditingWishlist] = useState<Wishlist | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!username) return;

    const fetchUserProfile = async () => {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('username', '==', username.toLowerCase()),
        limit(1)
      );
      try {
        const userSnapshot = await getDocs(q);

        if (userSnapshot.empty) {
          setUserFound(false);
          setLoading(false);
          return;
        }

        const userDoc = userSnapshot.docs[0];
        const userData = { ...userDoc.data(), uid: userDoc.id } as UserProfile;
        setProfileUser(userData);

        const isOwnProfile = currentUser?.uid === userData.uid;

        // Fetch Wishlists
        const wishlistsQuery = isOwnProfile
          ? query(
              collection(db, 'wishlists'),
              where('authorId', '==', userData.uid)
            )
          : query(
              collection(db, 'wishlists'),
              where('authorId', '==', userData.uid),
              where('privacy', 'in', ['public', 'friends']) // Show public and friends lists
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
                  (b.createdAt?.toMillis() ?? 0) -
                  (a.createdAt?.toMillis() ?? 0)
              )
            );
          }
        );

        // Fetch Posts
        const postsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', userData.uid),
          orderBy('createdAt', 'desc')
        );

        const unsubscribePosts = onSnapshot(
          postsQuery,
          (snapshot) => {
            const postsData = snapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as Post)
            );
            setPosts(postsData);
          }
        );

        setLoading(false);

        return () => {
          unsubscribeWishlists();
          unsubscribePosts();
        };
      } catch (error) {
        console.error('Error fetching profile:', error);
        setUserFound(false);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, currentUser]);

  if (loading || authLoading) {
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
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'friends':
        return <Users className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      default:
        return null;
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

  const isOwnProfile = currentUser?.uid === profileUser?.uid;

  const profilePhoto =
    profileUser.photoURL ||
    `https://picsum.photos/seed/${profileUser.uid}/200/200`;

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
                  src={profilePhoto}
                  alt={profileUser.name ?? 'User'}
                />
                <AvatarFallback className="text-3xl">
                  {getInitials(profileUser.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold sm:text-3xl">
                {profileUser.name ?? 'New User'}
              </h1>
              <p className="text-sm text-muted-foreground">
                @{profileUser.username}
              </p>
              <p className="mt-2 max-w-2xl text-sm">
                {profileUser.bio ?? "This user hasn't set a bio yet."}
              </p>
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
          <TabsTrigger value="wishlists">
            Wishlists ({wishlists.length})
          </TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <div className="relative my-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search in this profile..." className="pl-10" />
        </div>
        <TabsContent value="wishlists" className="mt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {wishlists.length > 0 ? (
              wishlists.map((list) => (
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
                        />
                        <Badge
                          variant="secondary"
                          className="absolute left-3 top-3 z-10"
                        >
                          {list.category}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4">
                        <h3 className="font-headline text-lg font-bold">
                          {list.title}
                        </h3>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            /* handle repost */
                          }}
                        >
                          <Repeat2 className="mr-1.5 h-4 w-4" />
                          Repost
                        </Button>
                      </div>
                    </Card>
                  </Link>
                  <div className="absolute right-3 top-3 z-20">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.preventDefault()}
                      >
                        <DropdownMenuItem
                          onSelect={() => {
                            /* Share logic here */
                          }}
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        {isOwnProfile ? (
                          <>
                            <DropdownMenuItem
                              onSelect={() => setEditingWishlist(list)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you absolutely sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete this wishlist.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteWishlist(list.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Yes, delete wishlist
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        ) : (
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <AlertTriangle className="mr-2 h-4 w-4" /> Report
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 flex items-center justify-center rounded-lg border-2 border-dashed py-12 text-center sm:col-span-2">
                <p className="text-muted-foreground">
                  {isOwnProfile
                    ? "You haven't created any wishlists yet."
                    : 'This user has no public wishlists yet.'}
                </p>
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
                    <p className="mb-4 whitespace-pre-wrap text-sm">
                      {post.content}
                    </p>
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
                <p>
                  {isOwnProfile
                    ? "You haven't made any posts yet."
                    : "This user hasn't made any posts yet."}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="favorites" className="mt-6">
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
            <p>Favorites feature coming soon!</p>
          </div>
        </TabsContent>
      </Tabs>
      {editingWishlist && (
        <EditWishlistDialog
          wishlist={editingWishlist}
          open={!!editingWishlist}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditingWishlist(null);
            }
          }}
          onSuccess={() => {
            setEditingWishlist(null);
          }}
        />
      )}
    </div>
  );
}
