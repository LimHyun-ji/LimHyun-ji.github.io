'use client';

import { useState } from 'react';
import Link from 'next/link';
import KeepWords from '@/components/KeepWords';
import { glue } from '@/lib/keepWords';

// 역량별로 보기 — 역량 원 4개가 바퀴처럼 배치되고, 원을 누르면 바퀴가 회전해 누른 원이 12시로 온다.
// 가운데 원에는 선택된 역량, 아래에는 해당 시스템 카드(회전 등장) + 나머지 시스템("그 외").
export interface OrbitSystem { slug: string; title: string; tags?: string[]; }
export interface OrbitGroup { id: string; title: string; sub?: string; systems: { slug: string; basis: string }[]; }

// 원 위치(각도, 12시 = 0, 시계 방향). 1번 위 · 2번 왼쪽 · 3번 오른쪽 · 4번 아래
const ANGLES = [0, 270, 90, 180];

export default function CompetencyOrbit({ groups, systems }: { groups: OrbitGroup[]; systems: OrbitSystem[] }) {
  const [sel, setSel] = useState(0);
  const [rot, setRot] = useState(0); // 바퀴 누적 회전각 (가까운 방향으로 돌기 위해 누적)
  const g = groups[sel];
  if (!g) return null;

  const select = (i: number) => {
    const target = -ANGLES[i % ANGLES.length];
    const delta = ((((target - rot) % 360) + 540) % 360) - 180; // -180 ~ 180
    setRot(rot + delta);
    setSel(i);
  };

  const bySlug = new Map(systems.map((s) => [s.slug, s]));
  const picked = g.systems.filter((x) => bySlug.has(x.slug));
  const pickedSet = new Set(picked.map((x) => x.slug));
  const others = systems.filter((s) => !pickedSet.has(s.slug));

  return (
    <div className="orbit">
      <div className="wheel" style={{ ['--rot' as string]: `${rot}deg` }}>
        <span className="wheel-marker" aria-hidden="true">▼</span>
        <div className="wheel-ring" role="tablist" aria-label="역량">
          {groups.slice(0, ANGLES.length).map((x, i) => (
            <button key={x.id} role="tab" aria-selected={i === sel} className={`wheel-node${i === sel ? ' on' : ''}`}
              style={{ ['--a' as string]: `${ANGLES[i]}deg` }} onClick={() => select(i)}>
              <span>{glue(x.title)}</span>
            </button>
          ))}
        </div>
        <div className="wheel-core" key={g.id}>
          <strong>{picked.length}</strong>
          <span>개 시스템</span>
        </div>
      </div>

      <div className="orbit-stage" role="tabpanel" key={g.id}>
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
