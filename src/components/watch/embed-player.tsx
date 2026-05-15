'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaType, type IEpisode, type ISeason, type Show } from '@/types';
import MovieService from '@/services/MovieService';
import Loading from '../ui/loading';
import Season from '../season';
import ShowsCarousel from '../shows-carousel';
import { Button } from '../ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useWatchTogether } from '@/stores/watch-together';
import { WatchTogetherPanel } from '../watch-together/watch-together-panel';
import { RoomSetupModal } from '../watch-together/room-setup-modal';
import { useWatchTogetherSocket } from '@/hooks/use-watch-together-socket';
import { PlayerControls } from './player-controls';
import {
  buildPlaybackUrl,
  getDefaultProvider,
  getNextProvider,
  getPlaybackSourceType,
  getTmdbId,
  type PlayerProvider,
} from '@/lib/player';

interface EmbedPlayerProps {
  movieId?: string;
  mediaType?: MediaType;
}

export default function EmbedPlayer({
  movieId,
  mediaType,
}: EmbedPlayerProps) {
  const router = useRouter();
  const store = useWatchTogether();

  useWatchTogetherSocket();

  const [seasons, setSeasons] = React.useState<ISeason[] | null>(null);
  const [show, setShow] = React.useState<Show | null>(null);
  const [related, setRelated] = React.useState<Show[]>([]);
  const [activeTab, setActiveTab] = React.useState<
    'info' | 'related' | 'watch-together'
  >('info');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFrameLoading, setIsFrameLoading] = React.useState(true);
  const [loadingSeasonNumber, setLoadingSeasonNumber] = React.useState<
    number | null
  >(null);
  const [currentUrl, setCurrentUrl] = React.useState('');
  const [playerNotice, setPlayerNotice] = React.useState('');
  const [roomModalOpen, setRoomModalOpen] = React.useState(false);
  const [activeProvider, setActiveProvider] =
    React.useState<PlayerProvider>('vidsrc.cc');
  const [isDub, setIsDub] = React.useState(false);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = React.useState<
    number | null
  >(null);
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = React.useState<
    number | null
  >(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = React.useState<
    number | null
  >(null);

  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const isAnime = mediaType === MediaType.ANIME;
  const sourceType = React.useMemo(
    () => getPlaybackSourceType(movieId ?? '', mediaType),
    [mediaType, movieId],
  );
  const tmdbId = React.useMemo(() => getTmdbId(movieId ?? ''), [movieId]);
  const isAdmin = Boolean(
    store.room && store.room.adminIds.includes(store.userId),
  );

  const playbackUrl = React.useMemo(() => {
    if (!tmdbId) return '';
    if (sourceType === 'tv' && selectedEpisodeNumber == null) return '';

    return buildPlaybackUrl({
      provider: activeProvider,
      sourceType,
      tmdbId,
      seasonNumber: selectedSeasonNumber,
      episodeNumber: selectedEpisodeNumber,
      isAnime,
      isDub,
    });
  }, [
    activeProvider,
    isAnime,
    isDub,
    selectedEpisodeNumber,
    selectedSeasonNumber,
    sourceType,
    tmdbId,
  ]);

  React.useEffect(() => {
    setActiveProvider(getDefaultProvider(isAnime));
  }, [isAnime, movieId]);

  React.useEffect(() => {
    if (store.room && !isAdmin) {
      setActiveTab('watch-together');
      setCurrentUrl(store.room.embedUrl);
      setIsFrameLoading(true);
    }
  }, [isAdmin, store.room]);

  React.useEffect(() => {
    if (!playbackUrl) return;
    if (store.room && !isAdmin) return;

    setCurrentUrl(playbackUrl);
    setIsFrameLoading(true);

    if (
      store.room &&
      isAdmin &&
      store.room.embedUrl !== playbackUrl
    ) {
      store.socket?.emit('change-url', {
        roomId: store.room.roomId,
        userId: store.userId,
        embedUrl: playbackUrl,
      });
    }
  }, [isAdmin, playbackUrl, store.room, store.socket, store.userId]);

  React.useEffect(() => {
    if (!currentUrl || !isFrameLoading) return;
    if (store.room && !isAdmin) return;

    const timeout = window.setTimeout(() => {
      const nextProvider = getNextProvider(activeProvider, isAnime);
      if (!nextProvider) {
        setPlayerNotice(
          'This server is taking too long. Try reloading the player or switching servers manually.',
        );
        return;
      }

      setPlayerNotice(
        `The ${activeProvider} player stalled, so we switched to ${nextProvider}.`,
      );
      setActiveProvider(nextProvider);
    }, 12000);

    return () => window.clearTimeout(timeout);
  }, [activeProvider, currentUrl, isAdmin, isAnime, isFrameLoading, store.room]);

  const loadSeasonDetails = React.useCallback(
    async (seasonNumber: number): Promise<ISeason | null> => {
      if (!tmdbId) return null;

      setLoadingSeasonNumber(seasonNumber);
      try {
        const response = await MovieService.getSeasons(tmdbId, seasonNumber);
        const seasonData = response.data;

        setSeasons((previous) =>
          previous?.map((season) =>
            season.season_number === seasonNumber ? seasonData : season,
          ) ?? [seasonData],
        );

        return seasonData;
      } catch (error) {
        console.error('Error fetching season data:', error);
        return null;
      } finally {
        setLoadingSeasonNumber((current) =>
          current === seasonNumber ? null : current,
        );
      }
    },
    [tmdbId],
  );

  const handleFetchData = React.useCallback(async () => {
    if (!movieId || !tmdbId) return;

    setIsLoading(true);
    try {
      const type = sourceType;

      const showData =
        type === 'tv'
          ? (await MovieService.findTvSeries(tmdbId)).data
          : (await MovieService.findMovie(tmdbId)).data;

      setShow(showData);

      const relatedData = await MovieService.getRecommendations(tmdbId, type);
      setRelated(relatedData.results);

      if (type === 'tv' && showData.seasons) {
        const activeSeasons = showData.seasons.filter(
          (season) => season.season_number > 0,
        );
        setSeasons(
          activeSeasons.map((season) => ({
            ...season,
            episodes: undefined,
          })),
        );

        const firstSeasonNumber = activeSeasons[0]?.season_number ?? null;
        if (firstSeasonNumber != null) {
          const firstSeason = await loadSeasonDetails(firstSeasonNumber);
          const firstEpisode = firstSeason?.episodes?.[0] ?? null;

          setSelectedSeasonNumber(firstSeason?.season_number ?? firstSeasonNumber);
          setSelectedEpisodeNumber(firstEpisode?.episode_number ?? null);
          setSelectedEpisodeId(firstEpisode?.id ?? null);
        }
      } else {
        setSeasons(null);
        setSelectedSeasonNumber(null);
        setSelectedEpisodeNumber(isAnime ? 1 : null);
        setSelectedEpisodeId(null);
      }
    } catch (error) {
      console.error('Error fetching watch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAnime, loadSeasonDetails, movieId, sourceType, tmdbId]);

  React.useEffect(() => {
    void handleFetchData();
  }, [handleFetchData]);

  const handleChangeEpisode = React.useCallback((episode: IEpisode) => {
    setSelectedSeasonNumber(episode.season_number);
    setSelectedEpisodeNumber(episode.episode_number);
    setSelectedEpisodeId(episode.id);
    setPlayerNotice('');
    setIsFrameLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleChangeSeason = React.useCallback(
    async (season: ISeason) => {
      setSelectedSeasonNumber(season.season_number);

      const hydratedSeason =
        season.episodes?.length
          ? season
          : ((await loadSeasonDetails(season.season_number)) ?? season);

      const firstEpisode = hydratedSeason.episodes?.[0];
      if (firstEpisode) {
        handleChangeEpisode(firstEpisode);
      }
    },
    [handleChangeEpisode, loadSeasonDetails],
  );

  const detailRows = [
    {
      label: 'Release',
      value: show?.release_date ?? show?.first_air_date ?? 'Unknown',
    },
    {
      label: 'Rating',
      value: `${Math.round((show?.vote_average ?? 0) * 10)}% Match`,
    },
    {
      label: 'Language',
      value: show?.original_language?.toUpperCase() ?? 'N/A',
    },
    {
      label: 'Format',
      value: sourceType === 'movie' ? 'Feature Film' : 'Series Episode',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-[1480px] px-3 pb-8 pt-6 sm:px-4 sm:pb-10 sm:pt-10 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8 sm:gap-4">
          <Button
            variant="ghost"
            className="gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-white/65 hover:bg-white/10 hover:text-white"
            onClick={() => router.back()}
          >
            <Icons.chevronLeft className="h-5 w-5" />
            Back to browsing
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              {isAnime
                ? 'Anime Session'
                : sourceType === 'movie'
                  ? 'Movie Night'
                  : 'Series Session'}
            </span>
            {selectedEpisodeNumber != null && sourceType === 'tv' && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
                S{String(selectedSeasonNumber ?? 1).padStart(2, '0')} E
                {String(selectedEpisodeNumber).padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px] xl:gap-8">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.055),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-end lg:justify-between lg:px-8">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(show?.genres ?? []).slice(0, 4).map((genre) => (
                      <span
                        key={genre.id}
                        className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>

                  <div>
                    <h1 className="font-clash text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-[3.35rem]">
                      {show?.title ?? show?.name ?? 'Loading title'}
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
                      {show?.overview ??
                        'Loading the stream details and the best available player for this title.'}
                    </p>
                  </div>
                </div>

                <PlayerControls
                  className="justify-start lg:justify-end"
                  activeProvider={activeProvider}
                  onProviderChange={(provider) => {
                    setActiveProvider(provider);
                    setIsFrameLoading(true);
                  }}
                  mediaType={mediaType ?? MediaType.TV}
                  isAnime={isAnime}
                  isDub={isDub}
                  onDubChange={(value) => {
                    setIsDub(value);
                    setIsFrameLoading(true);
                  }}
                  disabled={Boolean(store.room && !isAdmin)}
                />
              </div>

              <div className="relative aspect-video w-full bg-[#020202]">
                <AnimatePresence>
                  {(isLoading || isFrameLoading) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-xl"
                    >
                      <Loading />
                    </motion.div>
                  )}
                </AnimatePresence>

                {currentUrl ? (
                  <iframe
                    key={currentUrl}
                    src={currentUrl}
                    className="h-full w-full border-none"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    ref={iframeRef}
                    referrerPolicy="origin"
                    title={show?.title ?? show?.name ?? 'Video player'}
                    onLoad={() => {
                      setIsFrameLoading(false);
                      setPlayerNotice('');
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center text-white/50">
                    Pick an episode to start playback.
                  </div>
                )}

                {store.room && (
                  <div className="absolute right-4 top-4 z-20">
                    <div className="glass-panel flex items-center gap-3 rounded-full border border-primary/30 px-4 py-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        Live with {store.room.members.length} others
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 rounded-full bg-white/8 px-2 text-[10px] font-bold hover:bg-white/15"
                        onClick={() => {
                          setCurrentUrl(store.room!.embedUrl);
                          setIsFrameLoading(true);
                        }}
                      >
                        Resync
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-8">
                <p className="text-sm text-white/55">
                  {playerNotice ||
                    'If the first server hangs, the player will now fall back automatically.'}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => {
                      setPlayerNotice('');
                      setIsFrameLoading(true);
                      const nextUrl =
                        store.room && !isAdmin
                          ? store.room.embedUrl
                          : playbackUrl;
                      setCurrentUrl('');
                      window.setTimeout(() => {
                        setCurrentUrl(nextUrl);
                      }, 0);
                    }}
                  >
                    Reload
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => {
                      const nextProvider = getNextProvider(activeProvider, isAnime);
                      if (nextProvider) {
                        setPlayerNotice('');
                        setIsFrameLoading(true);
                        setActiveProvider(nextProvider);
                      }
                    }}
                    disabled={!getNextProvider(activeProvider, isAnime)}
                  >
                    Next Server
                  </Button>
                </div>
              </div>
            </div>

            {seasons && (
              <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] lg:p-7">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-clash text-2xl font-bold text-white">
                      Episode Guide
                    </h2>
                    <p className="text-sm text-white/50">
                      Jump between seasons, then lock in the episode you
                      actually want to play.
                    </p>
                  </div>
                  {store.room && !isAdmin && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                      Synced to room host
                    </span>
                  )}
                </div>

                <Season
                  seasons={seasons}
                  onChangeEpisode={handleChangeEpisode}
                  onChangeSeason={handleChangeSeason}
                  activeSeasonNumber={selectedSeasonNumber}
                  activeEpisodeId={selectedEpisodeId}
                  loadingSeasonNumber={loadingSeasonNumber}
                  disabled={Boolean(store.room && !isAdmin)}
                />
              </div>
            )}
          </div>

          <div className="space-y-6">
              <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
              <div className="flex border-b border-white/10">
                {(['info', 'related', 'watch-together'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'relative flex-1 px-3 py-4 text-[11px] font-bold uppercase tracking-[0.24em] transition-colors',
                      activeTab === tab
                        ? 'text-primary'
                        : 'text-white/40 hover:text-white',
                    )}
                  >
                    {tab.replace('-', ' ')}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5 lg:p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'info' && (
                    <motion.div
                      key="info"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="space-y-6"
                    >
                      <div className="grid gap-3">
                        {detailRows.map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                          >
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                              {row.label}
                            </span>
                            <span className="text-sm font-semibold text-white/80">
                              {row.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
                        <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-primary">
                          Playback Notes
                        </h3>
                        <p className="text-sm leading-7 text-white/58">
                          TV titles now launch into a real episode stream
                          instead of the provider landing page. Switch servers
                          if one source stalls, and use dub/sub controls for
                          anime when supported.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'related' && (
                    <motion.div
                      key="related"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="-mx-5 -my-3 lg:-mx-6"
                    >
                      <ShowsCarousel title="Up Next" shows={related} />
                    </motion.div>
                  )}

                  {activeTab === 'watch-together' && (
                    <motion.div
                      key="watch-together"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="space-y-5"
                    >
                      {!store.room ? (
                        <div className="space-y-5 rounded-[26px] border border-white/10 bg-white/[0.03] p-6">
                          <div className="space-y-2">
                            <h2 className="font-clash text-2xl font-bold text-white">
                              Watch Together
                            </h2>
                            <p className="text-sm leading-7 text-white/55">
                              Create a room from the exact stream you picked so
                              everyone lands on the same player, episode, and
                              server.
                            </p>
                          </div>

                          <Button
                            className="soft-shine h-11 rounded-full bg-[image:var(--gradient-primary)] px-6 font-bold text-slate-950 shadow-[0_16px_40px_rgba(166,241,204,0.14)] hover:opacity-95"
                            onClick={() => setRoomModalOpen(true)}
                          >
                            Start a Room
                          </Button>
                        </div>
                      ) : (
                        <WatchTogetherPanel />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RoomSetupModal
        open={roomModalOpen}
        onOpenChange={setRoomModalOpen}
        currentEmbedUrl={currentUrl.length > 0 ? currentUrl : playbackUrl}
      />
    </div>
  );
}
