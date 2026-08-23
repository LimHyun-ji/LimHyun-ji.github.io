'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ImageSliderProps {
  images: { src: string; alt?: string; caption?: string }[];
}

export default function ImageSlider({ images }: ImageSliderProps) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(0);
  const dragOffset = useRef(0);

  const slideWidth = 68; // 각 슬라이드가 차지하는 % (1.5개 보이도록)
  const gap = 2; // gap %

  const maxIndex = images.length - 1;

  const goTo = useCallback((idx: number) => {
    setCurrent(Math.max(0, Math.min(idx, maxIndex)));
  }, [maxIndex]);

  // 드래그 핸들링
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = e.clientX;
    dragOffset.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    dragOffset.current = e.clientX - dragStart.current;
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset.current < -40) goTo(current + 1);
    else if (dragOffset.current > 40) goTo(current - 1);
  };

  // 키보드
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [current, goTo]);

  if (!images.length) return null;

  const translateX = -(current * (slideWidth + gap));

  return (
    <div className="img-slider">
      <div
        className="img-slider-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          ref={trackRef}
          className="img-slider-track"
          style={{ transform: `translateX(${translateX}%)`, transition: isDragging ? 'none' : 'transform 0.4s ease' }}
        >
          {images.map((img, i) => (
            <div className="img-slider-slide" key={i} style={{ width: `${slideWidth}%`, marginRight: `${gap}%` }}>
              <img src={img.src} alt={img.alt || `이미지 ${i + 1}`} loading="lazy" draggable={false} />
              {img.caption && <p className="img-slider-caption">{img.caption}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* 좌우 버튼 */}
      {current > 0 && (
        <button className="img-slider-btn img-slider-prev" onClick={() => goTo(current - 1)} aria-label="이전">
          &#8249;
        </button>
      )}
      {current < maxIndex && (
        <button className="img-slider-btn img-slider-next" onClick={() => goTo(current + 1)} aria-label="다음">
          &#8250;
        </button>
      )}

      {/* 인디케이터 */}
      {images.length > 1 && (
        <div className="img-slider-dots">
          {images.map((_, i) => (
            <button
              key={i}
              className={`img-slider-dot ${i === current ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`이미지 ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
