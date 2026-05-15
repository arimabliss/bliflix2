'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalStore } from '@/stores/modal';
import { MediaType, type Show } from '@/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { getNameFromShow, getSlug } from '@/lib/utils';
import Link from 'next/link';
import CustomImage from './custom-image';

interface ShowsCarouselProps {
  title: string;
  shows: Show[];
}

const ShowsCarousel = ({ title, shows }: ShowsCarouselProps) => {
  const showsRef = React.useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = React.useState(false);

  const scrollToDirection = (direction: 'left' | 'right') => {
    if (!showsRef.current) return;
    const { scrollLeft, offsetWidth } = showsRef.current;
    const offset =
      direction === 'left'
        ? scrollLeft - offsetWidth * 0.8
        : scrollLeft + offsetWidth * 0.8;
    showsRef.current.scrollTo({ left: offset, behavior: 'smooth' });
  };

  if (!shows?.length) return null;

  return (
    <section
      aria-label="Carousel of shows"
      className="group relative my-6 space-y-4 sm:my-8"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      <div className="flex items-end justify-between gap-4 px-4 sm:px-[4%] lg:px-12">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white/90 transition-colors hover:text-white sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.24em] text-white/35 sm:text-xs">
            {shows.length} titles
          </p>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <AnimatePresence>
          {showArrows && (
            <>
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-2 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full glass-panel text-white shadow-xl transition-transform hover:scale-110 active:scale-95 lg:flex"
                onClick={() => scrollToDirection('left')}
              >
                <Icons.chevronLeft className="h-6 w-6" />
              </motion.button>
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-2 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full glass-panel text-white shadow-xl transition-transform hover:scale-110 active:scale-95 lg:flex"
                onClick={() => scrollToDirection('right')}
              >
                <Icons.chevronRight className="h-6 w-6" />
              </motion.button>
            </>
          )}
        </AnimatePresence>

        <div
          ref={showsRef}
          className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-6 sm:gap-4 sm:px-[4%] sm:pb-8 lg:px-12"
        >
          {shows.map((show) => (
            <div
              key={show.id}
              className="w-[220px] flex-shrink-0 sm:w-[280px] lg:w-[320px]"
            >
              <ShowCard show={show} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const ShowCard = ({ show }: { show: Show }) => {
  const detailsHref = `/${
    show.media_type === MediaType.TV ? 'tv-shows' : 'movies'
  }/${getSlug(show.id, getNameFromShow(show))}`;
  const watchHref = `/watch/${
    show.media_type === MediaType.TV ? 'tv' : 'movie'
  }/${show.id}`;

  const handleOpenModal = () => {
    window.history.pushState(null, '', detailsHref);
    useModalStore.setState({ show, open: true, play: true });
  };

  return (
    <div className="card-hover group overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] shadow-[0_16px_38px_rgba(0,0,0,0.24)]">
      <div className="relative aspect-[16/9] overflow-hidden">
        <CustomImage
          src={`https://image.tmdb.org/t/p/w500${show.backdrop_path ?? show.poster_path}`}
          alt={show.title ?? show.name ?? 'poster'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          fill
          sizes="(max-width: 640px) 220px, (max-width: 1024px) 280px, 320px"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/15 to-transparent" />
        <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
          {Math.round(show.vote_average * 10)}%
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-sm font-bold text-white sm:text-base">
            {show.title ?? show.name}
          </h3>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {show.media_type === MediaType.TV ? 'Series' : 'Movie'} {'|'}{' '}
            {show.release_date?.split('-')[0] ??
              show.first_air_date?.split('-')[0] ??
              'New'}
          </p>
        </div>

        <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-white/55 sm:text-sm">
          {show.overview ??
            'Open details, switch sources, and jump straight into playback.'}
        </p>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="h-10 flex-1 rounded-xl bg-[image:var(--gradient-primary)] font-semibold text-slate-950 hover:opacity-95"
          >
            <Link href={watchHref}>
              <Icons.play className="mr-2 h-3.5 w-3.5 fill-current" />
              Play
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 rounded-xl border-white/10 bg-black/30 px-4 text-white hover:bg-white/10"
            onClick={handleOpenModal}
          >
            Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShowsCarousel;
