'use client';

import { useParams } from 'next/navigation';

export default function WishlistDetailPage() {
  const params = useParams();
  const { id } = params;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Wishlist Details
      </h1>
      <p className="text-muted-foreground">
        This will be the detail page for the wishlist with ID: <span className="font-bold text-primary">{id}</span>
      </p>
       <div className="p-8 border-2 border-dashed rounded-lg text-center">
            <p className="text-muted-foreground">Content to be added soon...</p>
       </div>
    </div>
  );
}