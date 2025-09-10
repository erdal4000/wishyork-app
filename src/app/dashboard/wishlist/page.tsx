
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function WishlistPage() {
  const wishlists = [
    {
      id: 1,
      title: 'Birthday Wishes 🎂',
      description: 'A collection of things I\'d love for my upcoming birthday!',
      itemCount: 8,
      privacy: 'Public',
    },
    {
      id: 2,
      title: 'European Backpacking Trip',
      description: 'Saving up for a dream trip across Europe. Any contribution helps!',
      itemCount: 3,
      privacy: 'Friends',
    },
    {
      id: 3,
      title: 'New Home Essentials',
      description: 'Things we need to furnish our new apartment.',
      itemCount: 24,
      privacy: 'Private',
    },
  ];

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'Public':
        return <Users className="h-4 w-4" />;
      case 'Friends':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'Private':
        return <Lock className="h-4 w-4 text-red-500" />;
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
          Create new wishlist
        </Button>
      </div>

      {wishlists.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {wishlists.map((list) => (
            <Card key={list.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="font-headline text-2xl">
                    {list.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                <CardDescription>{list.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {/* Potentially show item previews here in the future */}
              </CardContent>
              <CardFooter className="flex justify-between text-sm text-muted-foreground">
                <span>{list.itemCount} items</span>
                <div className="flex items-center gap-2">
                  {getPrivacyIcon(list.privacy)}
                  <span>{list.privacy}</span>
                </div>
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
