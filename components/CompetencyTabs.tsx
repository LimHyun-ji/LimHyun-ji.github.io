'use client';

import { useState } from 'react';
import Link from 'next/link';
import KeepWords from '@/components/KeepWords';
import { glue } from '@/lib/keepWords';
import type { CompetencyItem } from '@/lib/content';

// 역량 탭 → 탭 안에 담당 시스템 카드. 카드에는 시스템 설명 대신 병목 → 해결만.
export interface CompetencyTab {
  id: string; title: string; sub?: string;
  systems: { slug: string; title: string; role?: string; period?: string; items: CompetencyItem[] }[];
}

export default function CompetencyTabs({ tabs }: { tabs: CompetencyTab[] }) {
  const [tab, setTab] = useState(0);
  const t = tabs[tab];
  if (!t) return null;

  return (
    <div className="cp">
      <div className="cp-tabs" role="tablist" aria-label="역량">
        {tabs.map((x, i) => (
          <button key={x.id} role="tab" aria-selected={i === tab} className={`cp-tab${i === tab ? ' on' : ''}`}
            onClick={() => setTab(i)}>
            <span className="cp-tab-no">{String(i + 1).padStart(2, '0')}</span>
            {glue(x.title)}
            <span className="cp-tab-count">{x.systems.length}</span>
          </button>
        ))}
      </div>

      <div className="cp-panel" role="tabpanel">
        {t.sub && <p className="cp-sub">{glue(t.sub)}</p>}
        <div className="cp-systems">
          {t.systems.map((s) => (
            <article className="cp-sys" key={s.slug}>
              <header className="cp-sys-head">
                <h4><Link href={`/projects/${s.slug}/`}><KeepWords text={s.title} /></Link></h4>
                {(s.role || s.period) && <p className="cp-sys-meta">{glue([s.role, s.period].filter(Boolean).join(' · '))}</p>}
              </header>
              {s.items.length > 0 && (
                <ul className="cp-list">
                  {s.items.map((it, i) => (
                    <li className="cp-item" key={i}>
                      <p className="cp-problem"><b>병목</b>{glue(it.problem)}</p>
                      <p className="cp-fix"><b>해결</b>{glue(it.fix)}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Link className="cp-more" href={`/projects/${s.slug}/`}>자세히 보기{' '}→</Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
