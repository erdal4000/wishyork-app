'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  MoreHorizontal,
  Plus,
  Users,
  Lock,
  Edit,
  Trash2,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Globe,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { CreateWishlistDialog } from '@/components/create-wishlist-dialog';

export default function WishlistPage() {
  const wishlists = [
    {
      id: 1,
      title: 'KINGFISHER PARADISE',
      category: 'Fashion',
      itemCount: 0,
      privacy: 'Public',
      imageUrl: 'https://picsum.photos/seed/kingfisher/1200/400',
      aiHint: 'kingfisher bird',
      progress: 0,
      unitsFulfilled: 0,
      totalUnits: 10,
      likes: 0,
      comments: 0,
      saves: 0,
    },
    {
      id: 2,
      title: 'European Backpacking Trip',
      category: 'Travel',
      itemCount: 8,
      privacy: 'Friends',
      imageUrl: 'https://picsum.photos/seed/backpacking/1200/400',
      aiHint: 'europe backpacking',
      progress: 65,
      unitsFulfilled: 13,
      totalUnits: 20,
      likes: 12,
      comments: 4,
      saves: 8,
    },
    {
      id: 3,
      title: 'New Home Essentials',
      category: 'Home',
      itemCount: 24,
      privacy: 'Private',
      imageUrl: 'https://picsum.photos/seed/newhome/1200/400',
      aiHint: 'modern apartment',
      progress: 43,
      unitsFulfilled: 6,
      totalUnits: 14,
      likes: 45,
      comments: 1,
      saves: 18,
    },
  ];

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'Public':
        return <Globe className="h-4 w-4" />;
      case 'Friends':
        return <Users className="h-4 w-4" />;
      case 'Private':
        return <Lock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Wishlists</h1>
        <CreateWishlistDialog>
          <Button>
            <Plus className="mr-2 h-5 w-5" />
            Create Wishlist
          </Button>
        </CreateWishlistDialog>
      </div>

      {wishlists.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          {wishlists.map((list) => (
             <Link href={`/dashboard/wishlist/${list.id}`} key={list.id} className="block group">
              <Card
                className="w-full overflow-hidden rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-xl"
              >
                <CardHeader className="relative h-80 w-full p-0">
                  <Image
                    src={list.imageUrl}
                    alt={list.title}
                    data-ai-hint={list.aiHint}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <h3 className="font-headline text-2xl font-bold">
                            {list.title}
                        </h3>
                        <Badge variant="secondary" className="text-sm">
                            {list.category}
                        </Badge>
                     </div>
                     <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1.5 pl-2 pr-3 py-1.5 text-muted-foreground">
                            {getPrivacyIcon(list.privacy)}
                            <span>{list.privacy}</span>
                        </Badge>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={(e) => e.preventDefault()}
                            >
                            <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                  </div>
                   <p className="mt-2 text-sm text-muted-foreground">
                        {list.itemCount} item types
                   </p>
                   <div className="mt-4">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                            <span>{list.unitsFulfilled} of {list.totalUnits} units</span>
                            <span>{list.progress}%</span>
                        </div>
                        <Progress value={list.progress} className="h-2" />
                   </div>
                </CardContent>
                <Separator />
                <CardFooter className="flex justify-between p-4 text-sm text-muted-foreground">
                  <div className="flex gap-6">
                    <div className="flex items-center gap-1.5">
                      <Heart className="h-5 w-5" />
                      <span className="font-medium">{list.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="h-5 w-5" />
                      <span className="font-medium">{list.comments}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bookmark className="h-5 w-5" />
                      <span className="font-medium">{list.saves}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => e.preventDefault()}>
                      <Share2 className="h-5 w-5" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <h3 className="text-xl font-semibold">No wishlists yet!</h3>
          <p className="mt-2 text-muted-foreground">
            Click "Create new wishlist" to get started.
          </p>
        </div>
      )}
    </div>
  );
}
