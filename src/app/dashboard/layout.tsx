'use client';

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Bell,
  Home,
  Mail,
  Search,
  Settings,
  User,
  Waves,
  Bookmark,
  ListTodo,
  Sparkles,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateWishlistDialog } from '@/components/create-wishlist-dialog';
import { GlobalSearch } from '@/components/global-search';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { getInitials } from '@/lib/utils';


interface UserProfile extends DocumentData {
  username?: string;
  name?: string;
  photoURL?: string;
}

function FullPageLoader() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
           <div className="w-full h-full p-4 space-y-4">
              <div className="flex h-16 items-center justify-between border-b px-4 lg:px-8">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-md" />
                   <Skeleton className="h-6 w-32 hidden lg:block" />
                </div>
                 <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-md" />
                   <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-12 gap-8 container mx-auto px-4">
                <div className="col-span-2 hidden lg:block">
                    <div className="space-y-2">
                       {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-7 xl:col-span-7">
                  <Skeleton className="h-[600px] w-full" />
                </div>
                <aside className="hidden lg:block lg:col-span-3 xl:col-span-3">
                  <div className="space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </aside>
              </div>
           </div>
        </div>
    );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  if (loading || !user) {
    return <FullPageLoader />;
  }

  const userProfilePath = userProfile?.username ? `/dashboard/profile/${userProfile.username}` : '#';

  const handleLogout = async () => {
    await auth.signOut();
    // No need to push, AuthProvider will handle redirect via useEffect
  };
  
  const displayName = userProfile?.name || user.displayName;
  const photoURL = userProfile?.photoURL || user.photoURL;

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-secondary/30">
        <header className="sticky top-0 z-40 w-full border-b bg-background">
          <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 font-bold lg:flex"
              >
                <Waves className="h-6 w-6 text-primary" />
                <span>WishYork</span>
              </Link>
            </div>
            <div className="flex flex-1 justify-center px-4 lg:px-8">
              <div className="w-full max-w-xl">
                <GlobalSearch />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                  >
                    <Avatar>
                      <AvatarImage
                        src={photoURL ?? undefined}
                        alt={displayName ?? 'User'}
                      />
                      <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={userProfilePath}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="container mx-auto flex max-w-screen-2xl gap-8 px-4">
          <Sidebar
            variant="sidebar"
            collapsible="icon"
            className="sticky top-16 hidden h-[calc(100vh-4rem)] lg:flex"
          >
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/dashboard">
                    <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                      <span>
                        <Home />
                        Home
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/dashboard/wishlist">
                    <SidebarMenuButton asChild isActive={pathname === '/dashboard/wishlist'}>
                      <span>
                        <ListTodo />
                        My Wishlist
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/dashboard/explore">
                    <SidebarMenuButton asChild isActive={pathname === '/dashboard/explore'}>
                      <span>
                        <Search />
                        Explore
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/dashboard/notifications">
                    <SidebarMenuButton asChild isActive={pathname === '/dashboard/notifications'}>
                      <span>
                        <Bell />
                        Notifications
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/dashboard/bookmarks">
                    <SidebarMenuButton asChild isActive={pathname === '/dashboard/bookmarks'}>
                      <span>
                        <Bookmark />
                        Bookmarks
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/dashboard/inspiration">
                    <SidebarMenuButton asChild isActive={pathname === '/dashboard/inspiration'}>
                      <span>
                        <Sparkles />
                        Inspiration Box
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/dashboard/messages">
                    <SidebarMenuButton asChild isActive={pathname === '/dashboard/messages'}>
                      <span>
                        <Mail />
                        Messages
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href={userProfilePath}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/profile')}>
                      <span>
                        <User />
                        Profile
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/dashboard/settings">
                    <SidebarMenuButton asChild isActive={pathname === '/dashboard/settings'}>
                      <span>
                        <Settings />
                        Settings
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
             <SidebarFooter>
                <CreateWishlistDialog>
                   <Button
                    variant="default"
                    className="w-full justify-center group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden ml-2">
                      Create Wishlist
                    </span>
                  </Button>
                </CreateWishlistDialog>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 py-8">
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-8">
                {children}
              </div>
              <aside className="col-span-12 lg:col-span-4">
                <div className="sticky top-24 space-y-6">
                  <div className="rounded-xl border bg-card p-4 shadow">
                    <h3 className="font-bold">Trending Wishlists</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Placeholder for trending content.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-4 shadow">
                    <h3 className="font-bold">Who to follow</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Placeholder for user suggestions.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </main>
        </div>

        <ScrollToTop />
      </div>
    </SidebarProvider>
  );
}
