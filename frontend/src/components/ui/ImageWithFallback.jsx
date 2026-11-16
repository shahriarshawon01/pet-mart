import React, { useState } from 'react';
import { PawPrint } from 'lucide-react';

/**
 * Image in a fixed aspect-ratio box. Lazy-loads, fades in, and shows a neutral
 * placeholder (never the browser's broken-image icon) when the src is missing or fails.
 */
export function ImageWithFallback({
  src,
  alt = '',
  className = '',
  aspectRatio = 'aspect-[4/3]',
  objectFit = 'object-cover',
  eager = false,
}) {
  const [failedSrc, setFailedSrc] = useState(null);
  const [loadedSrc, setLoadedSrc] = useState(null);
  const error = !src || failedSrc === src;
  const loaded = loadedSrc === src;

  if (error) {
    return (
      <div
        className={`${aspectRatio} flex w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 ${className}`}
        role={alt ? 'img' : undefined}
        aria-label={alt ? `${alt} (no photo)` : undefined}
      >
        <div className="flex flex-col items-center gap-1.5 text-zinc-400">
          <PawPrint size={30} aria-hidden="true" />
          <span className="text-xs font-medium">No photo</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${aspectRatio} relative w-full overflow-hidden bg-zinc-100 ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-zinc-200" aria-hidden="true" />}
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailedSrc(src)}
        onLoad={() => setLoadedSrc(src)}
        className={`h-full w-full ${objectFit} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

export default ImageWithFallback;
