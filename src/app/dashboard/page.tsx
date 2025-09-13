
'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { FormEvent, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, DocumentData, where, doc, getDoc } from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns';
import { usePostInteraction } from '@/hooks/use-post-interaction';

interface Post extends DocumentData {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  imageUrl: string | null;
  aiHint: string | null;
  createdAt: any;
  likes: number;
  likedBy: string[];
}

function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const { hasLiked, isLiking, toggleLike } = usePostInteraction(post.id);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };
  
  const authorPhoto = post.authorAvatar || `https://picsum.photos/seed/${post.authorId}/200/200`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={authorPhoto} alt={post.authorName} />
          <AvatarFallback>
            {getInitials(post.authorName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-bold">{post.authorName}</p>
          <p className="text-sm text-muted-foreground">
            <Link href={`/dashboard/profile/${post.authorUsername}`}>@{post.authorUsername}</Link>{' '}
            · {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'just now'}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-2">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl">
            <Image
              src={post.imageUrl}
              alt={`Post by ${post.authorName}`}
              fill
              className="object-cover"
              data-ai-hint={post.aiHint ?? ''}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="p-2">
        <Button variant="ghost" className="flex items-center gap-2" onClick={toggleLike} disabled={isLiking || !user}>
          <Heart className={`h-5 w-5 ${hasLiked ? 'text-red-500 fill-current' : ''}`} />
          <span className="text-sm">{post.likes ?? 0}</span>
        </Button>
        <Button variant="ghost" className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">0</span>
        </Button>
        <Button variant="ghost" className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          <span className="text-sm">Share</span>
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function DashboardPage() {
  const { user } = useAuth();
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  // Effect 1: Get the list of users the current user follows
  useEffect(() => {
    if (!user) return;
    
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      const userData = doc.data();
      setFollowingIds(userData?.following || []);
    });

    return () => unsubscribe();
  }, [user]);
  
  // Effect 2: Fetch posts from the user and the users they follow
  useEffect(() => {
    if (!user) {
      setPosts([]);
      setLoadingPosts(false);
      return;
    }

    // Create the list of author IDs to fetch posts from.
    // It includes the current user's ID and all the IDs they follow.
    const authorsToFetch = [...followingIds, user.uid];

    // Firestore 'in' queries are limited to 30 items.
    // If you expect users to follow more, this would need pagination.
    // For now, this is a robust solution.
    if(authorsToFetch.length === 0) {
        setPosts([]);
        setLoadingPosts(false);
        return;
    }

    setLoadingPosts(true);

    const q = query(
      collection(db, "posts"),
      where("authorId", "in", authorsToFetch),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
      setLoadingPosts(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoadingPosts(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [user, followingIds]); // This effect re-runs if the user or their following list changes

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      await addDoc(collection(db, "posts"), {
        content: postContent,
        authorId: user.uid,
        authorName: userData?.name || user.displayName,
        authorUsername: userData?.username || user.email?.split('@')[0],
        authorAvatar: userData?.photoURL || user.photoURL,
        createdAt: serverTimestamp(),
        imageUrl: null,
        aiHint: null,
        likes: 0,
        likedBy: [],
        comments: 0,
      });
      setPostContent('');
    } catch (error) {
      console.error("Error creating post: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  const currentUserPhoto = user?.photoURL || (user ? `https://picsum.photos/seed/${user.uid}/200/200` : '');

  return (
    <div className="space-y-6">
      {/* Create Post Card */}
      <Card>
        <form onSubmit={handleCreatePost}>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
          <Avatar>
            <AvatarImage
              src={currentUserPhoto}
              alt={user?.displayName ?? 'User'}
            />
            <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
          </Avatar>
          <div className="w-full">
            <Textarea
              placeholder="What's on your mind? Share a wish or a success story!"
              className="border-0 bg-secondary/50 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={3}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              disabled={isSubmitting || !user}
            />
          </div>
        </CardHeader>
        <CardFooter className="flex justify-end p-4 pt-0">
          <Button type="submit" disabled={isSubmitting || !postContent.trim() || !user}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post
          </Button>
        </CardFooter>
        </form>
      </Card>

      {/* Feed Posts */}
      {loadingPosts ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="text-center p-8 text-muted-foreground">
          <h3 className="text-lg font-semibold">Your feed is looking empty!</h3>
          <p className="mt-2">Start by following some people or creating your first post.</p>
        </Card>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))
      )}
    </div>
  );
}
    
