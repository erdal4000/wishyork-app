'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { Skeleton } from '@/components/ui/skeleton';
import { WishlistAuthor } from '@/components/wishlist-author';

interface Wishlist {
  id: string;
  title: string;
  authorId: string;
  authorUsername: string;
  authorName?: string;
  category: string;
  progress: number;
  imageUrl: string;
  aiHint: string;
  createdAt: Timestamp;
}

function CauseCardSkeleton() {
    return (
        <Card className="flex flex-col overflow-hidden rounded-2xl shadow-lg">
            <Skeleton className="h-64 w-full" />
            <CardContent className="flex flex-1 flex-col p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="!mt-auto space-y-2 pt-4">
                     <div className="flex justify-between">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/5" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
                <Skeleton className="h-12 w-full" />
            </CardFooter>
        </Card>
    )
}

export default function ExploreCausesPage() {
  const [causes, setCauses] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'wishlists'),
      where('privacy', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(12)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCauses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wishlist)));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching public wishlists:", err);
      setError("Could not load causes. Please try again later.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <Header />
      <main className="flex-1">
        <section className="w-full bg-background py-12 shadow-sm">
          <div className="container mx-auto max-w-screen-xl px-4">
            <div className="text-center">
              <h1 className="font-headline text-4xl font-extrabold tracking-tighter md:text-5xl">
                Discover & Support a Cause
              </h1>
              <p className="mx-auto mt-4 max-w-[700px] text-lg text-muted-foreground">
                Browse through active campaigns and wishlists. Your contribution
                can make a world of difference.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-screen-xl px-4">
            {error && (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed h-64">
                    <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                    <h3 className="text-xl font-semibold text-destructive">Something went wrong</h3>
                    <p className="mt-2 text-muted-foreground">{error}</p>
                </div>
            )}
            {!error && (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <>
                            <CauseCardSkeleton />
                            <CauseCardSkeleton />
                            <CauseCardSkeleton />
                        </>
                    ) : causes.length > 0 ? (
                        causes.map((cause) => (
                            <Card
                            key={cause.id}
                            className="flex flex-col overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
                            >
                                <CardHeader className="relative p-0">
                                    <Badge className="absolute right-3 top-3 z-10">
                                    {cause.category}
                                    </Badge>
                                    <Image
                                    src={cause.imageUrl}
                                    alt={cause.title}
                                    data-ai-hint={cause.aiHint}
                                    width={400}
                                    height={250}
                                    className="h-64 w-full object-cover"
                                    />
                                </CardHeader>
                                <CardContent className="flex flex-1 flex-col p-6">
                                    <h3 className="font-headline mb-2 text-xl font-bold">
                                    {cause.title}
                                    </h3>
                                    
                                    <WishlistAuthor authorId={cause.authorId} />
                                    
                                    <div className="mb-1 mt-auto flex justify-between text-sm text-muted-foreground">
                                    <span>Progress</span>
                                    <span className="font-semibold text-foreground">
                                        {cause.progress}%
                                    </span>
                                    </div>
                                    <Progress value={cause.progress} className="h-2" />
                                </CardContent>
                                <CardFooter className="p-6 pt-0">
                                    {/* The original code linked to '#'. Let's make it link to the login page if the user is not logged in, or the detail page if they are. A more robust solution would check auth status. For now, a simple link to login is safer for a public page. */}
                                    <Button asChild className="w-full text-lg">
                                    <Link href={`/login?redirect=/dashboard/wishlist/${cause.id}`}>
                                        View Cause <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="lg:col-span-3">
                            <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
                            <h3 className="text-xl font-semibold">No public causes found.</h3>
                            <p className="mt-2 text-muted-foreground">
                                Check back later to see new public wishlists!
                            </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
