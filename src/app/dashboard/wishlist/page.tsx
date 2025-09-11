'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  MoreHorizontal,
  Plus,
  Users,
  Lock,
  Edit,
  Trash2,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Globe,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { CreateWishlistDialog } from '@/components/create-wishlist-dialog';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


interface Wishlist extends DocumentData {
  id: string;
  title: string;
  category: string;
  itemCount: number;
  privacy: 'Public' | 'Friends' | 'Private';
  imageUrl: string;
  aiHint: string;
  progress: number;
  unitsFulfilled: number;
  totalUnits: number;
  likes: number;
  comments: number;
  saves: number;
  createdAt: Timestamp;
}

function WishlistCardSkeleton() {
  return (
    <Card className="w-full overflow-hidden rounded-2xl shadow-lg">
      <Skeleton className="h-80 w-full" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="mt-4 h-6 w-3/4" />
        <div className="mt-4 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex justify-between p-4">
        <div className="flex gap-6">
          <Skeleton className="h-6 w-10" />
          <Skeleton className="h-6 w-10" />
          <Skeleton className="h-6 w-10" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </CardFooter>
    </Card>
  )
}

export default function WishlistPage() {
  const { user } = useAuth();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    const q = query(collection(db, "wishlists"), where("authorId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const lists: Wishlist[] = [];
        querySnapshot.forEach((doc) => {
            lists.push({ id: doc.id, ...doc.data() } as Wishlist);
        });
        setWishlists(lists.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)));
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);


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
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Wishlists</h1>
        <CreateWishlistDialog>
          <Button>
            <Plus className="mr-2 h-5 w-5" />
            Create Wishlist
          </Button>
        </CreateWishlistDialog>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 gap-8">
            <WishlistCardSkeleton />
            <WishlistCardSkeleton />
        </div>
      ) : wishlists.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          {wishlists.map((list) => (
             <Link href={`/dashboard/wishlist/${list.id}`} key={list.id} className="block group">
              <Card
                className="w-full overflow-hidden rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-xl"
              >
                <CardHeader className="relative h-80 w-full p-0">
                  <Image
                    src={list.imageUrl}
                    alt={list.title}
                    data-ai-hint={list.aiHint}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <h3 className="font-headline text-2xl font-bold">
                            {list.title}
                        </h3>
                        <Badge variant="secondary" className="text-sm">
                            {list.category}
                        </Badge>
                     </div>
                     <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize gap-1.5 pl-2 pr-3 py-1.5 text-muted-foreground">
                            {getPrivacyIcon(list.privacy)}
                            <span>{getPrivacyLabel(list.privacy)}</span>
                        </Badge>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={(e) => e.preventDefault()}
                            >
                            <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                  </div>
                   <p className="mt-2 text-sm text-muted-foreground">
                        {list.itemCount} item types
                   </p>
                   <div className="mt-4">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                            <span>{list.unitsFulfilled} of {list.totalUnits} units</span>
                            <span>{list.progress}%</span>
                        </div>
                        <Progress value={list.progress} className="h-2" />
                   </div>
                </CardContent>
                <Separator />
                <CardFooter className="flex justify-between p-4 text-sm text-muted-foreground">
                  <div className="flex gap-6">
                    <div className="flex items-center gap-1.5">
                      <Heart className="h-5 w-5" />
                      <span className="font-medium">{list.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="h-5 w-5" />
                      <span className="font-medium">{list.comments}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bookmark className="h-5 w-5" />
                      <span className="font-medium">{list.saves}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => e.preventDefault()}>
                      <Share2 className="h-5 w-5" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <h3 className="text-xl font-semibold">No wishlists yet!</h3>
          <p className="mt-2 text-muted-foreground">
            Click "Create Wishlist" to get started.
          </p>
        </div>
      )}
    </div>
  );
}
