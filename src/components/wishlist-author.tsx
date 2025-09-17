
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';

interface AuthorProfile extends DocumentData {
  username: string;
  name: string;
}

const authorCache: { [key: string]: AuthorProfile } = {};

export function WishlistAuthor({ authorId }: { authorId: string }) {
  const [author, setAuthor] = useState<AuthorProfile | null>(authorCache[authorId] || null);
  const [loading, setLoading] = useState(!authorCache[authorId]);

  useEffect(() => {
    if (!authorId) return;

    if (authorCache[authorId]) {
      setAuthor(authorCache[authorId]);
      setLoading(false);
      return;
    }

    const fetchAuthor = async () => {
      setLoading(true);
      const userDocRef = doc(db, 'users', authorId);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const authorData = docSnap.data() as AuthorProfile;
        authorCache[authorId] = authorData; // Cache the result
        setAuthor(authorData);
      } else {
        setAuthor(null);
      }
      setLoading(false);
    };

    fetchAuthor();
  }, [authorId]);

  if (loading) {
    return <Skeleton className="h-5 w-32" />;
  }

  if (!author) {
    return (
      <p className="mb-4 text-sm text-muted-foreground">by an unknown author</p>
    );
  }

  return (
    <p className="mb-4 text-sm text-muted-foreground">
      by{' '}
      <Link href={`/dashboard/profile/${author.username}`} className="font-semibold text-primary hover:underline">
        {author.name}
      </Link>
    </p>
  );
}
