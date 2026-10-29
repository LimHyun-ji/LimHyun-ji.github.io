'use client';

import { useState } from 'react';
import Link from 'next/link';
import KeepWords from '@/components/KeepWords';
import { glue } from '@/lib/keepWords';

// 역량별로 보기 — 역량 원 4개가 3D 회전목마처럼 세로축을 중심으로 원형 배치된다.
// 원을 누르면 링이 가까운 방향으로 돌아 누른 원이 정면(앞)으로 오고, 나머지는 뒤쪽 원 궤도에 놓인다.
// 아래에는 해당 시스템 카드(회전 등장) + 나머지 시스템("그 외"). CSS 3D transform만 사용.
export interface OrbitSystem { slug: string; title: string; tags?: string[]; }
export interface OrbitGroup { id: string; title: string; sub?: string; systems: { slug: string; basis: string }[]; }

// 링 위 각도(0 = 정면, 세로축 기준). 처음 정면은 1번, 2번 왼쪽 · 3번 오른쪽 · 4번 뒤
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
      <div className="carousel" style={{ ['--rot' as string]: `${rot}deg` }}>
        <div className="carousel-ring" role="tablist" aria-label="역량">
          {groups.slice(0, ANGLES.length).map((x, i) => {
            // 정면에 가까울수록 진하게 (cos: 정면 1 → 뒤 -1)
            const depth = Math.cos(((ANGLES[i] + rot) * Math.PI) / 180);
            return (
              <button key={x.id} role="tab" aria-selected={i === sel} className={`carousel-node${i === sel ? ' on' : ''}`}
                style={{ ['--a' as string]: `${ANGLES[i]}deg`, opacity: 0.4 + 0.6 * ((depth + 1) / 2) }}
                onClick={() => select(i)}>
                <span>{glue(x.title)}</span>
              </button>
            );
          })}
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
