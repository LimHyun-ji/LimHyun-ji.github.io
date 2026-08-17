'use client';

import { useState } from 'react';

interface DocPreviewProps {
  url: string;
  title?: string;
}

export default function DocPreview({ url, title = '기술소개서' }: DocPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  return (
    <section className="doc-preview-section">
      <div className="doc-preview-header">
        <h2 className="doc-preview-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
          </svg>
          {title}
        </h2>
        <div className="doc-preview-actions">
          <button
            className="doc-preview-toggle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '접기' : '펼치기'}
          </button>
          <a className="doc-preview-open" href={url} target="_blank" rel="noopener">
            새 탭에서 열기 ↗
          </a>
        </div>
      </div>

      <div className={`doc-preview-frame ${expanded ? 'doc-preview-expanded' : ''}`}>
        {!loadError ? (
          <iframe
            src={url}
            title={title}
            loading="lazy"
            onError={() => setLoadError(true)}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        ) : (
          <div className="doc-preview-fallback">
            <p>미리보기를 불러올 수 없습니다.</p>
            <a className="btn" href={url} target="_blank" rel="noopener">
              원본 링크에서 보기 →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
