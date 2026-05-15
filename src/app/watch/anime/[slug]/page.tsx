import React from 'react';
import EmbedPlayer from '@/components/watch/embed-player';
import { MediaType } from '@/types';

export const revalidate = 3600;

export default function Page({ params }: { params: { slug: string } }) {
  const slug = params.slug;

  return <EmbedPlayer movieId={slug} mediaType={MediaType.ANIME} />;
}
