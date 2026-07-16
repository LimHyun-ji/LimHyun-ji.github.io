'use client';
import { useEffect, useRef } from 'react';

/**
 * 히어로 배경 3D 파티클 필드.
 * - three는 useEffect 안에서 동적 import → 서버/첫 로드 번들에서 분리, 브라우저에서만 로드
 * - 마우스 위치에 따라 카메라가 은은하게 시차(parallax) 이동
 * - 테마(data-theme) 전환 시 입자 색/투명도 조정
 * - 모바일: 입자 수·픽셀비 자동 축소 / prefers-reduced-motion: 정지
 * - 히어로가 화면 밖이면 렌더 루프 정지(배터리 절약)
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
      const COUNT = isMobile ? 1400 : 4200;
      const SPREAD = 60;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
      camera.position.z = 42;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

      // 입자 위치 (박스 볼륨에 무작위 분포)
      const positions = new Float32Array(COUNT * 3);
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * SPREAD * 1.8;
        positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
        positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        size: isMobile ? 0.16 : 0.13,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      // 테마별 색/투명도
      const applyTheme = () => {
        const light = document.documentElement.getAttribute('data-theme') === 'light';
        material.color.set(light ? 0x1f9d6b : 0x3FD69A);
        material.opacity = light ? 0.5 : 0.7;
      };
      applyTheme();
      window.addEventListener('themechange', applyTheme);

      // 리사이즈
      const resize = () => {
        const w = host.clientWidth || window.innerWidth;
        const h = host.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener('resize', resize);

      // 마우스 시차
      const target = { x: 0, y: 0 };
      const onMove = (e: MouseEvent) => {
        target.x = (e.clientX / window.innerWidth - 0.5) * 2;
        target.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener('mousemove', onMove, { passive: true });

      // 히어로가 보일 때만 애니메이션
      let visible = true;
      const io = new IntersectionObserver(
        ([entry]) => { visible = entry.isIntersecting; if (visible && !reduceMotion) loop(); },
        { threshold: 0 }
      );
      io.observe(host);

      let raf = 0;
      const clock = new THREE.Clock();
      const render = () => {
        camera.position.x += (target.x * 4 - camera.position.x) * 0.03;
        camera.position.y += (-target.y * 3 - camera.position.y) * 0.03;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
      };
      const loop = () => {
        if (disposed || !visible) return;
        const t = clock.getElapsedTime();
        points.rotation.y = t * 0.03;
        points.rotation.x = Math.sin(t * 0.05) * 0.08;
        render();
        raf = requestAnimationFrame(loop);
      };

      if (reduceMotion) {
        render(); // 정지 화면 한 프레임
      } else {
        loop();
      }

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('themechange', applyTheme);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    })();

    return () => { disposed = true; cleanup(); };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}
