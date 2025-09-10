
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
} from 'lucide-react';
import Link from 'next/link';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // Sadece yükleme bittiğinde ve kullanıcı yoksa yönlendirme yap
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  // Yükleme devam ediyorsa veya henüz kullanıcı bilgisi gelmediyse (ama hala yükleniyor olabilir),
  // tam sayfa bir iskelet yükleyici göster.
  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
           <div className="w-full h-full p-4 space-y-4">
              <header className="flex h-16 items-center justify-between border-b px-4 lg:px-8">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-md" />
                   <Skeleton className="h-6 w-32 hidden lg:block" />
                </div>
                 <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-md" />
                   <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </header>
              <div className="grid grid-cols-12 gap-8 container mx-auto">
                <div className="col-span-12 lg:col-span-8 xl:col-span-9">
                  <Skeleton className="h-[500px] w-full" />
                </div>
                <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
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

  // Yükleme bitti ve kullanıcı yoksa, bu bileşen bir şey render etmeden hemen yönlendirme yapar.
  // Ancak kullanıcı varsa, layout'u gösterir.
  if (!user) {
    return null; // Yönlendirme gerçekleşirken boş render et
  }


  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-secondary/30">
        <Sidebar
          variant="sidebar"
          collapsible="icon"
          className="hidden lg:flex"
        >
          <SidebarHeader>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 p-2 font-bold text-lg"
            >
              <Waves className="h-6 w-6 text-primary" />
              <span className="group-data-[collapsible=icon]:hidden">
                WishYork
              </span>
            </Link>
          </SidebarHeader>
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
                <Link href="/dashboard/profile">
                  <SidebarMenuButton asChild isActive={pathname === '/dashboard/profile'}>
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
        </Sidebar>

        <main className="flex-1">
          <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="hidden w-80 lg:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search everything..."
                    className="pl-10"
                  />
                </div>
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
                        src={user.photoURL ?? ''}
                        alt={user.displayName ?? 'User'}
                      />
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
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
          </header>
          <div className="container mx-auto max-w-screen-2xl px-4 py-8">
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-8 xl:col-span-9">
                {children}
              </div>
              <aside className="col-span-12 lg:col-span-4 xl:col-span-3">
                <div className="sticky top-20 space-y-6">
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
          </div>
        </main>

        <ScrollToTop />
      </div>
    </SidebarProvider>
  );
}
