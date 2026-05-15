import { MediaType } from '@/types';

export type PlayerProvider = 'vidsrc.cc' | 'vidsrc.wiki' | 'superembed';
export type PlayerSourceType = 'movie' | 'tv';
const DEFAULT_PROVIDER_ORDER: PlayerProvider[] = [
  'vidsrc.cc',
  'superembed',
  'vidsrc.wiki',
];

export interface PlaybackUrlOptions {
  provider: PlayerProvider;
  sourceType: PlayerSourceType;
  tmdbId: number;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  isAnime?: boolean;
  isDub?: boolean;
}

export function getTmdbId(value: string): number {
  const match = value.match(/(\d+)(?!.*\d)/);
  return match ? Number(match[1]) : 0;
}

export function getPlaybackSourceType(
  movieId: string,
  mediaType?: MediaType,
): PlayerSourceType {
  if (mediaType === MediaType.MOVIE || movieId.startsWith('m-')) {
    return 'movie';
  }

  return 'tv';
}

export function buildPlaybackUrl({
  provider,
  sourceType,
  tmdbId,
  seasonNumber,
  episodeNumber,
  isAnime = false,
  isDub = false,
}: PlaybackUrlOptions): string {
  const safeSeason = seasonNumber ?? 1;
  const safeEpisode = episodeNumber ?? 1;

  if (provider === 'superembed') {
    const base = `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`;
    return sourceType === 'movie'
      ? base
      : `${base}&s=${safeSeason}&e=${safeEpisode}`;
  }

  if (provider === 'vidsrc.wiki') {
    const base = 'https://vidsrc.wiki/embed';
    return sourceType === 'movie'
      ? `${base}/movie/${tmdbId}?autoplay=1`
      : `${base}/tv/${tmdbId}/${safeSeason}/${safeEpisode}?autoplay=1`;
  }

  if (isAnime) {
    return `https://vidsrc.cc/v2/embed/anime/tmdb${tmdbId}/${safeEpisode}/${isDub ? 'dub' : 'sub'}`;
  }

  return sourceType === 'movie'
    ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}?autoPlay=true`
    : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${safeSeason}/${safeEpisode}?autoPlay=true`;
}

export function getDefaultProvider(isAnime: boolean): PlayerProvider {
  return isAnime ? 'vidsrc.cc' : 'vidsrc.cc';
}

export function getProviderOptions(isAnime: boolean): PlayerProvider[] {
  return isAnime ? ['vidsrc.cc'] : DEFAULT_PROVIDER_ORDER;
}

export function getNextProvider(
  currentProvider: PlayerProvider,
  isAnime: boolean,
): PlayerProvider | null {
  const providers = getProviderOptions(isAnime);
  const currentIndex = providers.indexOf(currentProvider);
  if (currentIndex < 0 || currentIndex === providers.length - 1) {
    return null;
  }

  return providers[currentIndex + 1] ?? null;
}
