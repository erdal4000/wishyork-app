'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export default function WishlistPage() {
  const wishlists = [
    {
      id: 1,
      title: 'KUŞ CENNETİNDEYİZ',
      category: 'Fashion',
      itemCount: 0,
      privacy: 'Public',
      imageUrl: 'https://picsum.photos/seed/kingfisher/1200/400',
      aiHint: 'kingfisher bird',
      likes: 0,
      comments: 0,
      saves: 0,
    },
    {
      id: 2,
      title: 'European Backpacking Trip',
      category: 'Travel',
      itemCount: 3,
      privacy: 'Friends',
      imageUrl: 'https://picsum.photos/seed/backpacking/1200/400',
      aiHint: 'europe backpacking',
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
        <Button>
          <Plus className="mr-2 h-5 w-5" />
          Create Wishlist
        </Button>
      </div>

      {wishlists.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          {wishlists.map((list) => (
             <Link href={`/dashboard/wishlist/${list.id}`} key={list.id}>
              <Card
                className="group w-full overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <CardHeader className="relative h-80 w-full p-0">
                  <Image
                    src={list.imageUrl}
                    alt={list.title}
                    data-ai-hint={list.aiHint}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <Badge variant="secondary" className="text-sm">
                      {list.category}
                    </Badge>
                  </div>
                  <div className="absolute right-4 top-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
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
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-headline text-2xl font-bold">
                        {list.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {list.itemCount} item types
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-muted-foreground">
                      {getPrivacyIcon(list.privacy)}
                      <span>{list.privacy}</span>
                    </div>
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
                  <div className="flex items-center">
                    <div className="flex -space-x-2 overflow-hidden">
                      <Avatar className="h-6 w-6 border-2 border-card">
                        <AvatarImage src="https://i.pravatar.cc/150?u=a" />
                        <AvatarFallback>A</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-6 w-6 border-2 border-card">
                        <AvatarImage src="https://i.pravatar.cc/150?u=b" />
                        <AvatarFallback>B</AvatarFallback>
                      </Avatar>
                    </div>
                    {list.likes > 2 && (
                       <span className="ml-2 text-xs">
                         + {list.likes - 2} others
                       </span>
                    )}
                  </div>
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
