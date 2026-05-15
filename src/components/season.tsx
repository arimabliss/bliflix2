'use client';

import React from 'react';
import { type IEpisode, type ISeason } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SeasonProps {
  seasons: ISeason[];
  onChangeEpisode: (episode: IEpisode) => void;
  onChangeSeason?: (season: ISeason, index: number) => void;
  activeSeasonNumber?: number | null;
  activeEpisodeId?: number | null;
  loadingSeasonNumber?: number | null;
  disabled?: boolean;
}

export default function Season({
  seasons,
  onChangeEpisode,
  onChangeSeason,
  activeSeasonNumber,
  activeEpisodeId,
  loadingSeasonNumber,
  disabled,
}: SeasonProps) {
  const [activeSeasonIndex, setActiveSeasonIndex] = React.useState(0);
  const activeSeason = seasons[activeSeasonIndex];

  React.useEffect(() => {
    if (activeSeasonNumber == null) return;
    const nextIndex = seasons.findIndex(
      (season) => season.season_number === activeSeasonNumber,
    );

    if (nextIndex >= 0) {
      setActiveSeasonIndex(nextIndex);
    }
  }, [activeSeasonNumber, seasons]);

  if (!seasons.length) return null;

  return (
    <div className="mt-8 space-y-6">
      {/* Seasons Pill List */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {seasons.map((season, index) => (
          <button
            key={season.id}
            onClick={() => {
              setActiveSeasonIndex(index);
              onChangeSeason?.(season, index);
            }}
            disabled={disabled}
            className={cn(
              'whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50',
              activeSeasonIndex === index
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'glass-panel text-white/60 hover:text-white hover:bg-white/10'
            )}
          >
            Season {season.season_number}
          </button>
        ))}
      </div>

      {/* Episodes Grid */}
      {loadingSeasonNumber === activeSeason?.season_number ? (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/55">
          Loading season {activeSeason?.season_number} episodes...
        </div>
      ) : !activeSeason?.episodes?.length ? (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/55">
          No episodes were found for this season.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activeSeason.episodes.map((episode) => (
            <motion.div
              key={episode.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                if (!disabled) onChangeEpisode(episode);
              }}
              className={cn(
                'group relative overflow-hidden rounded-xl p-4 transition-all',
                disabled
                  ? 'cursor-not-allowed opacity-60'
                  : 'cursor-pointer glass-panel hover:bg-white/5',
                activeEpisodeId === episode.id &&
                  'border border-primary/40 bg-primary/10 shadow-lg shadow-primary/10',
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 font-bold text-primary">
                  {episode.episode_number}
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="line-clamp-1 text-sm font-bold text-white transition-colors group-hover:text-primary">
                    {episode.name}
                  </h4>
                  <p className="line-clamp-2 text-xs text-white/40">
                    {episode.overview || 'No description available.'}
                  </p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
