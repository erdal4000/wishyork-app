'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MapPin, UserPlus, Edit } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, DocumentData, onSnapshot } from 'firebase/firestore';

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

function ProfilePageSkeleton() {
    return (
        <div className="space-y-6">
            <Card className="overflow-hidden">
                <Skeleton className="h-48 w-full md:h-64" />
                <CardContent className="p-4 sm:p-6">
                    <div className="relative flex flex-col items-center gap-4 sm:flex-row">
                        <div className="-mt-16 flex-shrink-0 sm:-mt-24">
                           <Skeleton className="h-24 w-24 rounded-full sm:h-32 sm:w-32" />
                        </div>
                         <div className="flex-1 space-y-2 pt-4 text-center sm:text-left">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full max-w-2xl" />
                         </div>
                    </div>
                </CardContent>
            </Card>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
}

export default function ProfilePage() {
  const params = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]); // Placeholder for favorites
  const [loading, setLoading] = useState(true);

  const username = params.username as string;

  useEffect(() => {
    if (!username) return;

    const fetchUserProfile = async () => {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as UserProfile;
        setProfileUser(userData);

        // Fetch user's posts
        const postsQuery = query(collection(db, 'posts'), where('authorId', '==', userData.uid));
        const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
            const userPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
            setPosts(userPosts);
        });
        
        // In the future, you would also fetch user's favorites here.
        setFavorites([]); // Resetting placeholder

        return () => unsubscribePosts();
      } else {
        setProfileUser(null);
      }
      setLoading(false);
    };

    fetchUserProfile();

  }, [username]);
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };
  
  if (loading || authLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!profileUser) {
    return <div>User not found.</div>;
  }

  const isOwnProfile = currentUser?.uid === profileUser?.uid;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative h-48 w-full bg-secondary md:h-64">
          <Image
            src="https://picsum.photos/1200/400"
            alt="Cover image"
            data-ai-hint="abstract landscape"
            fill
            className="object-cover"
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
                <AvatarFallback>{getInitials(profileUser.name)}</AvatarFallback>
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
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{profileUser.email}</span>
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

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.length > 0 ? posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <p className="mb-4 text-sm">{post.content}</p>
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
                 <div className="flex items-center justify-center p-8 text-center text-muted-foreground md:col-span-2 xl:col-span-3">
                    <p>This user hasn't made any posts yet.</p>
                </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="favorites" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
             <div className="flex items-center justify-center p-8 text-center text-muted-foreground md:col-span-2 xl:col-span-3">
                <p>Favorites feature coming soon!</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
