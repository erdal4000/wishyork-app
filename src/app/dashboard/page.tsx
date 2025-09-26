
'use client';

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, DocumentData, Timestamp, doc, getDoc, where, addDoc, serverTimestamp, deleteDoc, Unsubscribe, limit, getDocs } from 'firebase/firestore';
import { ref, deleteObject } from "firebase/storage";
import { useAuth } from '@/context/auth-context';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2, Bookmark, Repeat2, AlertTriangle, Image as ImageIcon, XCircle, Trash2, Package, Globe, Users, Lock, Edit } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { usePostInteraction } from '@/hooks/use-post-interaction';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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
} from "@/components/ui/alert-dialog";
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/use-toast';
import { useBookmark } from '@/hooks/use-bookmark';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Post extends DocumentData {
  id: string;
  type: 'post'; 
  authorId: string;
  createdAt: Timestamp;
  content?: string;
  imageUrl: string | null;
  aiHint: string | null;
  likes: number;
  commentCount: number;
}

interface Wishlist extends DocumentData {
  id: string;
  type: 'wishlist';
  title: string;
  authorId: string;
  imageUrl: string;
  aiHint: string;
  category: string;
  progress: number;
  itemCount: number;
  privacy: 'public' | 'friends' | 'private';
  likes: number;
  commentCount: number;
  saves: number;
  createdAt: Timestamp;
  unitsFulfilled: number;
  totalUnits: number;
}

type FeedItem = Post | Wishlist;


interface UserProfile extends DocumentData {
  name: string;
  username: string;
  photoURL?: string;
}

const userProfilesCache: { [key: string]: UserProfile } = {};

const useAuthorProfile = (authorId: string) => {
    const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(userProfilesCache[authorId] || null);
    const [loadingProfile, setLoadingProfile] = useState(!userProfilesCache[authorId]);

    useEffect(() => {
        if (!authorId) return;
        if (userProfilesCache[authorId]) {
            setAuthorProfile(userProfilesCache[authorId]);
            setLoadingProfile(false);
            return;
        }

        setLoadingProfile(true);
        const userDocRef = doc(db, 'users', authorId);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const profileData = docSnap.data() as UserProfile;
                userProfilesCache[authorId] = profileData;
                setAuthorProfile(profileData);
            } else {
                setAuthorProfile(null);
            }
            setLoadingProfile(false);
        }, (error) => {
            console.error(`Failed to fetch profile for ${authorId}`, error);
            setLoadingProfile(false);
        });

        return () => unsubscribe();
    }, [authorId]);

    return { authorProfile, loadingProfile };
};


function FeedCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="aspect-video w-full rounded-xl" />
      </CardContent>
      <CardFooter className="p-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20 ml-2" />
        <Skeleton className="h-8 w-24 ml-2" />
      </CardFooter>
    </Card>
  );
}

