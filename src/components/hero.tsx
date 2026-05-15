'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { getIdFromSlug, getNameFromShow, getSlug } from '@/lib/utils';
import MovieService from '@/services/MovieService';
import { useModalStore } from '@/stores/modal';
import { useSearchStore } from '@/stores/search';
import { MediaType, type Show } from '@/types';
import { type AxiosResponse } from 'axios';
import Link from 'next/link';
import CustomImage from './custom-image';
import { usePathname } from 'next/navigation';

interface HeroProps {
  randomShow: Show | null;
}

const Hero = ({ randomShow }: HeroProps) => {
  const path = usePathname();
  const modalStore = useModalStore();
  const searchStore = useSearchStore();

  const handlePopstateEvent = React.useCallback(() => {
    const pathname = window.location.pathname;
    if (!/\d/.test(pathname)) {
      modalStore.reset();
    } else if (/\d/.test(pathname)) {
      const movieId: number = getIdFromSlug(pathname);
      if (!movieId) return;

      const findMovie: Promise<AxiosResponse<Show>> = pathname.includes('/tv-shows')
        ? MovieService.findTvSeries(movieId)
        : MovieService.findMovie(movieId);

      findMovie
        .then((response: AxiosResponse<Show>) => {
          const { data } = response;
          useModalStore.setState({ show: data, open: true, play: true });
        })
        .catch((error) => {
          console.error(`findMovie: `, error);
        });
    }
  }, [modalStore]);

  React.useEffect(() => {
    window.addEventListener('popstate', handlePopstateEvent, false);
    return () => {
      window.removeEventListener('popstate', handlePopstateEvent, false);
    };
  }, [handlePopstateEvent]);

  if (searchStore.query.length > 0) return null;

  const handleHref = (): string => {
    if (!randomShow) return '#';
    if (!path.includes('/anime')) {
      const type = randomShow.media_type === MediaType.MOVIE ? 'movie' : 'tv';
      return `/watch/${type}/${randomShow.id}`;
    }
    const prefix: string = randomShow?.media_type === MediaType.MOVIE ? 'm' : 't';
    const id = `${prefix}-${randomShow.id}`;
    return `/watch/anime/${id}`;
  };

  return (
    <section aria-label="Hero" className="relative w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {randomShow && (
          <div key={randomShow.id} className="relative h-[72vh] min-h-[560px] w-full sm:h-[80vh] lg:h-[95vh]">
            {/* Background Backdrop */}
            <div className="absolute inset-0 z-0">
              <CustomImage
                src={`https://image.tmdb.org/t/p/original${
                  randomShow?.backdrop_path ?? randomShow?.poster_path ?? ''
                }`}
                alt={randomShow?.title ?? randomShow?.name ?? 'poster'}
                className="h-full w-full object-cover"
                sizes="100vw"
                fill
                priority
              />
              {/* Cinematic Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/25 to-transparent" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex h-full items-end px-4 pb-10 pt-24 sm:items-center sm:px-6 md:px-12 lg:px-20">
              <div className="max-w-3xl space-y-5 sm:space-y-6">
                {/* Badge/Genre Pills */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex flex-wrap gap-2"
                >
                  <span className="glass-panel px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    {randomShow.media_type === MediaType.MOVIE ? 'Movie' : 'TV Series'}
                  </span>
                  <span className="glass-panel px-3 py-1 text-xs font-semibold text-white/80">
                    {Math.round(randomShow.vote_average * 10)}% Match
                  </span>
                  <span className="glass-panel px-3 py-1 text-xs font-semibold text-white/80">
                    {randomShow.release_date?.split('-')[0] ?? randomShow.first_air_date?.split('-')[0]}
                  </span>
                </motion.div>

                {/* Animated Pulse behind title */}
                <div className="relative">
                  <div className="absolute -left-20 -top-20 h-64 w-64 animate-pulse-slow rounded-full bg-white/10 blur-[100px]" />
                  
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="font-clash text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-7xl lg:text-8xl"
                  >
                    {randomShow.title ?? randomShow.name}
                  </motion.h1>
                </div>

                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="max-w-xl text-base text-white/70 line-clamp-3 sm:text-lg md:text-xl"
                >
                  {randomShow.overview}
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4 sm:pt-4"
                >
                  <Link href={handleHref()} className="w-full sm:w-auto">
                    <Button size="lg" className="soft-shine w-full rounded-full bg-[image:var(--gradient-primary)] px-8 text-base font-bold text-slate-950 shadow-lg shadow-primary/20 transition-transform hover:scale-105 hover:opacity-95 active:scale-95 sm:w-auto">
                      <Icons.play className="mr-2 h-5 w-5 fill-current" />
                      Watch Now
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="glass-panel w-full rounded-full border-white/10 px-8 text-base font-bold text-white transition-all hover:bg-white/10 sm:w-auto"
                    onClick={() => {
                      const name = getNameFromShow(randomShow);
                      const path: string = randomShow.media_type === MediaType.TV ? 'tv-shows' : 'movies';
                      window.history.pushState(null, '', `/${path}/${getSlug(randomShow.id, name)}`);
                      useModalStore.setState({ show: randomShow, open: true, play: true });
                    }}
                  >
                    <Icons.info className="mr-2 h-5 w-5" />
                    More Info
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Hero;
