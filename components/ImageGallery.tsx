'use client';

import { useState, useCallback, useEffect } from 'react';

interface ImageGalleryProps {
  images: { src: string; alt?: string; caption?: string }[];
  slug: string;
}

export default function ImageGallery({ images, slug }: ImageGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const close = useCallback(() => setLightbox(null), []);
  const prev = useCallback(() => setLightbox((i) => (i !== null && i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setLightbox((i) => (i !== null && i < images.length - 1 ? i + 1 : 0)), [images.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [lightbox, close, prev, next]);

  if (!images.length) return null;

  return (
    <>
      <div className="img-gallery" data-count={images.length}>
        {images.map((img, i) => (
          <figure className="img-gallery-item" key={`${slug}-${i}`} onClick={() => setLightbox(i)}>
            <img src={img.src} alt={img.alt || `${slug} 이미지 ${i + 1}`} loading="lazy" />
            {img.caption && <figcaption>{img.caption}</figcaption>}
            <div className="img-gallery-zoom">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                <path d="M11 8v6M8 11h6" />
              </svg>
            </div>
          </figure>
        ))}
      </div>

      {lightbox !== null && (
        <div className="img-lightbox" onClick={close}>
          <div className="img-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="img-lb-close" onClick={close} aria-label="닫기">&times;</button>
            {images.length > 1 && (
              <>
                <button className="img-lb-nav img-lb-prev" onClick={prev} aria-label="이전">&lsaquo;</button>
                <button className="img-lb-nav img-lb-next" onClick={next} aria-label="다음">&rsaquo;</button>
              </>
            )}
            <img src={images[lightbox].src} alt={images[lightbox].alt || ''} />
            {(images[lightbox].caption || images.length > 1) && (
              <div className="img-lb-caption">
                {images[lightbox].caption && <p>{images[lightbox].caption}</p>}
                {images.length > 1 && <span className="img-lb-counter">{lightbox + 1} / {images.length}</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
