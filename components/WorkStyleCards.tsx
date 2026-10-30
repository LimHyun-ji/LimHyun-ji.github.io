'use client';

import { useState } from 'react';
import Link from 'next/link';
import { glue } from '@/lib/keepWords';
import type { CompetencyGroup } from '@/lib/content';

// 어떻게 일하나 — 역량 카드 4장을 한 번에 보여 준다. 앞면: 역량 이름 · 한 줄 주장 · 대표 증거(숫자 우선).
// "사례 보기"를 누르면 카드가 뒤집혀 사례 제목 · 결과 한 줄 · 시스템 링크가 나온다.
export default function WorkStyleCards({ groups, systemTitles }: {
  groups: CompetencyGroup[];
  systemTitles: Record<string, string>; // slug → 시스템 이름(링크 표시용)
}) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setFlipped((f) => ({ ...f, [id]: !f[id] }));

  return (
    <div className="wc-grid">
      {groups.map((g, i) => {
        const on = !!flipped[g.id];
        return (
          <div className={`wc${on ? ' flipped' : ''}`} key={g.id}>
            <div className="wc-inner">
              <section className="wc-face wc-front" aria-hidden={on}>
                <span className="wc-no">{String(i + 1).padStart(2, '0')}</span>
                <h3>{glue(g.name)}</h3>
                {g.headline && <p className="wc-claim">{glue(g.headline)}</p>}
                {g.proof && (
                  <div className="wc-proof">
                    <strong>{glue(g.proof)}</strong>
                    {g.proofLabel && <span>{glue(g.proofLabel)}</span>}
                  </div>
                )}
                <button className="wc-flip" onClick={() => toggle(g.id)} aria-expanded={on} tabIndex={on ? -1 : 0}>
                  사례 보기{' '}↻
                </button>
              </section>
              <section className="wc-face wc-back" aria-hidden={!on}>
                <h3>{glue(g.name)}</h3>
                <ol>
                  {g.cases.map((c) => (
                    <li key={c.title}>
                      {c.slug ? (
                        <Link href={`/projects/${c.slug}/`} tabIndex={on ? 0 : -1}
                          title={systemTitles[c.slug]}>{glue(c.title)}{'\u00a0'}→</Link>
                      ) : <b>{glue(c.title)}</b>}
                      <span>{glue(c.result)}</span>
                    </li>
                  ))}
                </ol>
                <button className="wc-flip" onClick={() => toggle(g.id)} tabIndex={on ? 0 : -1}>
                  앞면{' '}↻
                </button>
              </section>
            </div>
          </div>
        );
      })}
    </div>
  );
}
