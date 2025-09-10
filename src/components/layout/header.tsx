'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Waves, Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { ThemeToggle } from '../theme-toggle';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Waves className="h-6 w-6 text-primary" />
          <span className="font-bold">WishYork</span>
        </Link>
        <div className="hidden items-center space-x-2 md:flex">
          <ThemeToggle />
          {loading ? null : user ? (
            <Button variant="ghost" onClick={handleLogout}>Log Out</Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="sr-only">
                <SheetTitle>Mobile Menu</SheetTitle>
                <SheetDescription>
                  Navigation links for the WishYork application.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-6">
                {loading ? null : user ? (
                   <SheetClose asChild>
                     <Button variant="ghost" onClick={handleLogout} className="w-full">
                       Log Out
                     </Button>
                   </SheetClose>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link href="/login" className="text-center">
                        <Button variant="ghost" className="w-full">
                          Log In
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/signup" className="text-center">
                        <Button className="w-full">Sign Up</Button>
                      </Link>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
