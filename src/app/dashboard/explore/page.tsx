
'use server';

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

// This function is now simplified to ensure Firestore throws a visible error for a missing index.
async function getPublicWishlists(): Promise<Wishlist[]> {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);

    const wishlistsRef = adminDb.collection('wishlists');
    // This query requires a composite index. If it's missing, Firestore will error out.
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
    console.error("CRITICAL: getPublicWishlists fonksiyonunda bir hata oluştu:", error);
    // Hata durumunda sayfanın donmasını engellemek için boş bir dizi döndür.
    // Bu, terminalde hatayı görmemizi sağlar.
    return [];
  }
}

export default async function DashboardExplorePage() {
  const causes = await getPublicWishlists();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Explore Causes</h1>
      {causes.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-2">
          {causes.map((cause) => (
            <Card
              key={cause.id}
              className="flex flex-col overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <Link href={`/dashboard/wishlist/${cause.id}`} className="flex flex-1 flex-col">
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
                      <span className="font-semibold text-primary hover:underline">
                        {cause.authorName}
                      </span>
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
                    <span>
                      View Cause <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                  </Button>
                </CardFooter>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <h3 className="text-xl font-semibold">No public causes found.</h3>
          <p className="mt-2 text-muted-foreground">
            Be the first to create a public wishlist!
          </p>
        </div>
      )}
    </div>
  );
}
