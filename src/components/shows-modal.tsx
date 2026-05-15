'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { getYear } from '@/lib/utils';
import MovieService from '@/services/MovieService';
import { useModalStore } from '@/stores/modal';
import {
  type KeyWord,
  MediaType,
  type Genre,
  type ShowWithGenreAndVideo,
} from '@/types';
import Link from 'next/link';
import CustomImage from './custom-image';

const ShowModal = () => {
  const modalStore = useModalStore();
  const [genres, setGenres] = React.useState<Genre[]>([]);
  const [isAnime, setIsAnime] = React.useState<boolean>(false);

  const handleGetData = React.useCallback(async () => {
    const id = modalStore.show?.id;
    const type = modalStore.show?.media_type === MediaType.TV ? 'tv' : 'movie';
    if (!id || !type) return;

    try {
      const data: ShowWithGenreAndVideo = await MovieService.findMovieByIdAndType(id, type);
      const keywords = data?.keywords?.results || data?.keywords?.keywords;
      
      if (keywords?.length) {
        setIsAnime(!!keywords.find((keyword: KeyWord) => keyword.name === 'anime'));
      }

      if (data?.genres) setGenres(data.genres);
    } catch (error) {
      console.error('Error fetching modal data:', error);
    }
  }, [modalStore.show?.id, modalStore.show?.media_type]);

  React.useEffect(() => {
    if (modalStore.open) {
      void handleGetData();
    }
  }, [handleGetData, modalStore.open]);

  const handleCloseModal = () => {
    modalStore.reset();
    if (!modalStore.show || modalStore.firstLoad) {
      window.history.pushState(null, '', '/home');
    } else {
      window.history.back();
    }
  };

  const handleHref = (): string => {
    const type = isAnime ? 'anime' : modalStore.show?.media_type === MediaType.MOVIE ? 'movie' : 'tv';
    let id = `${modalStore.show?.id}`;
    if (isAnime) {
      const prefix = modalStore.show?.media_type === MediaType.MOVIE ? 'm' : 't';
      id = `${prefix}-${id}`;
    }
    return `/watch/${type}/${id}`;
  };

  return (
    <Dialog open={modalStore.open} onOpenChange={handleCloseModal}>
      <DialogContent className="glass-panel max-w-2xl overflow-hidden border-none p-0 shadow-2xl sm:rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Hero Banner Area */}
          <div className="relative aspect-video w-full overflow-hidden">
            <CustomImage
              fill
              priority
              alt={modalStore?.show?.title ?? 'poster'}
              className="object-cover"
              src={`https://image.tmdb.org/t/p/original${modalStore.show?.backdrop_path ?? modalStore.show?.poster_path}`}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17191c] via-[#17191c]/20 to-transparent" />
            
            {/* Close button handled by DialogContent */}
            
            {/* Quick Actions Overlay */}
            <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 glass-panel px-3 py-1.5 rounded-full">
                  <Icons.logo className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-bold text-primary">
                    {Math.round((modalStore.show?.vote_average ?? 0) * 10)}% Match
                  </span>
                </div>
                <span className="glass-panel px-3 py-1.5 rounded-full text-sm font-medium text-white/80">
                  {modalStore.show?.release_date ? getYear(modalStore.show.release_date) : modalStore.show?.first_air_date ? getYear(modalStore.show.first_air_date) : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="space-y-6 p-8 pt-4">
            <div className="space-y-2">
              <DialogTitle className="font-clash text-3xl font-bold text-white">
                {modalStore.show?.title ?? modalStore.show?.name}
              </DialogTitle>
              
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <span key={genre.id} className="text-xs font-semibold uppercase tracking-wider text-white/40">
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            <DialogDescription className="text-base leading-relaxed text-white/70 line-clamp-4">
              {modalStore.show?.overview}
            </DialogDescription>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href={handleHref()} className="flex-1">
                <Button className="h-12 w-full rounded-xl bg-[image:var(--gradient-primary)] text-base font-bold text-slate-950 shadow-lg transition-transform hover:scale-[1.02] hover:opacity-95 active:scale-[0.98]">
                  <Icons.play className="mr-2 h-5 w-5 fill-current" />
                  Watch Now
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ShowModal;
