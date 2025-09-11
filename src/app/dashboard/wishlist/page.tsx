
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

export default function WishlistPage() {
  const wishlists = [
    {
      id: 1,
      title: 'KUŞ CENNETİNDEYİZ',
      category: 'Fashion',
      itemCount: 0,
      privacy: 'Friends',
      imageUrl: 'https://picsum.photos/seed/kingfisher/600/400',
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
      privacy: 'Public',
      imageUrl: 'https://picsum.photos/seed/backpacking/600/400',
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
      imageUrl: 'https://picsum.photos/seed/newhome/600/400',
      aiHint: 'modern apartment',
      likes: 45,
      comments: 1,
      saves: 18,
    },
  ];

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'Public':
        return <Users className="h-4 w-4" />;
      case 'Friends':
        return <Users className="h-4 w-4" />; // Using the same icon for now
      case 'Private':
        return <Lock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Wishlists</h1>
        <Button>
          <Plus className="mr-2 h-5 w-5" />
          Create Wishlist
        </Button>
      </div>

      {wishlists.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {wishlists.map((list) => (
            <Card key={list.id} className="group flex flex-col overflow-hidden">
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                    <Image
                        src={list.imageUrl}
                        alt={list.title}
                        data-ai-hint={list.aiHint}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
              <CardContent className="p-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{list.title}</h3>
                        <Badge variant="secondary">{list.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {getPrivacyIcon(list.privacy)}
                            <span>{list.privacy}</span>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                 </div>
                 <p className="mt-1 text-sm text-muted-foreground">{list.itemCount} item types</p>
              </CardContent>
              <CardFooter className="mt-auto flex items-center justify-between p-4 pt-0">
                <div className="flex gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Heart className="h-5 w-5" />
                        <span className="text-sm font-medium">{list.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">{list.comments}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Bookmark className="h-5 w-5" />
                        <span className="text-sm font-medium">{list.saves}</span>
                    </div>
                </div>
                 <Button variant="ghost" size="icon">
                    <Share2 className="h-5 w-5" />
                </Button>
              </CardFooter>
            </Card>
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
