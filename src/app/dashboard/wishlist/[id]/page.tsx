
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MessageCircle,
  MoreVertical,
  Plus,
  Lock,
  Gift,
  AlertTriangle,
  Users,
  Globe,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Wishlist extends DocumentData {
    id: string;
    title: string;
    authorName: string;
    authorUsername: string;
    authorAvatar: string;
    coverImageUrl: string;
    aiHint: string;
    category: string;
    privacy: 'public' | 'friends' | 'private';
    unitsFulfilled: number;
    totalUnits: number;
    likes: number;
    comments: number;
    saves: number;
    progress: number;
    itemCount: number;
}


function WishlistDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <Skeleton className="h-10 w-24" />
                 <Skeleton className="h-10 w-24" />
            </div>
             <Card className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="pt-16">
                     <Skeleton className="h-6 w-24 mb-2" />
                     <Skeleton className="h-8 w-1/2 mb-2" />
                     <Skeleton className="h-5 w-1/3 mb-4" />
                     <div className="space-y-2">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-1/5" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                     </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between px-6 pb-4">
                     <div className="flex gap-4">
                        <Skeleton className="h-6 w-10" />
                        <Skeleton className="h-6 w-10" />
                        <Skeleton className="h-6 w-10" />
                     </div>
                     <Skeleton className="h-8 w-8" />
                </CardFooter>
            </Card>
             <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-28" />
            </div>
             <Separator />
             <div className="space-y-4">
                 <Skeleton className="h-32 w-full rounded-lg" />
                 <Skeleton className="h-32 w-full rounded-lg" />
            </div>
        </div>
    )
}

export default function WishlistDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
    if (!id) return;
    setLoading(true);
    const docRef = doc(db, 'wishlists', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setWishlist({ id: docSnap.id, ...docSnap.data() } as Wishlist);
      } else {
        console.log("No such document!");
        setWishlist(null); // Or handle not found state
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);
  
  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'friends':
        return <Users className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };
  
  const getPrivacyLabel = (privacy: string) => {
      if (!privacy) return 'Public';
      return privacy.charAt(0).toUpperCase() + privacy.slice(1);
  }

  // Placeholder for items - this will be dynamic later
  const items = [
    {
      id: 1,
      name: 'Item 1 - Fulfilled',
      source: 'Amazon',
      status: 'fulfilled',
      details: 'One time, 1 required',
      description: 'A fulfilled item description.',
      imageUrl: 'https://picsum.photos/seed/item1/100/100',
      aiHint: 'gadget box',
    },
    {
      id: 2,
      name: 'Item 2 - Also Fulfilled',
      source: 'Hepsiburada',
      status: 'fulfilled',
      details: 'One time, 1 required',
      description: 'Another fulfilled item, showing the state.',
      imageUrl: 'https://picsum.photos/seed/item2/100/100',
      aiHint: 'book cover',
    },
    {
      id: 3,
      name: '8’li Çekmeceli Dolap İyi Düzenleyici Kutusu Set',
      source: 'IKEA',
      status: 'reserved',
      details: 'Monthly, 10 required',
      description: 'Tamam organize set.',
      imageUrl: 'https://picsum.photos/seed/item3/100/100',
      aiHint: 'storage box',
      reservedBy: 'Ayşe Yılmaz',
    },
    {
      id: 4,
      name: 'Mathilda King Size Nevresim Takımı',
      source: 'Zara Home',
      status: 'available',
      price: '999,99 TL',
      details: 'One time, 1 required',
      description:
        '100% cotton sateen for a soft, smooth feel.',
      imageUrl: 'https://picsum.photos/seed/item4/100/100',
      aiHint: 'bedding set',
    },
     {
      id: 5,
      name: 'King Size 100% Pamuk Karartma Düz Pike',
      source: 'Mudo',
      status: 'available',
      price: '899,00 TL',
      description:
        'A stylish and comfortable king size pike.',
      imageUrl: 'https://picsum.photos/seed/item5/100/100',
      aiHint: 'cotton blanket',
    },
  ];

  if (loading) {
    return <WishlistDetailSkeleton />;
  }

  if (!wishlist) {
    return <div>Wishlist not found.</div>; // Or a more elaborate "Not Found" component
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/wishlist">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Wishlists
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit Wishlist</DropdownMenuItem>
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Wishlist Header Card */}
      <Card className="overflow-hidden">
        <CardHeader className="relative h-48 w-full p-0">
          <Image
            src={wishlist.imageUrl}
            alt={wishlist.title}
            data-ai-hint={wishlist.aiHint}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-0 left-6 translate-y-1/2">
            <Avatar className="h-24 w-24 border-4 border-card">
              <AvatarImage src="" alt={wishlist.authorName} />
              <AvatarFallback className="text-3xl">
                {wishlist.authorName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>
        <CardContent className="pt-16">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{wishlist.category}</Badge>
             <Badge variant="outline" className="capitalize gap-1.5 pl-2 pr-3 py-1.5 text-muted-foreground">
                {getPrivacyIcon(wishlist.privacy)}
                <span>{getPrivacyLabel(wishlist.privacy)}</span>
            </Badge>
          </div>
          <h1 className="mt-2 text-3xl font-bold">{wishlist.title}</h1>
          <p className="text-muted-foreground">
            by{' '}
            <Link href={`/profile/${wishlist.authorUsername}`} className="text-primary hover:underline">
              {wishlist.authorName}
            </Link>
          </p>

          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {wishlist.unitsFulfilled} of {wishlist.totalUnits} units
                fulfilled
              </span>
              <span>{wishlist.progress}%</span>
            </div>
            <Progress value={wishlist.progress} className="h-2" />
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between px-6 pb-4">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Heart className="h-5 w-5" /> {wishlist.likes}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="h-5 w-5" /> {wishlist.comments}
            </span>
            <span className="flex items-center gap-1.5">
              <Bookmark className="h-5 w-5" /> {wishlist.saves}
            </span>
          </div>
          <Button variant="ghost" size="icon">
            <Bookmark />
            <span className="sr-only">Save</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Items ({items.length})</h2>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
        <Separator />

        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex">
                {/* Image / Icon */}
                <div
                  className={`flex w-32 flex-shrink-0 items-center justify-center ${
                    item.status === 'fulfilled'
                      ? 'bg-green-100 dark:bg-green-900/50'
                      : ''
                  }`}
                >
                  {item.status === 'fulfilled' ? (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white">
                      <Gift className="h-8 w-8" />
                    </div>
                  ) : (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      data-ai-hint={item.aiHint}
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {item.source}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-4 pt-0 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                       <Badge variant="outline">{item.details}</Badge>
                    </div>
                    <p>{item.description}</p>
                    {item.price && <p className="font-bold">{item.price}</p>}
                    <Link href="#" className="text-primary hover:underline">View Product</Link>
                  </CardContent>

                  {item.status === 'fulfilled' && (
                     <CardFooter className="bg-muted/50 py-3">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Fulfilled</p>
                     </CardFooter>
                  )}

                  {item.status === 'reserved' && (
                    <div className="px-6 pb-4">
                        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 dark:bg-yellow-900/30 dark:border-yellow-700/50">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-500 dark:text-yellow-400"/>
                                <div>
                                    <p className="font-semibold">Reserved by {item.reservedBy}</p>
                                    <p className="text-xs text-muted-foreground">Item is reserved before purchase to ensure no gift duplicates.</p>
                                </div>
                            </div>
                           <Button className="mt-3 w-full">Mark as purchased</Button>
                        </div>
                    </div>
                  )}

                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

    