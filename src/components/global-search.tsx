
"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { Search, User, List, Loader2 } from 'lucide-react';
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


  const performSearch = async (queryText: string) => {
    if (queryText.trim() === '') {
      setResults({ users: [], wishlists: [] });
      setLoading(false);
      return;
    }

    setLoading(true);

    const lowerCaseQuery = queryText.toLowerCase();

    try {
      // Search for users by username
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('username'),
        where('username', '>=', lowerCaseQuery),
        where('username', '<=', lowerCaseQuery + '\uf8ff'),
        limit(5)
      );

      // Search for wishlists by title (case-insensitive)
      const wishlistsQueryLowercase = query(
        collection(db, 'wishlists'),
        orderBy('title_lowercase'),
        where('title_lowercase', '>=', lowerCaseQuery),
        where('title_lowercase', '<=', lowerCaseQuery + '\uf8ff'),
        where('privacy', '==', 'public'),
        limit(5)
      );


      const [userSnap, wishlistSnap] = await Promise.all([
        getDocs(usersQuery),
        getDocs(wishlistsQueryLowercase),
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
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce(performSearch, 300), []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      debouncedSearch(searchQuery);
    } else {
      setResults({ users: [], wishlists: [] });
      debouncedSearch.cancel();
    }
  }, [searchQuery, debouncedSearch]);
  
  useEffect(() => {
    if (searchQuery.trim().length > 0 && !popoverOpen) {
      setPopoverOpen(true);
    } else if (searchQuery.trim().length === 0 && popoverOpen) {
      setPopoverOpen(false);
    }
  }, [searchQuery, popoverOpen]);


  const handleSelect = (path: string) => {
    setPopoverOpen(false);
    setSearchQuery('');
    router.push(path);
  };

  const hasResults = results.users.length > 0 || results.wishlists.length > 0;

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users, wishlists..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if(searchQuery) setPopoverOpen(true)}}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
                                <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.id}/200/200`} alt={user.name} />
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
    </Popover>
  );
}

    