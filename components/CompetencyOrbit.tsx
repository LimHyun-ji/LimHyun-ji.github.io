'use client';

import { useState } from 'react';
import Link from 'next/link';
import KeepWords from '@/components/KeepWords';
import { glue } from '@/lib/keepWords';

// 역량별로 보기 — 위쪽 원(역량) 중 하나를 고르면 아래 큰 원 + 해당 시스템 카드가 회전하며 바뀌고,
// 나머지 시스템은 "그 외"로 작게 표시. 모든 시스템이 항상 화면에 보인다.
export interface OrbitSystem { slug: string; title: string; tags?: string[]; }
export interface OrbitGroup { id: string; title: string; sub?: string; systems: { slug: string; basis: string }[]; }

export default function CompetencyOrbit({ groups, systems }: { groups: OrbitGroup[]; systems: OrbitSystem[] }) {
  const [sel, setSel] = useState(0);
  const g = groups[sel];
  if (!g) return null;
  const bySlug = new Map(systems.map((s) => [s.slug, s]));
  const picked = g.systems.filter((x) => bySlug.has(x.slug));
  const pickedSet = new Set(picked.map((x) => x.slug));
  const others = systems.filter((s) => !pickedSet.has(s.slug));

  return (
    <div className="orbit">
      <div className="orbit-row" role="tablist" aria-label="역량">
        {groups.map((x, i) => (
          <button key={x.id} role="tab" aria-selected={i === sel} className={`orbit-dot${i === sel ? ' on' : ''}`}
            onClick={() => setSel(i)}>
            <span>{glue(x.title)}</span>
          </button>
        ))}
      </div>

      {/* key가 바뀌면 다시 마운트되어 회전 애니메이션이 재생됨 */}
      <div className="orbit-stage" role="tabpanel" key={g.id}>
        <div className="orbit-core">
          <strong>{glue(g.title)}</strong>
          <span>{picked.length}개 시스템</span>
        </div>
        {g.sub && <p className="orbit-sub">{glue(g.sub)}</p>}
        <div className="orbit-cards">
          {picked.map((x, i) => {
            const s = bySlug.get(x.slug)!;
            return (
              <Link className="orbit-card" href={`/projects/${s.slug}/`} key={s.slug} style={{ animationDelay: `${i * 70}ms` }}>
                <h4><KeepWords text={s.title} /><span className="arrow">{' '}→</span></h4>
                <p>{glue(x.basis)}</p>
                {s.tags && <ul className="chips small">{s.tags.slice(0, 4).map((t) => <li key={t}>{t}</li>)}</ul>}
              </Link>
            );
          })}
        </div>
      </div>

      {others.length > 0 && (
        <div className="orbit-others">
          <span className="orbit-others-h">그 외</span>
          <ul>
            {others.map((s) => (
              <li key={s.slug}><Link href={`/projects/${s.slug}/`}><KeepWords text={s.title.split(' — ')[0]} /></Link></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
