
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
  PlusCircle,
  Users,
  Lock,
  Edit,
  Trash2,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Globe,
  Package,
  Repeat2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from "@/components/ui/alert-dialog"
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { CreateWishlistDialog } from '@/components/create-wishlist-dialog';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, DocumentData, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { EditWishlistDialog } from '@/components/edit-wishlist-dialog';


interface Wishlist extends DocumentData {
  id: string;
  title: string;
  description?: string;
  category: string;
  itemCount: number; 
  privacy: 'public' | 'friends' | 'private';
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
  const { toast } = useToast();
  const [editingWishlist, setEditingWishlist] = useState<Wishlist | null>(null);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    setLoading(true);
    const q = query(collection(db, "wishlists"), where("authorId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const lists = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wishlist));
        setWishlists(lists.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)));
        setLoading(false);
    }, (error) => {
        console.error("Error fetching wishlists: ", error);
        toast({ title: "Error", description: "Could not fetch wishlists.", variant: "destructive" });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);


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

  const handleDeleteWishlist = async (wishlistId: string) => {
    try {
        await deleteDoc(doc(db, 'wishlists', wishlistId));
        toast({ title: "Success", description: "Wishlist has been deleted." });
    } catch (error) {
        console.error("Error deleting wishlist: ", error);
        toast({ title: "Error", description: "Could not delete the wishlist. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Wishlists</h1>
        <CreateWishlistDialog>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
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
             <div key={list.id} className="block group relative">
              <Link href={`/dashboard/wishlist/${list.id}`}>
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
                    <div className="flex items-start justify-between gap-4">
                       <div className="flex-1">
                          <div className="flex items-center gap-4">
                              <h3 className="font-headline text-2xl font-bold">
                                  {list.title}
                              </h3>
                              <Badge variant="secondary" className="text-sm">
                                  {list.category}
                              </Badge>
                          </div>
                          <p className="mt-2 flex items-center text-muted-foreground">
                            <Package className="mr-2 h-4 w-4" />
                            {list.itemCount || 0} {list.itemCount === 1 ? 'item' : 'items'}
                          </p>
                       </div>
                       <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize gap-1.5 pl-2 pr-3 py-1.5 text-muted-foreground">
                              {getPrivacyIcon(list.privacy)}
                              <span>{getPrivacyLabel(list.privacy)}</span>
                          </Badge>
                       </div>
                    </div>
                     <div className="mt-4">
                          <div className="flex justify-between text-sm text-muted-foreground mb-1">
                              <span>{list.unitsFulfilled || 0} of {list.totalUnits || 0} units</span>
                              <span>{list.progress || 0}%</span>
                          </div>
                          <Progress value={list.progress || 0} className="h-2" />
                     </div>
                  </CardContent>
                  <Separator />
                  <CardFooter className="flex justify-between p-4 text-sm text-muted-foreground">
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
                     <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); /* handle repost */}}>
                        <Repeat2 className="mr-1.5 h-4 w-4" />
                        Repost
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
                <div className="absolute top-4 right-4 z-10">
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
                      <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
                          <DropdownMenuItem onSelect={() => setEditingWishlist(list)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => {/* Share logic here */}}>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this wishlist.
                                    </Description>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteWishlist(list.id)} className="bg-destructive hover:bg-destructive/90">
                                        Yes, delete wishlist
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
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
