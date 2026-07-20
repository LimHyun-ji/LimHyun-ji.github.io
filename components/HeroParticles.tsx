'use client';
import { useEffect, useRef } from 'react';

/**
 * 히어로 배경 3D 씬 (oryzo.ai / Lusion 무드 참고).
 * - 떠다니는 추상 3D 오브젝트(저폴리 젬 + 글로시 메탈) + 은은한 입자 필드
 * - Emerald Forge 팔레트(에메랄드·골드), 다크/라이트 테마 대응
 * - three는 useEffect 안에서 동적 import → 첫 로드 번들 분리
 * - 마우스 시차, 모바일 축소, prefers-reduced-motion 정지, 뷰포트 밖 렌더 정지, 언마운트 dispose
 */
export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import('three');
      if (disposed || !canvas.parentElement) return;
      const host = canvas.parentElement;
      const isMobile = window.innerWidth < 720;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);
      camera.position.set(0, 0, 18);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      // 환경 반사 (글로시 메탈용) — 외부 에셋 없이 RoomEnvironment 절차 생성
      let envRT: any = null;
      try {
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
        const pmrem = new THREE.PMREMGenerator(renderer);
        envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
        scene.environment = envRT.texture;
        pmrem.dispose();
      } catch { /* 환경맵 실패 시 조명만으로 렌더 */ }

      // 조명
      scene.add(new THREE.AmbientLight(0x2a4438, 0.7));
      const key = new THREE.PointLight(0x3fd69a, 620, 120); key.position.set(14, 12, 16); scene.add(key);
      const fill = new THREE.PointLight(0xf2b23e, 340, 120); fill.position.set(-16, -8, 10); scene.add(fill);
      const rim = new THREE.DirectionalLight(0xbfeadd, 0.5); rim.position.set(-6, 8, -10); scene.add(rim);

      // 팔레트
      const EM = 0x3fd69a, EM2 = 0x1f9d6b, GOLD = 0xf2b23e, MINT = 0x8ef0cd;

      const group = new THREE.Group();
      scene.add(group);

      const geom = (kind: string) => {
        switch (kind) {
          case 'ico': return new THREE.IcosahedronGeometry(1, 0);
          case 'octa': return new THREE.OctahedronGeometry(1, 0);
          case 'dodeca': return new THREE.DodecahedronGeometry(1, 0);
          case 'torusknot': return new THREE.TorusKnotGeometry(0.7, 0.26, 128, 20);
          case 'torus': return new THREE.TorusGeometry(0.8, 0.3, 24, 64);
          default: return new THREE.SphereGeometry(1, 48, 48);
        }
      };

      // 오브젝트 배치 (중앙은 비워 텍스트 가독성 확보 → 좌우/뒤쪽 위주)
      // 가장자리로 배치해 중앙 텍스트를 감싸는 구도 (가독성 확보)
      const defs = [
        { kind: 'torusknot', x: -13.5, y: 5.0, z: -3, s: 2.0, color: EM, gem: false },
        { kind: 'ico', x: 13.2, y: 4.4, z: -3, s: 1.9, color: GOLD, gem: true },
        { kind: 'octa', x: 11.5, y: -3.8, z: -1, s: 1.6, color: MINT, gem: true },
        { kind: 'sphere', x: -12, y: -3.8, z: -4, s: 1.5, color: EM2, gem: false },
        { kind: 'dodeca', x: -6.5, y: 6.2, z: -9, s: 1.5, color: GOLD, gem: true },
        { kind: 'torus', x: 6.5, y: 6.4, z: -10, s: 1.4, color: EM, gem: false },
        { kind: 'ico', x: 0.5, y: -6.6, z: -8, s: 1.4, color: MINT, gem: true },
      ];
      const objects = (isMobile ? defs.slice(0, 4) : defs).map((d, i) => {
        const g = geom(d.kind);
        if (d.gem) g.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({
          color: d.color,
          metalness: d.gem ? 0.35 : 0.92,
          roughness: d.gem ? 0.45 : 0.14,
          flatShading: d.gem,
          emissive: d.color,
          emissiveIntensity: d.gem ? 0.12 : 0.05,
          envMapIntensity: 1.1,
        });
        const mesh = new THREE.Mesh(g, mat);
        mesh.position.set(d.x, d.y, d.z);
        mesh.scale.setScalar(d.s);
        (mesh as any).userData = {
          rot: new THREE.Vector3((Math.random() - 0.5) * 0.14, (Math.random() - 0.5) * 0.14, (Math.random() - 0.5) * 0.08),
          amp: 0.5 + Math.random() * 0.6, spd: 0.35 + Math.random() * 0.4, ph: i * 1.7, baseY: d.y,
        };
        group.add(mesh);
        return mesh;
      });

      // 입자 필드 (은은한 배경)
      const COUNT = isMobile ? 700 : 1600;
      const pos = new Float32Array(COUNT * 3);
      for (let i = 0; i < COUNT; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 90;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 55;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 8;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pMat = new THREE.PointsMaterial({ size: 0.12, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const points = new THREE.Points(pGeo, pMat);
      scene.add(points);

      // 테마
      const applyTheme = () => {
        const light = document.documentElement.getAttribute('data-theme') === 'light';
        pMat.color.set(light ? 0x1f9d6b : 0x3fd69a);
        pMat.opacity = light ? 0.4 : 0.6;
        renderer.toneMappingExposure = light ? 1.35 : 1.15;
      };
      applyTheme();
      window.addEventListener('themechange', applyTheme);

      const resize = () => {
        const w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener('resize', resize);

      const target = { x: 0, y: 0 };
      const onMove = (e: MouseEvent) => {
        target.x = (e.clientX / window.innerWidth - 0.5) * 2;
        target.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener('mousemove', onMove, { passive: true });

      let visible = true;
      const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !reduceMotion) loop(); }, { threshold: 0 });
      io.observe(host);

      let raf = 0;
      const clock = new THREE.Clock();
      const render = () => {
        camera.position.x += (target.x * 1.4 - camera.position.x) * 0.03;
        camera.position.y += (-target.y * 1.1 - camera.position.y) * 0.03;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
      };
      const loop = () => {
        if (disposed || !visible) return;
        const t = clock.getElapsedTime();
        for (const m of objects) {
          const u: any = m.userData;
          m.rotation.x += u.rot.x * 0.02; m.rotation.y += u.rot.y * 0.02; m.rotation.z += u.rot.z * 0.02;
          m.position.y = u.baseY + Math.sin(t * u.spd + u.ph) * u.amp;
        }
        group.rotation.y = Math.sin(t * 0.04) * 0.12 + target.x * 0.1;
        points.rotation.y = t * 0.015;
        render();
        raf = requestAnimationFrame(loop);
      };
      if (reduceMotion) render(); else loop();

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('themechange', applyTheme);
        objects.forEach((m) => { m.geometry.dispose(); (m.material as any).dispose(); });
        pGeo.dispose(); pMat.dispose();
        envRT?.dispose?.();
        renderer.dispose();
      };
    })();

    return () => { disposed = true; cleanup(); };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}
