'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { MediaType } from '@/types';
import { getProviderOptions, type PlayerProvider } from '@/lib/player';

interface PlayerControlsProps {
  activeProvider: PlayerProvider;
  onProviderChange: (provider: PlayerProvider) => void;
  mediaType: MediaType;
  isAnime?: boolean;
  isDub: boolean;
  onDubChange: (isDub: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function PlayerControls({
  activeProvider,
  onProviderChange,
  mediaType,
  isAnime,
  isDub,
  onDubChange,
  disabled,
  className,
}: PlayerControlsProps) {
  const visibleProviders = getProviderOptions(Boolean(isAnime)).map((id) => ({
    id,
    name:
      id === 'vidsrc.cc'
        ? 'VidSrc.cc'
        : id === 'superembed'
          ? 'SuperEmbed'
          : 'VidSrc.wiki',
  }));

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {/* Server Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="glass-panel gap-2 rounded-full border-white/10 px-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icons.logo className="h-3 w-3 fill-primary text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Server: {activeProvider}
            </span>
            <Icons.chevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="glass-panel border-white/10 text-white">
          {visibleProviders.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onClick={() => onProviderChange(p.id)}
              className={cn(
                "cursor-pointer focus:bg-white/10 focus:text-white",
                activeProvider === p.id && "bg-primary/20 text-primary"
              )}
            >
              {p.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dub/Sub Toggle (for Anime) */}
      {isAnime && (
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
          <button
            onClick={() => onDubChange(false)}
            disabled={disabled}
            className={cn(
              'rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-50',
              !isDub
                ? 'bg-primary text-white shadow-lg'
                : 'text-white/40 hover:text-white'
            )}
          >
            Sub
          </button>
          <button
            onClick={() => onDubChange(true)}
            disabled={disabled}
            className={cn(
              'rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-50',
              isDub
                ? 'bg-primary text-white shadow-lg'
                : 'text-white/40 hover:text-white'
            )}
          >
            Dub
          </button>
        </div>
      )}

      {/* Info Badge */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
        <Icons.info className="h-3 w-3 text-white/40" />
        <span className="text-[10px] font-medium text-white/40 italic">
          {mediaType === MediaType.ANIME
            ? 'Dub mode is strongest on VidSrc.cc. Switch servers if playback stalls.'
            : 'VidSrc.cc is the default. Switch servers only if playback fails.'}
        </span>
      </div>
    </div>
  );
}
