

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, query, orderBy, DocumentData, deleteDoc, updateDoc, writeBatch, increment, getDocFromServer } from 'firebase/firestore';
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
  XCircle,
  Repeat2,
  Calendar,
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { AddItemDialog } from '@/components/add-item-dialog';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { EditWishlistDialog } from '@/components/edit-wishlist-dialog';
import { useAuth } from '@/context/auth-context';
import { CommentSection } from '@/components/comment-section';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Wishlist extends DocumentData {
    id: string;
    title: string;
    description?: string;
    authorId: string;
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
    commentCount: number;
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
    neededBy?: any;
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
  const { user } = useAuth();
  const [editingWishlist, setEditingWishlist] = useState<Wishlist | null>(null);

   useEffect(() => {
    if (!id) return;
    setLoading(true);
    const docRef = doc(db, 'wishlists', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const progress = (data.totalUnits > 0) ? Math.round((data.unitsFulfilled / data.totalUnits) * 100) : 0;
        setWishlist({ id: docSnap.id, ...data, progress } as Wishlist);
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

  const handleReserveItem = async (itemId: string) => {
    if (!user) {
        toast({ title: "Login Required", description: "You must be logged in to reserve an item.", variant: "destructive" });
        return;
    }
    try {
        const itemRef = doc(db, 'wishlists', id, 'items', itemId);
        await updateDoc(itemRef, {
            status: 'reserved',
            reservedBy: user.displayName, // Or user.uid for more robust linking
        });
        toast({ title: "Success", description: "Item has been reserved!" });
    } catch (error) {
        console.error("Error reserving item: ", error);
        toast({ title: "Error", description: "Could not reserve the item. Please try again.", variant: "destructive" });
    }
  };

  const handleMarkAsPurchased = async (itemId: string, itemQuantity: number) => {
    if (!user) {
        toast({ title: "Login Required", description: "You must be logged in to mark an item as purchased.", variant: "destructive" });
        return;
    }
    try {
        const batch = writeBatch(db);
        const wishlistRef = doc(db, 'wishlists', id);
        const itemRef = doc(db, 'wishlists', id, 'items', itemId);
        
        batch.update(itemRef, { status: 'fulfilled' });
        batch.update(wishlistRef, { unitsFulfilled: increment(itemQuantity) });

        await batch.commit();

        toast({ title: "Thank You!", description: "This wish has been fulfilled." });
    } catch (error) {
        console.error("Error marking item as purchased: ", error);
        toast({ title: "Error", description: "Could not update the item. Please try again.", variant: "destructive" });
    }
  };

  const handleCancelReservation = async (itemId: string) => {
    try {
        const itemRef = doc(db, 'wishlists', id, 'items', itemId);
        await updateDoc(itemRef, {
            status: 'available',
            reservedBy: null,
        });
        toast({ title: "Reservation Cancelled", description: "The item is now available for others." });
    } catch (error) {
        console.error("Error cancelling reservation: ", error);
        toast({ title: "Error", description: "Could not cancel the reservation. Please try again.", variant: "destructive" });
    }
  };


  const handleDeleteItem = async (item: Item) => {
    try {
        const batch = writeBatch(db);
        const wishlistRef = doc(db, 'wishlists', id);
        const itemRef = doc(db, 'wishlists', id, 'items', item.id);

        batch.delete(itemRef);

        const updateData: { [key: string]: any } = {
            itemCount: increment(-1),
            totalUnits: increment(-item.quantity),
        };

        if (item.status === 'fulfilled') {
            updateData.unitsFulfilled = increment(-item.quantity);
        }

        batch.update(wishlistRef, updateData);

        await batch.commit();

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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  const authorPhoto = wishlist.authorAvatar || `https://picsum.photos/seed/${wishlist.authorId}/200/200`;

  const isOwnWishlist = user?.uid === wishlist.authorId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {isOwnWishlist && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditingWishlist(wishlist)}>
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
        )}
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
              <AvatarImage src={authorPhoto} alt={wishlist.authorName} />
              <AvatarFallback className="text-3xl">
                {getInitials(wishlist.authorName)}
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
            <Link href={`/dashboard/profile/${wishlist.authorUsername}`} className="text-primary hover:underline">
              {wishlist.authorName}
            </Link>
          </p>

          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {wishlist.unitsFulfilled || 0} of {wishlist.totalUnits || 0} units
                fulfilled
              </span>
              <span>{wishlist.progress || 0}%</span>
            </div>
            <Progress value={wishlist.progress || 0} className="h-2" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between p-2">
            <TooltipProvider>
            <div className="flex items-center text-muted-foreground">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <MessageCircle className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs"><p>Reply</p></TooltipContent>
                </Tooltip>
                 <span className="text-sm pr-2">{wishlist.commentCount ?? 0}</span>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Repeat2 className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs"><p>Repost</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Heart className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs"><p>Like</p></TooltipContent>
                </Tooltip>
                <span className="text-sm pr-2">{wishlist.likes ?? 0}</span>
            </div>

            <div className="flex items-center text-muted-foreground">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Bookmark className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs"><p>Bookmark</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs"><p>Share</p></TooltipContent>
                </Tooltip>
            </div>
            </TooltipProvider>
        </CardFooter>
      </Card>
      
      {editingWishlist && (
        <EditWishlistDialog
            wishlist={editingWishlist}
            open={!!editingWishlist}
            onOpenChange={(isOpen) => !isOpen && setEditingWishlist(null)}
            onSuccess={() => setEditingWishlist(null)}
        />
      )}


      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Items ({items.length})</h2>
          {isOwnWishlist && (
            <AddItemDialog wishlistId={id}>
              <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </AddItemDialog>
          )}
        </div>
        <Separator />
        
        {loadingItems ? (
             <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 text-center">
                 <h3 className="text-xl font-semibold">No items yet!</h3>
                 {isOwnWishlist && (
                    <p className="mt-2 text-muted-foreground">
                        Click "Add Item" to start building your wishlist.
                    </p>
                 )}
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
                      {isOwnWishlist && (
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
                                          from your wishlist and update the progress.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteItem(item)} className="bg-destructive hover:bg-destructive/90">
                                          Yes, delete item
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2 pb-4 pt-0 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                        <Badge variant="outline">{item.recurrence}</Badge>
                        <Badge variant="outline">{item.quantity} required</Badge>
                         <Badge variant="outline">Priority: {item.priority}</Badge>
                         {item.neededBy && (
                            <Badge variant="outline" className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" />
                                Needed by {format(item.neededBy.toDate(), "MMM d, yyyy")}
                            </Badge>
                         )}
                      </div>
                      {item.description && <p>{item.description}</p>}
                      {item.price && <p className="font-bold">{item.price}</p>}
                      {item.purchaseUrl && <Link href={item.purchaseUrl} target="_blank" className="text-primary hover:underline">View Product</Link>}
                    </CardContent>

                    {!isOwnWishlist && (
                       <div className="px-6 pb-4">
                          {item.status === 'available' && (
                              <Button className="w-full" onClick={() => handleReserveItem(item.id)}>
                                  Reserve this item
                              </Button>
                          )}
                          {item.status === 'fulfilled' && (
                              <div className="rounded-md border border-green-300 bg-green-50 p-4 dark:bg-green-900/30 dark:border-green-700/50">
                                  <div className="flex items-center gap-3">
                                      <Gift className="h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400"/>
                                      <p className="font-semibold text-green-700 dark:text-green-300">Fulfilled</p>
                                  </div>
                              </div>
                          )}
                          {item.status === 'reserved' && (
                              <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 dark:bg-yellow-900/30 dark:border-yellow-700/50">
                                  <div className="flex items-start gap-3">
                                      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-500 dark:text-yellow-400"/>
                                      <div>
                                          <p className="font-semibold">Reserved by {item.reservedBy}</p>
                                          <p className="text-xs text-muted-foreground">Item is reserved before purchase to ensure no gift duplicates.</p>
                                      </div>
                                  </div>
                                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                  <Button className="w-full" onClick={() => handleMarkAsPurchased(item.id, item.quantity)}>Mark as purchased</Button>
                                  {user?.displayName === item.reservedBy && (
                                      <Button variant="outline" className="w-full" onClick={() => handleCancelReservation(item.id)}>
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Cancel Reservation
                                      </Button>
                                  )}
                                  </div>
                              </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Comments Section */}
       <div className="space-y-4">
         <h2 className="text-2xl font-bold">Replies ({wishlist.commentCount || 0})</h2>
         <CommentSection docId={id} collectionType="wishlists" docAuthorId={wishlist.authorId} />
       </div>

    </div>
  );
}
