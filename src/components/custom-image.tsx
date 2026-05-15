import { type ImageProps, type ImageLoaderProps } from 'next/image';
import React, { forwardRef } from 'react';
import Image from 'next/image';
import { env } from '@/env.mjs';

const customLoader = ({ src, width, quality }: ImageLoaderProps) => {
  // local image
  if (src.startsWith('/')) {
    const params = [`w=${width}`];
    if (quality) {
      params.push(`q=${quality}`);
    } else {
      params.push(`q=75`);
    }
    const paramsString = params.join('&');
    let urlEndpoint = '/_next/image';
    if (urlEndpoint.endsWith('/'))
      urlEndpoint = urlEndpoint.substring(0, urlEndpoint.length - 1);
    return `${urlEndpoint}?url=${src}&${paramsString}`;
  }

  // TMDB Image Handling
  if (src.includes('image.tmdb.org')) {
    if (env.NEXT_PUBLIC_IMAGE_DOMAIN) {
      const cdn = `${env.NEXT_PUBLIC_IMAGE_DOMAIN}/tmdb:w_${width}`;
      return src.replace('image.tmdb.org', cdn);
    }
    // Fallback to standard TMDB URL if no CDN domain is set
    // Note: TMDB uses paths like /t/p/w500/...
    // If src is already a full TMDB URL, we just return it
    return src;
  }

  return src;
};

const CustomImage = forwardRef(function CustomImage(
  props: ImageProps,
  ref: React.Ref<HTMLImageElement>,
) {
  // Use unoptimized if no loader is strictly needed or if it's a relative path next/image handles
  const isTmdb = typeof props.src === 'string' && props.src.includes('image.tmdb.org');
  
  return (
    <Image
      {...props}
      loader={isTmdb ? customLoader : undefined}
      ref={ref}
      alt={props.alt || "KoWatch"}
      className={props.className}
      unoptimized={!env.NEXT_PUBLIC_IMAGE_DOMAIN && isTmdb}
    />
  );
});

export default CustomImage;
