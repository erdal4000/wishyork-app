
'use server';

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
import { ArrowRight } from 'lucide-react';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

interface Wishlist {
  id: string;
  title: string;
  authorId: string;
  authorUsername: string;
  authorName: string;
  category: string;
  progress: number;
  imageUrl: string;
  aiHint: string;
  createdAt: Timestamp;
}

async function getPublicWishlists(): Promise<Wishlist[]> {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);

    const wishlistsRef = adminDb.collection('wishlists');
    const q = wishlistsRef
      .where('privacy', '==', 'public')
      .orderBy('createdAt', 'desc')
      .limit(12);

    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return [];
    }

    const authorIds = [...new Set(querySnapshot.docs.map(doc => doc.data().authorId))];
    if (authorIds.length === 0) {
        return [];
    }

    const authorDocsSnapshot = await adminDb.collection('users').where('uid', 'in', authorIds).get();
    const authorMap = new Map(authorDocsSnapshot.docs.map(doc => [doc.id, doc.data()]));

    const wishlists = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const authorData = authorMap.get(data.authorId);
      return {
        id: doc.id,
        title: data.title,
        authorId: data.authorId,
        authorUsername: data.authorUsername,
        authorName: authorData?.name || data.authorUsername || 'Unknown User',
        category: data.category,
        progress: data.progress || 0,
        imageUrl: data.imageUrl,
        aiHint: data.aiHint,
        createdAt: data.createdAt,
      } as Wishlist;
    });

    return wishlists;
  } catch (error) {
    console.error("CRITICAL: getPublicWishlists (explore-causes page) fonksiyonunda bir hata oluştu:", error);
    // Hata durumunda sayfanın donmasını engellemek için boş bir dizi döndür.
    // Bu, terminalde hatayı görmemizi sağlar.
    return [];
  }
}


export default async function ExploreCausesPage() {
  const causes = await getPublicWishlists();

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
            {causes.length > 0 ? (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {causes.map((cause) => (
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
                        <p className="mb-4 text-sm text-muted-foreground">
                        by{' '}
                        <Link href="#" className="font-semibold text-primary hover:underline">
                            {cause.authorName}
                        </Link>
                        </p>
                        <div className="mb-1 mt-auto flex justify-between text-sm text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-semibold text-foreground">
                            {cause.progress}%
                        </span>
                        </div>
                        <Progress value={cause.progress} className="h-2" />
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                        <Button asChild className="w-full text-lg">
                        <Link href="#">
                            View Cause <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                        </Button>
                    </CardFooter>
                    </Card>
                ))}
                </div>
            ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
                <h3 className="text-xl font-semibold">No public causes found.</h3>
                <p className="mt-2 text-muted-foreground">
                    Check back later to see new public wishlists!
                </p>
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
