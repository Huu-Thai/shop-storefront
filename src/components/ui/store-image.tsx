import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ImageData {
  url: string;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  renditions?: { width: number; height: number; url: string }[] | null;
}

/**
 * Product and content images from the shop's media library. The shop already serves resized
 * renditions, so this is a plain `<img>` with `srcset`/`sizes` (no image optimiser, no sharp), with
 * intrinsic width/height to prevent layout shift. `priority` is for the one LCP image per page.
 * Without an image it shows a calm placeholder of the same shape.
 */
export function StoreImage({
  image,
  alt,
  sizes = '100vw',
  priority = false,
  className,
  fit = 'cover',
  placeholderLabel,
}: {
  image: ImageData | null | undefined;
  /** Fallback when the image has no alt text (usually the product name). */
  alt: string;
  sizes?: string;
  priority?: boolean;
  /** Classes for the frame: aspect ratio, radius. */
  className?: string;
  fit?: 'cover' | 'contain';
  placeholderLabel?: string;
}) {
  if (!image?.url)
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex flex-col items-center justify-center gap-2 overflow-hidden bg-media text-media-fg',
          className,
        )}
      >
        <ImageOff aria-hidden className="size-6 opacity-60" strokeWidth={1.5} />
        {placeholderLabel && (
          <span aria-hidden className="max-w-[80%] truncate text-caption">
            {placeholderLabel}
          </span>
        )}
      </div>
    );
  const sources = [...(image.renditions ?? [])]
    .filter((r) => r.url && r.width)
    .sort((a, b) => a.width - b.width);
  if (image.width && !sources.some((s) => s.width === image.width))
    sources.push({ url: image.url, width: image.width, height: image.height ?? 0 });
  return (
    <div className={cn('overflow-hidden bg-media', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- the shop serves renditions */}
      <img
        src={sources[0]?.url ?? image.url}
        srcSet={
          sources.length > 1 ? sources.map((s) => `${s.url} ${s.width}w`).join(', ') : undefined
        }
        sizes={sources.length > 1 ? sizes : undefined}
        width={image.width ?? undefined}
        height={image.height ?? undefined}
        alt={image.alt || alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding={priority ? 'sync' : 'async'}
        className={cn('size-full', fit === 'cover' ? 'object-cover' : 'object-contain')}
      />
    </div>
  );
}
