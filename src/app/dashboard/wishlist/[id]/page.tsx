

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, query, orderBy, DocumentData, deleteDoc } from 'firebase/firestore';
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
  Loader2,
  Trash2,
  Share2,
  Edit,
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { AddItemDialog } from '@/components/add-item-dialog';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialogTrigger } from '@radix-ui/react-alert-dialog';

interface Wishlist extends DocumentData {
    id: string;
    title: string;
    authorName: string;
    authorUsername: string;
    authorAvatar: string;
    imageUrl: string;
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

interface Item extends DocumentData {
    id: string;
    name: string;
    source?: string;
    status: 'available' | 'reserved' | 'fulfilled';
    details?: string;
    description?: string;
    imageUrl: string;
    aiHint?: string;
    reservedBy?: string;
    price?: string;
    purchaseUrl?: string;
    addedAt: any;
    priority: string;
    recurrence: string;
    quantity: number;
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
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const { toast } = useToast();

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
    }, (error) => {
        console.error("Error fetching wishlist: ", error);
        toast({ title: "Error", description: "Could not fetch wishlist.", variant: "destructive" });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [id, toast]);

  useEffect(() => {
    if (!id) return;
    setLoadingItems(true);
    const itemsCollectionRef = collection(db, 'wishlists', id, 'items');
    const q = query(itemsCollectionRef, orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsData: Item[] = [];
      querySnapshot.forEach((doc) => {
        itemsData.push({ id: doc.id, ...doc.data() } as Item);
      });
      setItems(itemsData);
      setLoadingItems(false);
    }, (error) => {
        console.error("Error fetching items: ", error);
        toast({ title: "Error", description: "Could not fetch items.", variant: "destructive" });
        setLoadingItems(false);
    });

    return () => unsubscribe();
  }, [id, toast]);
  
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

  const handleDeleteItem = async (itemId: string) => {
    try {
        const itemRef = doc(db, 'wishlists', id, 'items', itemId);
        await deleteDoc(itemRef);
        toast({ title: "Success", description: "Item removed from wishlist." });
    } catch (error) {
        console.error("Error deleting item: ", error);
        toast({ title: "Error", description: "Could not remove the item. Please try again.", variant: "destructive" });
    }
  }

  const handleDeleteWishlist = async () => {
    if (!id) return;
     try {
        await deleteDoc(doc(db, 'wishlists', id));
        toast({ title: "Success", description: "Wishlist has been deleted." });
        router.push('/dashboard/wishlist');
    } catch (error) {
        console.error("Error deleting wishlist: ", error);
        toast({ title: "Error", description: "Could not delete the wishlist. Please try again.", variant: "destructive" });
    }
  }

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
            <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" /> Edit Wishlist
            </DropdownMenuItem>
            <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" /> Share
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
                            This action cannot be undone. This will permanently delete this
                            wishlist and all its items.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteWishlist} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete wishlist
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
              <AvatarImage src={wishlist.authorAvatar} alt={wishlist.authorName} />
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
          <AddItemDialog wishlistId={id}>
            <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </AddItemDialog>
        </div>
        <Separator />
        
        {loadingItems ? (
             <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 text-center">
                 <h3 className="text-xl font-semibold">No items yet!</h3>
                <p className="mt-2 text-muted-foreground">
                    Click "Add Item" to start building your wishlist.
                </p>
            </div>
        ) : (
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
                         {item.addedAt && (
                           <p className="text-sm text-muted-foreground">
                            Added {formatDistanceToNow(item.addedAt.toDate(), { addSuffix: true })}
                           </p>
                         )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the item
                                        from your wishlist.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive hover:bg-destructive/90">
                                        Yes, delete item
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="space-y-2 pb-4 pt-0 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                        <Badge variant="outline">{item.recurrence}</Badge>
                        <Badge variant="outline">{item.quantity} required</Badge>
                         <Badge variant="outline">Priority: {item.priority}</Badge>
                      </div>
                      {item.description && <p>{item.description}</p>}
                      {item.price && <p className="font-bold">{item.price}</p>}
                      {item.purchaseUrl && <Link href={item.purchaseUrl} target="_blank" className="text-primary hover:underline">View Product</Link>}
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
        )}
      </div>
    </div>
  );
}

    
