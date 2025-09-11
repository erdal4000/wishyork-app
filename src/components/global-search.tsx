"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Search, List, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  DocumentData,
  orderBy,
} from 'firebase/firestore';
import debounce from 'lodash.debounce';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials } from '@/lib/utils';

interface SearchResult {
  users: DocumentData[];
  wishlists: DocumentData[];
}

export function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ users: [], wishlists: [] });
  const [loading, setLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const performSearch = async (queryText: string) => {
    const trimmedQuery = queryText.trim();
    if (trimmedQuery.length < 1) {
      setResults({ users: [], wishlists: [] });
      setLoading(false);
      setPopoverOpen(false);
      return;
    }

    setLoading(true);
    setPopoverOpen(true);
    
    const searchText = trimmedQuery.startsWith('@') ? trimmedQuery.substring(1) : trimmedQuery;
    const lowerCaseQuery = searchText.toLowerCase();

    try {
      // --- Users Query ---
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('username'), // Using username which is already lowercase
        where('username', '>=', lowerCaseQuery),
        where('username', '<=', lowerCaseQuery + '\uf8ff'),
        limit(5)
      );
      
      // --- Wishlists Query ---
      const wishlistsQuery = query(
        collection(db, 'wishlists'),
        orderBy('title_lowercase'),
        where('title_lowercase', '>=', lowerCaseQuery),
        where('title_lowercase', '<=', lowerCaseQuery + '\uf8ff'),
        where('privacy', '==', 'public'),
        limit(5)
      );


      const [userSnap, wishlistSnap] = await Promise.all([
        getDocs(usersQuery),
        getDocs(wishlistsQuery),
      ]);

      const users = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const wishlists = wishlistSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setResults({ users, wishlists });
    } catch (error) {
      console.error('Error during search:', error);
      setResults({ users: [], wishlists: [] });
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(performSearch, 300), []);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const handleSelect = (path: string) => {
    setPopoverOpen(false);
    setSearchQuery('');
    router.push(path);
  };
  
  const handleBlur = () => {
    // We delay closing the popover slightly to allow click events on items to register
    setTimeout(() => {
        if (!inputRef.current?.matches(':focus-within')) {
           setPopoverOpen(false);
        }
    }, 100);
  }

  const hasResults = results.users.length > 0 || results.wishlists.length > 0;

  return (
    <div onBlur={handleBlur}>
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search users, wishlists..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setPopoverOpen(searchQuery.length > 0)}
          />
        </div>
      </PopoverAnchor>
      {popoverOpen && (
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()} // Prevents focus stealing
        >
          <Command shouldFilter={false}>
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !hasResults && searchQuery ? (
                <CommandEmpty>No results found for "{searchQuery}".</CommandEmpty>
              ) : null}
              
              {results.users.length > 0 && (
                <CommandGroup heading="Users">
                  {results.users.map((user) => (
                    <CommandItem key={user.id} onSelect={() => handleSelect(`/dashboard/profile/${user.username}`)}>
                      <Avatar className="mr-2 h-6 w-6">
                        <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">@{user.username}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {hasResults && results.users.length > 0 && results.wishlists.length > 0 && <CommandSeparator />}

              {results.wishlists.length > 0 && (
                <CommandGroup heading="Wishlists">
                  {results.wishlists.map((wishlist) => (
                    <CommandItem key={wishlist.id} onSelect={() => handleSelect(`/dashboard/wishlist/${wishlist.id}`)}>
                      <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-sm bg-secondary">
                        <List className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span>{wishlist.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground">by @{wishlist.authorUsername}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
    </div>
  );
}
