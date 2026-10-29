'use client';

import { useState } from 'react';
import Link from 'next/link';
import { glue } from '@/lib/keepWords';
import type { CompetencyGroup } from '@/lib/content';

// 역량 탭 + 탭 안 페이지 넘김. 한 페이지에 PAGE_SIZE개씩 표시.
const PAGE_SIZE = 4;

export default function CompetencyTabs({ groups, systemTitles }: {
  groups: CompetencyGroup[];
  systemTitles: Record<string, string>; // slug → 담당 시스템 카드 제목(링크 표시용)
}) {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const g = groups[tab];
  if (!g) return null;
  const pages = Math.ceil(g.items.length / PAGE_SIZE);
  const items = g.items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const selectTab = (i: number) => { setTab(i); setPage(0); };

  return (
    <div className="cp">
      <div className="cp-tabs" role="tablist" aria-label="역량">
        {groups.map((x, i) => (
          <button key={x.id} role="tab" aria-selected={i === tab} className={`cp-tab${i === tab ? ' on' : ''}`}
            onClick={() => selectTab(i)}>
            <span className="cp-tab-no">{String(i + 1).padStart(2, '0')}</span>
            {glue(x.title)}
            <span className="cp-tab-count">{x.items.length}</span>
          </button>
        ))}
      </div>

      <div className="cp-panel" role="tabpanel">
        {g.sub && <p className="cp-sub">{glue(g.sub)}</p>}
        <ol className="cp-list">
          {items.map((it, i) => (
            <li className="cp-item" key={`${g.id}-${page}-${i}`}>
              <span className="cp-tag">{glue(it.tag)}</span>
              <div className="cp-body">
                <p className="cp-problem"><b>병목</b>{glue(it.problem)}</p>
                <p className="cp-fix"><b>해결</b>{glue(it.fix)}</p>
              </div>
              {it.link && systemTitles[it.link] && (
                <Link className="cp-link" href={`/projects/${it.link}/`}>{glue(systemTitles[it.link])}{' '}→</Link>
              )}
            </li>
          ))}
        </ol>

        {pages > 1 && (
          <div className="cp-pager">
            <button className="cp-pg" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="이전">←</button>
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} className={`cp-dot${i === page ? ' on' : ''}`} onClick={() => setPage(i)}
                aria-label={`${i + 1}페이지`} aria-current={i === page} />
            ))}
            <button className="cp-pg" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page === pages - 1} aria-label="다음">→</button>
            <span className="cp-pg-text">{page + 1} / {pages}</span>
          </div>
        )}
      </div>
    </div>
  );
}
