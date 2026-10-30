'use client';

import { useState } from 'react';
import Link from 'next/link';
import { glue } from '@/lib/keepWords';
import type { CompetencyGroup } from '@/lib/content';

// 어떻게 일하나 — 행동 패턴 원 4개가 타원 궤도를 도는 3D 회전목마. 원을 누르면 가까운 방향으로 돌아 정면으로 온다.
// 아래에는 그 패턴이 드러난 사례(상황 → 판단 → 결과)와 관련 시스템 링크.
// CSS 3D + @property 각도 애니메이션(라이브러리 없음).

// 궤도 위 각도(0 = 정면). 처음 정면은 1번, 2번 왼쪽 · 3번 오른쪽 · 4번 뒤
const ANGLES = [0, 270, 90, 180];

export default function WorkStyleCarousel({ groups, systemTitles }: {
  groups: CompetencyGroup[];
  systemTitles: Record<string, string>; // slug → 시스템 이름(링크 표시용)
}) {
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

  return (
    <div className="ws">
      <div className="carousel" style={{ ['--rot' as string]: `${rot}deg` }}>
        <span className="carousel-orbit" aria-hidden="true" />
        <div className="carousel-ring" role="tablist" aria-label="일하는 방식">
          {groups.slice(0, ANGLES.length).map((x, i) => (
            <button key={x.id} role="tab" aria-selected={i === sel} className={`carousel-node${i === sel ? ' on' : ''}`}
              style={{ ['--a' as string]: `${ANGLES[i]}deg` }} onClick={() => select(i)}>
              <span>{glue(x.title)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ws-panel" role="tabpanel" key={g.id}>
        {g.headline && <p className="ws-headline">{glue(g.headline)}</p>}
        <ol className="ws-cases">
          {g.cases.map((c) => (
            <li className="ws-case" key={c.title}>
              <div className="ws-case-head">
                <h4>{glue(c.title)}</h4>
                {c.slug && systemTitles[c.slug] && (
                  <Link href={`/projects/${c.slug}/`}>{glue(systemTitles[c.slug])}{' '}→</Link>
                )}
              </div>
              <dl>
                <dt>상황</dt><dd>{glue(c.situation)}</dd>
                <dt>판단</dt><dd>{glue(c.decision)}</dd>
                <dt>결과</dt><dd>{glue(c.result)}</dd>
              </dl>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
