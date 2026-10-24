'use client';
import { useEffect, useRef } from 'react';

/**
 * 히어로 배경 3D 씬 — 은은한 입자 필드.
 * - 텍스트 가독성을 위해 떠다니는 도형 오브젝트는 제거하고 입자만 유지
 * - 다크/라이트 테마 대응
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
        pGeo.dispose(); pMat.dispose();
        renderer.dispose();
      };
    })();

    return () => { disposed = true; cleanup(); };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}
