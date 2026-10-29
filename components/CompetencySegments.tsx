'use client';

import { useState } from 'react';
import Link from 'next/link';
import KeepWords from '@/components/KeepWords';
import { glue } from '@/lib/keepWords';

// 역량별로 보기 — 세그먼트 탭(역량)을 고르면 아래에 해당 시스템 카드, 나머지 시스템은 "그 외"로 작게.
// 한 시스템이 여러 역량에 속할 수 있고, 카드에는 그 역량을 고른 근거 한 줄을 보여 준다.
export interface SegmentSystem { slug: string; title: string; tags?: string[]; }
export interface SegmentGroup { id: string; title: string; sub?: string; systems: { slug: string; basis: string }[]; }

export default function CompetencySegments({ groups, systems }: { groups: SegmentGroup[]; systems: SegmentSystem[] }) {
  const [sel, setSel] = useState(0);
  const g = groups[sel];
  if (!g) return null;
  const bySlug = new Map(systems.map((s) => [s.slug, s]));
  const picked = g.systems.filter((x) => bySlug.has(x.slug));
  const pickedSet = new Set(picked.map((x) => x.slug));
  const others = systems.filter((s) => !pickedSet.has(s.slug));

  return (
    <div className="seg">
      <div className="seg-bar" role="tablist" aria-label="역량"
        style={{ ['--n' as string]: groups.length, ['--i' as string]: sel }}>
        <span className="seg-thumb" aria-hidden="true" />
        {groups.map((x, i) => (
          <button key={x.id} role="tab" aria-selected={i === sel} className={`seg-btn${i === sel ? ' on' : ''}`}
            onClick={() => setSel(i)}>
            {glue(x.title)}
          </button>
        ))}
      </div>

      <div className="seg-panel" role="tabpanel" key={g.id}>
        {g.sub && <p className="seg-sub">{glue(g.sub)}</p>}
        <ul className="seg-list">
          {picked.map((x) => {
            const s = bySlug.get(x.slug)!;
            return (
              <li key={s.slug}>
                <Link className="seg-item" href={`/projects/${s.slug}/`}>
                  <h4><KeepWords text={s.title} /><span className="arrow">{' '}→</span></h4>
                  <p>{glue(x.basis)}</p>
                  {s.tags && <span className="seg-tags">{glue(s.tags.slice(0, 4).join(' · '))}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {others.length > 0 && (
        <div className="seg-others">
          <span className="seg-others-h">그 외</span>
          {others.map((s, i) => (
            <span key={s.slug}>
              {i > 0 && <i className="seg-dot" aria-hidden="true">·</i>}
              <Link href={`/projects/${s.slug}/`}><KeepWords text={s.title.split(' — ')[0]} /></Link>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
