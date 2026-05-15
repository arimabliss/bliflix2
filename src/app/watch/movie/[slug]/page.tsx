import React from 'react';
import EmbedPlayer from '@/components/watch/embed-player';

export const revalidate = 3600;

export default function Page({ params }: { params: { slug: string } }) {
  const movieId = params.slug.split('-').pop();
  return <EmbedPlayer movieId={movieId} />;
}