function PostCard({ item }: { item: Post }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { authorProfile, loadingProfile } = useAuthorProfile(item.authorId);
  const { hasLiked, isLiking, toggleLike } = usePostInteraction(item.id, 'post');
  const { isBookmarked, isToggling: isTogglingBookmark, toggleBookmark } = useBookmark({
    refId: item.id,
    type: 'post',
    title: item.content?.substring(0, 50),
    imageUrl: item.imageUrl,
    authorName: authorProfile?.name,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const itemDate = item.createdAt?.toDate();
  const timeAgo = itemDate ? formatDistanceToNow(itemDate, { addSuffix: true }) : 'just now';

  const isOwnItem = user?.uid === item.authorId;

  const handleDeletePost = async () => {
    if (!isOwnItem) return;
    setIsDeleting(true);

    try {
        await deleteDoc(doc(db, 'posts', item.id));

        if (item.imageUrl) {
            try {
                const imageRef = ref(storage, item.imageUrl);
                await deleteObject(imageRef);
            } catch (storageError: any) {
                if (storageError.code !== 'storage/object-not-found') {
                    throw storageError; 
                }
                console.warn("Storage object not found during delete, but proceeding:", item.imageUrl);
            }
        }

        toast({ title: "Post Deleted", description: "Your post has been successfully removed." });
    } catch (error: any) {
        console.error("Error deleting post:", error);
        toast({ title: "Error", description: "Could not delete the post. Please try again.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };
  
  if (loadingProfile) {
      return <FeedCardSkeleton />;
  }

  if (!authorProfile) {
      return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={authorProfile.photoURL} alt={authorProfile.name} />
          <AvatarFallback>{getInitials(authorProfile.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-bold">{authorProfile.name}</p>
          <p className="text-sm text-muted-foreground">
            <Link href={`/dashboard/profile/${authorProfile.username}`}>@{authorProfile.username}</Link> · {timeAgo}
          </p>
        </div>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isDeleting}>
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                 {isOwnItem ? (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Post
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this post.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={handleDeletePost} 
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 ) : (
                    <DropdownMenuItem>
                       <AlertTriangle className="mr-2 h-4 w-4" />
                        Report
                    </DropdownMenuItem>
                 )}
            </DropdownMenuContent>
         </DropdownMenu>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {item.content && <p className="whitespace-pre-wrap">{item.content}</p>}

        {item.imageUrl && (
          <Link href={`/dashboard/post/${item.id}`} className="mt-4 block">
            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl border">
              <Image
                src={item.imageUrl}
                alt={`Image for post`}
                fill
                className="object-cover"
                data-ai-hint={item.aiHint ?? ''}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </Link>
        )}
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
            <span className="text-sm pr-2">{item.commentCount ?? 0}</span>

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
            <span className={`text-sm pr-2 ${hasLiked ? 'text-red-500' : ''}`}>{item.likes ?? 0}</span>
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
  );
}

function WishlistCard({ item }: { item: Wishlist }) {
    const { user } = useAuth();
    const { authorProfile, loadingProfile } = useAuthorProfile(item.authorId);
    const { isBookmarked, isToggling, toggleBookmark } = useBookmark({
      refId: item.id,
      type: 'cause',
      title: item.title,
      imageUrl: item.imageUrl,
      authorName: authorProfile?.name,
    });
    const { hasLiked, isLiking, toggleLike } = usePostInteraction(item.id, 'wishlist');
    
    if (loadingProfile) {
      return <FeedCardSkeleton />;
    }
  
    if (!authorProfile) {
      return null;
    }
  
    const itemDate = item.createdAt?.toDate();
    const timeAgo = itemDate ? formatDistanceToNow(itemDate, { addSuffix: true }) : 'just now';

    const getPrivacyIcon = (privacy: string) => {
        switch (privacy) {
            case 'public': return <Globe className="h-3 w-3" />;
            case 'friends': return <Users className="h-3 w-3" />;
            case 'private': return <Lock className="h-3 w-3" />;
            default: return null;
        }
    };
    
    return (
        <Card>
             <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Avatar>
                <AvatarImage src={authorProfile.photoURL} alt={authorProfile.name} />
                <AvatarFallback>{getInitials(authorProfile.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                <p className="font-bold">{authorProfile.name}</p>
                <p className="text-sm text-muted-foreground">
                    <Link href={`/dashboard/profile/${authorProfile.username}`}>@{authorProfile.username}</Link> · {timeAgo}
                </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button>
                    </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                         <DropdownMenuItem>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Report
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="px-0 pb-0">
                <Link href={`/dashboard/wishlist/${item.id}`} className="block hover:bg-muted/30 transition-colors">
                    <div className="px-4 pb-4">
                         <p className="text-muted-foreground text-sm mb-2">shared a wishlist:</p>
                         <h3 className="font-bold text-lg">{item.title}</h3>
                    </div>
                    <div className="relative aspect-video w-full">
                        <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                            data-ai-hint={item.aiHint ?? ''}
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4 text-muted-foreground">
                                <Badge variant="outline" className="capitalize gap-1.5 pl-2 pr-3 py-1 text-muted-foreground">
                                    {getPrivacyIcon(item.privacy)}
                                    <span>{item.privacy}</span>
                                </Badge>
                                <Badge variant="secondary">{item.category}</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground font-medium">{item.itemCount || 0} items</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>{item.progress || 0}%</span>
                            </div>
                            <Progress value={item.progress || 0} className="h-2" />
                        </div>
                    </div>
                </Link>
            </CardContent>
            <CardFooter className="flex justify-between p-2">
                <TooltipProvider>
                    <div className="flex items-center text-muted-foreground">
                        <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><MessageCircle className="h-5 w-5" /></Button></TooltipTrigger>
                            <TooltipContent className="text-xs"><p>Reply</p></TooltipContent>
                        </Tooltip>
                        <span className="text-sm pr-2">{item.commentCount ?? 0}</span>

                        <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><Repeat2 className="h-5 w-5" /></Button></TooltipTrigger>
                            <TooltipContent className="text-xs"><p>Repost</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleLike} disabled={isLiking || !user}><Heart className={`h-5 w-5 ${hasLiked ? 'text-red-500 fill-current' : ''}`} /></Button></TooltipTrigger>
                            <TooltipContent className="text-xs"><p>Like</p></TooltipContent>
                        </Tooltip>
                        <span className={`text-sm pr-2 ${hasLiked ? 'text-red-500' : ''}`}>{item.likes ?? 0}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => { e.preventDefault(); toggleBookmark(); }} disabled={isToggling || !user}><Bookmark className={`h-5 w-5 ${isBookmarked ? 'text-yellow-500 fill-current' : ''}`} /></Button></TooltipTrigger>
                            <TooltipContent className="text-xs"><p>Bookmark</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9"><Share2 className="h-5 w-5" /></Button></TooltipTrigger>
                            <TooltipContent className="text-xs"><p>Share</p></TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </CardFooter>
        </Card>
    );
}

function FeedCard({ item }: { item: FeedItem }) {
  if (item.type === 'post') {
    return <PostCard item={item} />;
  }
  if (item.type === 'wishlist') {
    return <WishlistCard item={item} />;
  }
  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [postContent, setPostContent] = useState('');
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const imageUpload = useImageUpload();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPostImageFile(file);
      setPostImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setPostImageFile(null);
    setPostImagePreview(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = "";
    }
  };

  const handleCreatePost = async () => {
    if (!user || (!postContent.trim() && !postImageFile)) {
      toast({ title: "Cannot post", description: "Please write something or add an image.", variant: "destructive" });
      return;
    }

    setIsSubmittingPost(true);
    let imageUrl: string | null = null;
    let aiHint: string | null = null;

    try {
      if (postImageFile) {
        const path = `post-images/${user.uid}/${Date.now()}_${postImageFile.name}`;
        imageUrl = await imageUpload.uploadImage(postImageFile, path);
        aiHint = postContent.split(' ').slice(0, 2).join(' ') || 'user post';
      }

      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        content: postContent,
        imageUrl: imageUrl,
        aiHint: aiHint,
        createdAt: serverTimestamp(),
        type: 'post',
        likes: 0,
        likedBy: [],
        commentCount: 0,
      });
      
      setPostContent('');
      removeImage();
      toast({ title: "Success!", description: "Your post has been published." });

    } catch (error) {
      console.error("Error creating post:", error);
      toast({ title: "Error", description: "Could not create post. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmittingPost(false);
    }
  };
  
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribes: Unsubscribe[] = [];

    // Query for public wishlists
    const wishlistsQuery = query(
      collection(db, 'wishlists'),
      where('privacy', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const wishlistsUnsub = onSnapshot(wishlistsQuery, 
      (snapshot) => {
        const lists = snapshot.docs.map(doc => ({ id: doc.id, type: 'wishlist', ...doc.data() } as Wishlist));
        setFeedItems(currentItems => {
          const otherItems = currentItems.filter(item => item.type !== 'wishlist');
          const combined = [...lists, ...otherItems].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          return combined;
        });
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching public wishlists:", err);
        setError("Failed to load wishlists.");
        setLoading(false);
      }
    );
    unsubscribes.push(wishlistsUnsub);

    // Query for all posts
    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const postsUnsub = onSnapshot(postsQuery, 
      (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, type: 'post', ...doc.data() } as Post));
        setFeedItems(currentItems => {
          const otherItems = currentItems.filter(item => item.type !== 'post');
          const combined = [...posts, ...otherItems].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          return combined;
        });
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching posts:", err);
        setError("Failed to load posts.");
        setLoading(false);
      }
    );
    unsubscribes.push(postsUnsub);
  
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
          <Avatar>
            <AvatarImage src={userProfile?.photoURL || user?.photoURL || undefined} />
            <AvatarFallback>{user ? getInitials(userProfile?.name || user.displayName) : '??'}</AvatarFallback>
          </Avatar>
          <div className="w-full">
            <Textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What's on your mind? Share a wish or a success story!"
              className="border-0 bg-secondary/50 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={3}
              disabled={isSubmittingPost}
            />
            {postImagePreview && (
              <div className="relative mt-4">
                <Image src={postImagePreview} alt="Image preview" width={500} height={281} className="w-full h-auto rounded-lg" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={removeImage} disabled={isSubmittingPost}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
             {imageUpload.uploading && (
                 <div className="mt-2">
                    <Progress value={imageUpload.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">Uploading image...</p>
                </div>
            )}
          </div>
        </CardHeader>
        <CardFooter className="flex justify-between items-center p-4 pt-0">
          <div>
            <label htmlFor="image-upload" className="cursor-pointer">
              <Button variant="ghost" size="icon" asChild>
                <span>
                  <ImageIcon className="text-muted-foreground" />
                  <input id="image-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleImageSelect} disabled={isSubmittingPost} />
                </span>
              </Button>
            </label>
          </div>
          <Button onClick={handleCreatePost} disabled={isSubmittingPost || (!postContent.trim() && !postImageFile)}>
            {isSubmittingPost && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post
          </Button>
        </CardFooter>
      </Card>
      
      {loading && (
        <div className="space-y-6">
          <FeedCardSkeleton />
          <FeedCardSkeleton />
        </div>
      )}

      {!loading && error && (
        <Card className="p-8 text-center text-muted-foreground">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive">Feed Unavailable</h3>
          <p className="mt-2">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {feedItems.length > 0 ? (
            feedItems.map(item => <FeedCard key={`${item.type}-${item.id}`} item={item} />)
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <h3 className="text-lg font-semibold">It's quiet in here...</h3>
              <p className="mt-2">Follow others to see their activity, or explore public wishlists.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
