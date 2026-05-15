'use client';

import React from 'react';
import { type Show, type NavItem } from '@/types';
import Link from 'next/link';
import {
  cn,
  getSearchValue,
  handleDefaultSearchBtn,
  handleDefaultSearchInp,
} from '@/lib/utils';
import { siteConfig } from '@/configs/site';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { useSearchStore } from '@/stores/search';
import { ModeToggle as ThemeToggle } from '@/components/theme-toggle';
import { DebouncedInput } from '@/components/debounced-input';
import MovieService from '@/services/MovieService';
import { MobileNav } from './mobile-nav';
import { useWatchTogetherSocket } from '@/hooks/use-watch-together-socket';
import { RoomSetupModal } from '../watch-together/room-setup-modal';

interface MainNavProps {
  items?: NavItem[];
}

interface SearchResult {
  results: Show[];
}

export function MainNav({ items }: MainNavProps) {
  const path = usePathname();
  const router = useRouter();
  const searchStore = useSearchStore();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = React.useState(false);

  // Initialize socket connection
  useWatchTogetherSocket();

  const handlePopstateEvent = React.useCallback(() => {
    const pathname = window.location.pathname;
    const search: string = getSearchValue('q');

    if (!search?.length || !pathname.includes('/search')) {
      searchStore.reset();
      searchStore.setOpen(false);
    } else if (search?.length) {
      searchStore.setOpen(true);
      searchStore.setLoading(true);
      searchStore.setQuery(search);
      setTimeout(() => {
        handleDefaultSearchBtn();
      }, 10);
      setTimeout(() => {
        handleDefaultSearchInp();
      }, 20);
      MovieService.searchMovies(search)
        .then((response: SearchResult) => {
          void searchStore.setShows(response.results);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => searchStore.setLoading(false));
    }
  }, [searchStore]);

  React.useEffect(() => {
    window.addEventListener('popstate', handlePopstateEvent, false);
    return () => {
      window.removeEventListener('popstate', handlePopstateEvent, false);
    };
  }, [handlePopstateEvent]);

  const searchShowsByQuery = React.useCallback(async (value: string) => {
    if (!value?.trim()?.length) {
      if (path === '/search') {
        router.push('/home');
      } else {
        window.history.pushState(null, '', path);
      }
      return;
    }

    if (getSearchValue('q')?.trim()?.length) {
      window.history.replaceState(null, '', `search?q=${value}`);
    } else {
      window.history.pushState(null, '', `search?q=${value}`);
    }

    searchStore.setQuery(value);
    searchStore.setLoading(true);
    const shows = await MovieService.searchMovies(value);
    searchStore.setLoading(false);
    void searchStore.setShows(shows.results);

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [path, router, searchStore]);

  React.useEffect(() => {
    const changeBgColor = () => {
      window.scrollY > 20 ? setIsScrolled(true) : setIsScrolled(false);
    };
    window.addEventListener('scroll', changeBgColor);
    return () => window.removeEventListener('scroll', changeBgColor);
  }, []);

  const handleChangeStatusOpen = (value: boolean): void => {
    searchStore.setOpen(value);
    if (!value) searchStore.reset();
  };

  return (
    <nav
      className={cn(
        'glass-panel sticky top-0 z-50 flex w-full items-center justify-between px-4 py-3 transition-all duration-300 sm:px-6 sm:py-4',
        isScrolled
          ? 'border-white/10 bg-black/75 shadow-[0_12px_40px_rgba(0,0,0,0.28)]'
          : 'border-transparent bg-transparent backdrop-blur-0'
      )}>
      <div className="flex items-center gap-4 sm:gap-8">
        <Link
          href="/"
          className="flex items-center space-x-2"
          onClick={() => handleChangeStatusOpen(false)}>
          <span className="font-clash text-xl font-bold tracking-tight gradient-text sm:text-2xl">
            {siteConfig.name}
          </span>
        </Link>
        
        {items?.length ? (
          <div className="hidden gap-2 md:flex">
            {items?.map((item, index) => (
              item.href && (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 relative group',
                    path === item.href 
                      ? 'text-foreground' 
                      : 'text-foreground/60 hover:text-foreground'
                  )}
                  onClick={() => handleChangeStatusOpen(false)}>
                  {item.title}
                  {path === item.href && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                  <div className={cn(
                    "absolute bottom-0 left-4 right-4 h-0.5 bg-[image:var(--gradient-primary)] transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100",
                    path === item.href && "scale-x-100"
                  )} />
                </Link>
              )
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <DebouncedInput
            id="search-input"
            open={searchStore.isOpen}
            value={searchStore.query}
            onChange={searchShowsByQuery}
            onChangeStatusOpen={handleChangeStatusOpen}
            containerClassName={cn(path === '/' ? 'hidden' : 'flex')}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full gradient-text font-semibold hover:bg-white/5"
            onClick={() => setIsRoomModalOpen(true)}
          >
            Watch Together
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="md:hidden">
            <MobileNav items={items ?? []} />
          </div>
        </div>
      </div>

      <RoomSetupModal 
        open={isRoomModalOpen} 
        onOpenChange={setIsRoomModalOpen}
        currentEmbedUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
    </nav>
  );
}

export default MainNav;
