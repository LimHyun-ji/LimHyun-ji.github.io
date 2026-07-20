'use client';
import { useEffect, useRef, useState } from 'react';
import type { Loadout, HelmetVariant, ArmorVariant, WeaponVariant } from '@/lib/visualDataScene';
import type { VisualDataScene } from '@/lib/visualDataScene';

// runtime-safe literal matching DEFAULT_LOADOUT
const INITIAL_LOADOUT: Loadout = { helmet: 'knight', armor: 'emerald', weapon: 'sword', cape: true };

const PRESETS: { label: string; loadout: Loadout }[] = [
  { label: '전사', loadout: { helmet: 'knight', armor: 'steel', weapon: 'axe', cape: false } },
  { label: '마법사', loadout: { helmet: 'horned', armor: 'emerald', weapon: 'staff', cape: true } },
  { label: '기본', loadout: INITIAL_LOADOUT },
];

const HELMETS: HelmetVariant[] = ['none', 'knight', 'horned'];
const ARMORS: ArmorVariant[] = ['emerald', 'gold', 'steel'];
const WEAPONS: WeaponVariant[] = ['none', 'sword', 'staff', 'axe'];

export default function VisualDataDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<VisualDataScene | null>(null);
  const [loadout, setLoadout] = useState<Loadout>(INITIAL_LOADOUT);
  const [autoRotate, setAutoRotate] = useState(false);

  // initialise scene once; default auto-rotate off for prefers-reduced-motion
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;

    (async () => {
      const mod = await import('@/lib/visualDataScene');
      if (disposed) return;
      const scene = await mod.createVisualDataScene(canvas, mod.DEFAULT_LOADOUT);
      if (disposed) { scene.dispose(); return; }
      sceneRef.current = scene;
      scene.setAutoRotate(!reduceMotion ? false : false); // always off at mount
    })();

    const onResize = () => sceneRef.current?.resize();
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  function applyLoadout(next: Loadout) {
    setLoadout(next);
    sceneRef.current?.applyLoadout(next, { highlight: true });
  }

  function patchHelmet(v: HelmetVariant) {
    applyLoadout({ ...loadout, helmet: v });
  }
  function patchArmor(v: ArmorVariant) {
    applyLoadout({ ...loadout, armor: v });
  }
  function patchWeapon(v: WeaponVariant) {
    applyLoadout({ ...loadout, weapon: v });
  }
  function patchCape(on: boolean) {
    applyLoadout({ ...loadout, cape: on });
  }
  function toggleAutoRotate() {
    const next = !autoRotate;
    setAutoRotate(next);
    sceneRef.current?.setAutoRotate(next);
  }

  return (
    <section className="vd-demo">
      {/* 3D canvas */}
      <div className="vd-stage">
        <canvas ref={canvasRef} className="vd-canvas" aria-label="캐릭터 3D 프리뷰" />
      </div>

      {/* control panel */}
      <div className="vd-panel">
        <p className="vd-caption">
          Sol VisualData 시스템 웹 재현 — 파츠·Override Material·소켓 어태치먼트를 데이터로 교체, 바뀐 파츠만 갱신(전이 규칙)
        </p>

        {/* 헬멧 */}
        <div className="vd-group">
          <h4>헬멧 <span>(파츠)</span></h4>
          <div className="vd-opts" role="group" aria-label="헬멧 선택">
            {HELMETS.map((v) => (
              <button
                key={v}
                className={`vd-opt${loadout.helmet === v ? ' active' : ''}`}
                aria-pressed={loadout.helmet === v}
                onClick={() => patchHelmet(v)}
              >
                {v === 'none' ? '없음' : v === 'knight' ? '기사' : '뿔'}
              </button>
            ))}
          </div>
        </div>

        {/* 방어구 */}
        <div className="vd-group">
          <h4>방어구 <span>(Override Material)</span></h4>
          <div className="vd-opts" role="group" aria-label="방어구 재질 선택">
            {ARMORS.map((v) => (
              <button
                key={v}
                className={`vd-opt${loadout.armor === v ? ' active' : ''}`}
                aria-pressed={loadout.armor === v}
                onClick={() => patchArmor(v)}
              >
                {v === 'emerald' ? '에메랄드' : v === 'gold' ? '골드' : '강철'}
              </button>
            ))}
          </div>
        </div>

        {/* 무기 */}
        <div className="vd-group">
          <h4>무기 <span>(어태치먼트)</span></h4>
          <div className="vd-opts" role="group" aria-label="무기 선택">
            {WEAPONS.map((v) => (
              <button
                key={v}
                className={`vd-opt${loadout.weapon === v ? ' active' : ''}`}
                aria-pressed={loadout.weapon === v}
                onClick={() => patchWeapon(v)}
              >
                {v === 'none' ? '없음' : v === 'sword' ? '검' : v === 'staff' ? '지팡이' : '도끼'}
              </button>
            ))}
          </div>
        </div>

        {/* 망토 */}
        <div className="vd-group">
          <h4>망토 <span>(파츠)</span></h4>
          <div className="vd-opts" role="group" aria-label="망토 ON/OFF">
            <button
              className={`vd-opt${loadout.cape ? ' active' : ''}`}
              aria-pressed={loadout.cape}
              onClick={() => patchCape(true)}
            >
              ON
            </button>
            <button
              className={`vd-opt${!loadout.cape ? ' active' : ''}`}
              aria-pressed={!loadout.cape}
              onClick={() => patchCape(false)}
            >
              OFF
            </button>
          </div>
        </div>

        {/* 프리셋 */}
        <div className="vd-group">
          <h4>프리셋 <span>(전체 교체)</span></h4>
          <div className="vd-presets" role="group" aria-label="프리셋 선택">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className="vd-opt"
                onClick={() => applyLoadout(p.loadout)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 자동 회전 */}
        <div className="vd-group">
          <h4>자동 회전</h4>
          <div className="vd-opts">
            <button
              className={`vd-opt${autoRotate ? ' active' : ''}`}
              aria-pressed={autoRotate}
              onClick={toggleAutoRotate}
            >
              {autoRotate ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* 데이터 주도 강조 */}
        <div className="vd-data" aria-label="현재 로드아웃 데이터">
          <span>{'{'}</span>
          {' '}helmet:{' '}
          <em>&quot;{loadout.helmet}&quot;</em>,{' '}
          armor:{' '}
          <em>&quot;{loadout.armor}&quot;</em>,{' '}
          weapon:{' '}
          <em>&quot;{loadout.weapon}&quot;</em>,{' '}
          cape:{' '}
          <em>{String(loadout.cape)}</em>
          {' '}<span>{'}'}</span>
        </div>
      </div>
    </section>
  );
}
