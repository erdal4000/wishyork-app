
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, query, orderBy, DocumentData, getDocs, writeBatch, deleteDoc, updateDoc, increment, runTransaction, Unsubscribe, serverTimestamp } from 'firebase/firestore';
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
import { getInitials } from '@/lib/utils';
import { useBookmark } from '@/hooks/use-bookmark';
import { usePostInteraction } from '@/hooks/use-post-interaction';

interface Wishlist extends DocumentData {
    id: string;
    title: string;
    description?: string;
    authorId: string;
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
    createdAt: any;
}

interface UserProfile extends DocumentData {
  name: string;
  username: string;
  photoURL?: string;
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
    reservedById?: string;
    price?: string;
    purchaseUrl?: string;
    addedAt: any;
    neededBy?: any;
    priority: string;
    recurrence: string;
    quantity: number;
}


const useAuthorProfile = (authorId?: string) => {
    const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        if (!authorId) {
            setLoadingProfile(false);
            return;
        };

        const userDocRef = doc(db, 'users', authorId);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setAuthorProfile(docSnap.data() as UserProfile);
            } else {
                setAuthorProfile(null);
            }
            setLoadingProfile(false);
        });

        return () => unsubscribe();
    }, [authorId]);

    return { authorProfile, loadingProfile };
};


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
  const { toast } = useToast();
  const { user } = useAuth();
  const [editingWishlist, setEditingWishlist] = useState<Wishlist | null>(null);
  const [isUpdatingItem, setIsUpdatingItem] = useState<string | null>(null);

  const { authorProfile, loadingProfile } = useAuthorProfile(wishlist?.authorId);
  const { isBookmarked, isToggling: isTogglingBookmark, toggleBookmark } = useBookmark({
    refId: id,
    type: 'cause',
    title: wishlist?.title,
    imageUrl: wishlist?.imageUrl,
    authorName: authorProfile?.name,
  });
  const { hasLiked, isLiking, toggleLike } = usePostInteraction(id, 'wishlist');

  useEffect(() => {
    let wishlistUnsub: Unsubscribe | undefined;
    let itemsUnsub: Unsubscribe | undefined;
  
    if (id) {
      setLoading(true);
      wishlistUnsub = onSnapshot(doc(db, 'wishlists', id), (wishlistDoc) => {
        if (wishlistDoc.exists()) {
          const wishlistData = { id: wishlistDoc.id, ...wishlistDoc.data() } as Wishlist;
          setWishlist(wishlistData);
  
          const canView = wishlistData.authorId === user?.uid || wishlistData.privacy === 'public';
          if (canView) {
            const itemsCollectionRef = collection(db, 'wishlists', id, 'items');
            const q = query(itemsCollectionRef, orderBy('addedAt', 'desc'));
            
            if (itemsUnsub) itemsUnsub();
  
            itemsUnsub = onSnapshot(q, (itemsSnapshot) => {
              const itemsData = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
              setItems(itemsData);
            }, (error) => {
              console.error("Error fetching items: ", error);
              toast({ title: "Error", description: "Could not fetch wishlist items.", variant: "destructive" });
            });
          } else {
            setItems([]);
          }
        } else {
          console.log("No such document!");
          setWishlist(null);
          setItems([]);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching wishlist: ", error);
        setLoading(false);
        toast({ title: "Error", description: "Could not fetch wishlist details.", variant: "destructive" });
      });
    }
  
    return () => {
      if (wishlistUnsub) wishlistUnsub();
      if (itemsUnsub) itemsUnsub();
    };
  }, [id, user, toast]);

  const isOwnWishlist = user?.uid === wishlist?.authorId;
  const canViewItems = isOwnWishlist || wishlist?.privacy === 'public';
  
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
    setIsUpdatingItem(itemId);
    const itemRef = doc(db, 'wishlists', id, 'items', itemId);
    try {
      await updateDoc(itemRef, {
        status: 'reserved',
        reservedBy: user.displayName || 'Anonymous',
        reservedById: user.uid,
      });
      toast({ title: "Success", description: "Item has been reserved!" });
    } catch (error) {
      console.error("Error reserving item:", error);
      toast({ title: "Error", description: "Could not reserve the item. Please try again.", variant: "destructive" });
    } finally {
      setIsUpdatingItem(null);
    }
  };

  const handleMarkAsPurchased = async (itemId: string, itemQuantity: number) => {
    if (!user) {
      toast({ title: "Login Required", description: "You must be logged in to mark an item as purchased.", variant: "destructive" });
      return;
    }
    setIsUpdatingItem(itemId);
    const itemRef = doc(db, 'wishlists', id, 'items', itemId);
    const wishlistRef = doc(db, 'wishlists', id);
    try {
      await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemRef);
        const wishlistDoc = await transaction.get(wishlistRef);
        if (!itemDoc.exists() || !wishlistDoc.exists()) {
          throw new Error("Item or Wishlist not found");
        }
        
        // Only proceed if the item is not already fulfilled to prevent double counting
        if (itemDoc.data().status === 'fulfilled') {
            return;
        }

        transaction.update(itemRef, { status: 'fulfilled' });
        
        const newUnitsFulfilled = (wishlistDoc.data().unitsFulfilled || 0) + itemQuantity;
        const totalUnits = wishlistDoc.data().totalUnits || 0;
        const newProgress = totalUnits > 0 ? Math.round((newUnitsFulfilled / totalUnits) * 100) : 0;
  
        transaction.update(wishlistRef, {
          unitsFulfilled: increment(itemQuantity),
          progress: newProgress,
        });
      });
      toast({ title: "Thank You!", description: "This wish has been fulfilled." });
    } catch (error) {
      console.error("Error marking as purchased:", error);
      toast({ title: "Error", description: "Could not mark the item as purchased. Please try again.", variant: "destructive" });
    } finally {
      setIsUpdatingItem(null);
    }
  };

  const handleMarkAsAvailable = async (itemId: string, itemQuantity: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !isOwnWishlist) return;

    setIsUpdatingItem(itemId);
    const itemRef = doc(db, 'wishlists', id, 'items', itemId);
    const wishlistRef = doc(db, 'wishlists', id);

    try {
      await runTransaction(db, async (transaction) => {
        const wishlistDoc = await transaction.get(wishlistRef);
        if (!wishlistDoc.exists()) {
          throw new Error("Wishlist not found");
        }

        transaction.update(itemRef, {
          status: 'available',
          reservedBy: null,
          reservedById: null,
        });

        if (item.status === 'fulfilled') {
          const newUnitsFulfilled = Math.max(0, (wishlistDoc.data().unitsFulfilled || 0) - itemQuantity);
          const totalUnits = wishlistDoc.data().totalUnits || 0;
          const newProgress = totalUnits > 0 ? Math.round((newUnitsFulfilled / totalUnits) * 100) : 0;
          
          transaction.update(wishlistRef, {
            unitsFulfilled: newUnitsFulfilled,
            progress: newProgress,
          });
        }
      });
      toast({ title: "Item Updated", description: "The item is now marked as available." });
    } catch (error) {
      console.error("Error marking as available:", error);
      toast({ title: "Error", description: "Could not update the item. Please try again.", variant: "destructive" });
    } finally {
      setIsUpdatingItem(null);
    }
  };

  const handleDeleteItem = async (item: Item) => {
    const wishlistRef = doc(db, 'wishlists', id);
    const itemRef = doc(db, 'wishlists', id, 'items', item.id);
  
    try {
      await runTransaction(db, async (transaction) => {
        const wishlistDoc = await transaction.get(wishlistRef);
        if (!wishlistDoc.exists()) {
          throw "Wishlist does not exist!";
        }
        
        const currentData = wishlistDoc.data();
        let newUnitsFulfilled = currentData.unitsFulfilled || 0;
        let newTotalUnits = currentData.totalUnits || 0;
        
        newTotalUnits -= item.quantity;
        if (item.status === 'fulfilled') {
          newUnitsFulfilled -= item.quantity;
        }

        const newProgress = newTotalUnits > 0 ? Math.round((newUnitsFulfilled / newTotalUnits) * 100) : 0;
        
        transaction.update(wishlistRef, {
          itemCount: increment(-1),
          totalUnits: newTotalUnits,
          unitsFulfilled: newUnitsFulfilled,
          progress: newProgress
        });

        transaction.delete(itemRef);
      });

      toast({ title: "Success", description: "Item removed from wishlist." });
    } catch (e) {
      console.error("Item deletion failed: ", e);
      toast({ title: "Error", description: "Could not delete the item. Please try again.", variant: "destructive" });
    }
  }

  const handleDeleteWishlist = async () => {
    if (!id) return;
     try {
        const wishlistRef = doc(db, 'wishlists', id);
        const itemsRef = collection(wishlistRef, 'items');
        const itemsSnapshot = await getDocs(itemsRef);
        
        const batch = writeBatch(db); 
        itemsSnapshot.forEach(itemDoc => batch.delete(itemDoc.ref));
        batch.delete(wishlistRef);

        await batch.commit();
        toast({ title: "Success", description: "Wishlist and all its items have been deleted." });
        router.push('/dashboard/wishlist');
    } catch (error) {
        console.error("Error deleting wishlist: ", error);
        toast({ title: "Error", description: "Could not delete the wishlist. Please try again.", variant: "destructive" });
    }
  }

  if (loading || loadingProfile) {
    return <WishlistDetailSkeleton />;
  }

  if (!wishlist || !authorProfile) {
    return <div>Wishlist or author not found.</div>;
  }
  
  if (!canViewItems && !loading) {
      return (
          <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
              <Lock className="h-16 w-16 text-muted-foreground" />
              <h2 className="text-2xl font-bold">This Wishlist is Private</h2>
              <p className="text-muted-foreground">Only the owner can view the items in this list.</p>
              <Button onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
              </Button>
          </div>
      )
  }

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
              <AvatarImage src={authorProfile.photoURL} alt={authorProfile.name} />
              <AvatarFallback className="text-3xl">
                {getInitials(authorProfile.name)}
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
            <Link href={`/dashboard/profile/${authorProfile.username}`} className="text-primary hover:underline">
              {authorProfile.name}
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
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleLike} disabled={isLiking || !user}>
                            <Heart className={`h-5 w-5 ${hasLiked ? 'text-red-500 fill-current' : ''}`} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs"><p>Like</p></TooltipContent>
                </Tooltip>
                <span className={`text-sm pr-2 ${hasLiked ? 'text-red-500' : ''}`}>{wishlist.likes ?? 0}</span>
            </div>

            <div className="flex items-center text-muted-foreground">
                <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => { e.preventDefault(); toggleBookmark(); }} disabled={isTogglingBookmark || !user}>
                    <Bookmark className={`h-5 w-5 ${isBookmarked ? 'text-yellow-500 fill-current' : ''}`} />
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
        
        {loading ? (
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
                  <div
                    className={`flex w-32 flex-shrink-0 items-center justify-center ${
                      item.status === 'fulfilled'
                        ? 'bg-green-100 dark:bg-green-900/50'
                        : ''
                    }`}
                  >
                    {item.status === 'fulfilled' ? (
                      <div className="flex h-full w-full items-center justify-center bg-green-100 dark:bg-green-900/50">
                        <Gift className="h-10 w-10 text-green-600 dark:text-green-400" />
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
                                      <AlertDialogAction onClick={() => handleDeleteItem(item)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3 pb-3">
                        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <Badge variant="outline">Priority: {item.priority}</Badge>
                            {item.price && <span className="font-semibold text-primary">{item.price}</span>}
                            {item.neededBy && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Needed by {format(item.neededBy.toDate(), 'PPP')}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                  </div>
                </div>

                 <CardFooter className="bg-muted/50 p-3">
                   {isUpdatingItem === item.id ? (
                      <div className="flex w-full items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </div>
                   ) : item.status === 'available' ? (
                        <div className="flex w-full gap-2">
                            {!isOwnWishlist && user && (
                                <>
                                  <Button size="sm" className="flex-1" onClick={() => handleReserveItem(item.id)}>Reserve</Button>
                                  <Button variant='secondary' size="sm" className="flex-1" onClick={() => handleMarkAsPurchased(item.id, item.quantity)}>Mark as Purchased</Button>
                                </>
                            )}
                        </div>
                   ) : item.status === 'reserved' ? (
                       <div className="flex w-full items-center justify-between">
                           <p className="text-sm">Reserved by {item.reservedById === user?.uid ? 'you' : item.reservedBy}</p>
                           {(item.reservedById === user?.uid) ? (
                            <div className="flex gap-2">
                                <Button variant="destructive" size="sm" onClick={() => handleMarkAsAvailable(item.id, item.quantity)}>Cancel</Button>
                                <Button size="sm" onClick={() => handleMarkAsPurchased(item.id, item.quantity)}>Mark as Purchased</Button>
                            </div>
                           ) : isOwnWishlist ? (
                              <Button variant="ghost" size="sm" onClick={() => handleMarkAsAvailable(item.id, item.quantity)}>Mark as Available</Button>
                           ) : null }
                       </div>
                   ) : ( // Fulfilled
                       <div className="flex w-full items-center justify-between">
                           <p className="text-sm font-semibold text-green-600">Fulfilled!</p>
                           {isOwnWishlist && (
                             <Button variant="ghost" size="sm" onClick={() => handleMarkAsAvailable(item.id, item.quantity)}>Mark as Available</Button>
                           )}
                       </div>
                   )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

       <Separator />
       <div className="space-y-4">
        <h2 className="text-2xl font-bold">Replies ({wishlist.commentCount || 0})</h2>
        <CommentSection docId={wishlist.id} collectionType="wishlists" docAuthorId={wishlist.authorId} />
      </div>
    </div>
  );
}
