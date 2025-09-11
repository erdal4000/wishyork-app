'use client';

import { useParams } from 'next/navigation';

export default function WishlistDetailPage() {
  const params = useParams();
  const { id } = params;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Wishlist Detayları
      </h1>
      <p className="text-muted-foreground">
        Burası ID'si <span className="font-bold text-primary">{id}</span> olan wishlist'in ayrıntı sayfası olacak.
      </p>
       <div className="p-8 border-2 border-dashed rounded-lg text-center">
            <p className="text-muted-foreground">İçerik yakında eklenecek...</p>
       </div>
    </div>
  );
}
