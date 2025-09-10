'use client';

import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MapPin, UserPlus, Edit } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  
  // Placeholder data
  const posts = [
    {
      id: 1,
      content:
        'Just donated to the "Clean Water Initiative"! It feels so good to contribute to such a meaningful cause.',
      imageUrl: 'https://picsum.photos/600/400?random=1',
      aiHint: 'clean water charity',
    },
    // Add more post objects here
  ];

  const favorites = [
    {
      id: 1,
      title: 'Support Education for Underprivileged Children',
      category: 'Education',
      imageUrl: 'https://picsum.photos/400/250?random=1',
      aiHint: 'children classroom',
    },
    // Add more favorite objects here
  ];
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };
  
  if (loading) {
    return (
        <div className="space-y-6">
            <Card className="overflow-hidden">
                <Skeleton className="h-48 w-full md:h-64" />
                <CardContent className="p-4 sm:p-6">
                    <div className="relative flex flex-col items-center gap-4 sm:flex-row">
                        <div className="-mt-16 flex-shrink-0 sm:-mt-24">
                           <Skeleton className="h-24 w-24 rounded-full sm:h-32 sm:w-32" />
                        </div>
                         <div className="flex-1 space-y-2 text-center sm:text-left">
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

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

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
                  src={user.photoURL ?? ''}
                  alt={user.displayName ?? 'User'}
                />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold sm:text-3xl">{user.displayName ?? 'New User'}</h1>
              <p className="text-sm text-muted-foreground">@{user.email}</p>
              <p className="mt-2 max-w-2xl text-sm">
                This is your bio. You can edit it in the settings page.
                Let's make the world a better place, one wish at a time! 🌍✨
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground sm:justify-start">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Planet Earth</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
            <div className="mt-2 flex-shrink-0 sm:mt-0">
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">My Posts</TabsTrigger>
          <TabsTrigger value="favorites">My Favorites</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
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
            ))}
             <div className="flex items-center justify-center p-8 text-center text-muted-foreground md:col-span-2 xl:col-span-3">
                <p>No more posts to show.</p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="favorites" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((fav) => (
              <Card key={fav.id} className="group">
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                  <Image
                    src={fav.imageUrl}
                    alt={fav.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    data-ai-hint={fav.aiHint ?? ''}
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-2 left-2 text-xs">
                    <span className="rounded-full bg-primary/80 px-2 py-1 font-semibold text-primary-foreground backdrop-blur-sm">
                      {fav.category}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold leading-tight">{fav.title}</h3>
                </CardContent>
              </Card>
            ))}
             <div className="flex items-center justify-center p-8 text-center text-muted-foreground md:col-span-2 xl:col-span-3">
                <p>No more favorites to show.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
