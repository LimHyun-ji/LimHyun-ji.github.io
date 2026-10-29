'use client';

import { useState } from 'react';
import Link from 'next/link';
import KeepWords from '@/components/KeepWords';
import { glue } from '@/lib/keepWords';

// 역량별로 보기 — 역량 원 4개가 타원 궤도를 도는 3D 회전목마. 원을 누르면 가까운 방향으로 돌아 정면으로 온다.
// 아래에는 해당 역량의 시스템 목록(제목 · 근거 한 줄 · 태그), 나머지 시스템은 "그 외"로 작게.
// 한 시스템이 여러 역량에 속할 수 있다. CSS 3D + @property 각도 애니메이션(라이브러리 없음).
export interface CarouselSystem { slug: string; title: string; tags?: string[]; }
export interface CarouselGroup { id: string; title: string; sub?: string; systems: { slug: string; basis: string }[]; }

// 궤도 위 각도(0 = 정면). 처음 정면은 1번, 2번 왼쪽 · 3번 오른쪽 · 4번 뒤
const ANGLES = [0, 270, 90, 180];

export default function CompetencyCarousel({ groups, systems }: { groups: CarouselGroup[]; systems: CarouselSystem[] }) {
  const [sel, setSel] = useState(0);
  const [rot, setRot] = useState(0); // 누적 회전각 (가까운 방향으로 돌기 위해 누적)
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
    <div className="seg">
      <div className="carousel" style={{ ['--rot' as string]: `${rot}deg` }}>
        <span className="carousel-orbit" aria-hidden="true" />
        <div className="carousel-ring" role="tablist" aria-label="역량">
          {groups.slice(0, ANGLES.length).map((x, i) => (
            <button key={x.id} role="tab" aria-selected={i === sel} className={`carousel-node${i === sel ? ' on' : ''}`}
              style={{ ['--a' as string]: `${ANGLES[i]}deg` }} onClick={() => select(i)}>
              <span>{glue(x.title)}</span>
            </button>
          ))}
        </div>
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
