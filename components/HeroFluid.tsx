'use client';
import { useEffect, useRef } from 'react';

/**
 * 히어로 배경 — WebGL2 유체 시뮬레이션 (Stable Fluids)
 * 마우스 움직임을 속도 · 색으로 주입하면, 이류(advection) · 와도 보강(vorticity) · 압력 투영(pressure projection)을 거쳐
 * 부드러운 소용돌이로 퍼진다. 마우스가 없으면 자동 데모 경로로 천천히 움직인다.
 * - 외부 라이브러리 없음 (Three.js 미사용)
 * - 커서 위치를 매 프레임 그대로 주입 → 보간 지연 없음
 * - 화면 밖이면 정지, 동작 줄이기 설정이면 실행 안 함, WebGL2/half-float 미지원 기기는 그리지 않음
 */

// 단색 — 사이트 강조색(초록) 한 가지만 사용
const COLOR_DARK = [0.13, 0.66, 0.38];
const COLOR_LIGHT = [0.06, 0.48, 0.26];

const VERT = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0); vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y); vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
`;

const SPLAT = HEAD + `
uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;
void main () {
  vec2 p = vUv - point; p.x *= aspectRatio;
  vec3 s = exp(-dot(p, p) / radius) * color;
  o = vec4(texture(uTarget, vUv).xyz + s, 1.0);
}`;

const ADVECT = HEAD + `
uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform float dt; uniform float dissipation;
void main () {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  o = texture(uSource, coord) / (1.0 + dissipation * dt);
}`;

const DIVERGENCE = HEAD + `
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).x; float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y; float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const CURL = HEAD + `
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).y; float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x; float B = texture(uVelocity, vB).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

const VORTICITY = HEAD + `
uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;
void main () {
  float L = texture(uCurl, vL).x; float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x; float B = texture(uCurl, vB).x; float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001; force *= curl * C; force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * dt;
  o = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`;

const PRESSURE = HEAD + `
uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main () {
  float L = texture(uPressure, vL).x; float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x; float B = texture(uPressure, vB).x;
  float d = texture(uDivergence, vUv).x;
  o = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT = HEAD + `
uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main () {
  float L = texture(uPressure, vL).x; float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x; float B = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  o = vec4(v, 0.0, 1.0);
}`;

const CLEAR = HEAD + `
uniform sampler2D uTexture; uniform float value;
void main () { o = value * texture(uTexture, vUv); }`;

// 화면 출력 — 색의 밝기를 알파로 써서 페이지 배경 위에 은은하게 겹친다
const DISPLAY = HEAD + `
uniform sampler2D uTexture; uniform float intensity; uniform float maxAlpha;
void main () {
  vec3 c = texture(uTexture, vUv).rgb * intensity;
  float a = clamp(max(c.r, max(c.g, c.b)), 0.0, maxAlpha);
  o = vec4(min(c, vec3(a)), a);
}`;

type FBO = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number; ts: [number, number] };
type DFBO = { read: FBO; write: FBO; swap: () => void; w: number; h: number; ts: [number, number] };

export default function HeroFluid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const host = canvas.parentElement;
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) return; // half-float 렌더 타깃 미지원 → 그리지 않음

    const isMobile = window.innerWidth < 720;
    const SIM_RES = isMobile ? 64 : 128;
    const DYE_RES = isMobile ? 128 : 256; // 낮은 해상도 + 선형 보간 → 흐릿하게 번지는 느낌

    // ── 셰이더 / 프로그램 ──
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const program = (fs: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, vs); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, 'aPosition'); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
      const u: Record<string, WebGLUniformLocation | null> = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i)!.name; u[name] = gl.getUniformLocation(p, name); }
      return { p, u };
    };
    let P: Record<string, ReturnType<typeof program>>;
    try {
      P = { splat: program(SPLAT), advect: program(ADVECT), div: program(DIVERGENCE), curl: program(CURL),
        vort: program(VORTICITY), press: program(PRESSURE), grad: program(GRADIENT), clear: program(CLEAR), display: program(DISPLAY) };
    } catch { return; }

    // 화면 전체 사각형
    const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);

    const blit = (target: FBO | null) => {
      if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); }
      else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

    // ── 렌더 타깃 ──
    const createFBO = (w: number, h: number, internal: number, format: number): FBO => {
      gl.activeTexture(gl.TEXTURE0);
      const tex = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
      const fb = gl.createFramebuffer()!; gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fb, w, h, ts: [1 / w, 1 / h] };
    };
    const createDFBO = (w: number, h: number, internal: number, format: number): DFBO => {
      const d: DFBO = { read: createFBO(w, h, internal, format), write: createFBO(w, h, internal, format), w, h, ts: [1 / w, 1 / h],
        swap() { const t = d.read; d.read = d.write; d.write = t; } };
      return d;
    };
    const res = (r: number) => {
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight || 1;
      const min = Math.round(r), max = Math.round(r * (aspect > 1 ? aspect : 1 / aspect));
      return aspect > 1 ? { w: max, h: min } : { w: min, h: max };
    };

    let velocity: DFBO, dye: DFBO, pressure: DFBO, divergence: FBO, curl: FBO;
    const initFBOs = () => {
      const s = res(SIM_RES), d = res(DYE_RES);
      velocity = createDFBO(s.w, s.h, gl.RG16F, gl.RG);
      dye = createDFBO(d.w, d.h, gl.RGBA16F, gl.RGBA);
      pressure = createDFBO(s.w, s.h, gl.R16F, gl.RED);
      divergence = createFBO(s.w, s.h, gl.R16F, gl.RED);
      curl = createFBO(s.w, s.h, gl.R16F, gl.RED);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);
      const w = Math.max(1, Math.floor(host.clientWidth * dpr)), h = Math.max(1, Math.floor(host.clientHeight * dpr));
      // 크기가 바뀌었거나 아직 렌더 타깃이 없으면(재마운트 포함) 새로 만든다
      if (canvas.width !== w || canvas.height !== h || !velocity) { canvas.width = w; canvas.height = h; initFBOs(); }
    };
    resize();
    window.addEventListener('resize', resize);

    // ── 테마 ──
    let light = false;
    const applyTheme = () => { light = document.documentElement.getAttribute('data-theme') === 'light'; };
    applyTheme();
    window.addEventListener('themechange', applyTheme);

    const bindTex = (unit: number, tex: WebGLTexture) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); return unit; };

    // ── 색 · 속도 주입 ──
        const splat = (x: number, y: number, dx: number, dy: number, strength = 1) => {
      const aspect = canvas.width / canvas.height;
      gl.useProgram(P.splat.p);
      gl.uniform1i(P.splat.u.uTarget, bindTex(0, velocity.read.tex));
      gl.uniform1f(P.splat.u.aspectRatio, aspect);
      gl.uniform2f(P.splat.u.point, x, y);
      gl.uniform3f(P.splat.u.color, dx, dy, 0);
      gl.uniform1f(P.splat.u.radius, (isMobile ? 0.9 : 0.6) / 100 * (aspect > 1 ? aspect : 1));
      blit(velocity.write); velocity.swap();
      const c = light ? COLOR_LIGHT : COLOR_DARK;
      const k = (light ? 0.05 : 0.045) * strength;
      gl.uniform1i(P.splat.u.uTarget, bindTex(0, dye.read.tex));
      gl.uniform3f(P.splat.u.color, c[0] * k, c[1] * k, c[2] * k);
      blit(dye.write); dye.swap();
    };

    // ── 시뮬레이션 한 스텝 ──
    const step = (dt: number) => {
      gl.disable(gl.BLEND);
      gl.useProgram(P.curl.p);
      gl.uniform2fv(P.curl.u.texelSize, velocity.ts);
      gl.uniform1i(P.curl.u.uVelocity, bindTex(0, velocity.read.tex));
      blit(curl);

      gl.useProgram(P.vort.p);
      gl.uniform2fv(P.vort.u.texelSize, velocity.ts);
      gl.uniform1i(P.vort.u.uVelocity, bindTex(0, velocity.read.tex));
      gl.uniform1i(P.vort.u.uCurl, bindTex(1, curl.tex));
      gl.uniform1f(P.vort.u.curl, 6); gl.uniform1f(P.vort.u.dt, dt);
      blit(velocity.write); velocity.swap();

      gl.useProgram(P.div.p);
      gl.uniform2fv(P.div.u.texelSize, velocity.ts);
      gl.uniform1i(P.div.u.uVelocity, bindTex(0, velocity.read.tex));
      blit(divergence);

      gl.useProgram(P.clear.p);
      gl.uniform1i(P.clear.u.uTexture, bindTex(0, pressure.read.tex));
      gl.uniform1f(P.clear.u.value, 0.8);
      blit(pressure.write); pressure.swap();

      gl.useProgram(P.press.p);
      gl.uniform2fv(P.press.u.texelSize, velocity.ts);
      gl.uniform1i(P.press.u.uDivergence, bindTex(0, divergence.tex));
      for (let i = 0; i < 20; i++) {
        gl.uniform1i(P.press.u.uPressure, bindTex(1, pressure.read.tex));
        blit(pressure.write); pressure.swap();
      }

      gl.useProgram(P.grad.p);
      gl.uniform2fv(P.grad.u.texelSize, velocity.ts);
      gl.uniform1i(P.grad.u.uPressure, bindTex(0, pressure.read.tex));
      gl.uniform1i(P.grad.u.uVelocity, bindTex(1, velocity.read.tex));
      blit(velocity.write); velocity.swap();

      gl.useProgram(P.advect.p);
      gl.uniform2fv(P.advect.u.texelSize, velocity.ts);
      gl.uniform1f(P.advect.u.dt, dt);
      gl.uniform1i(P.advect.u.uVelocity, bindTex(0, velocity.read.tex));
      gl.uniform1i(P.advect.u.uSource, bindTex(0, velocity.read.tex));
      gl.uniform1f(P.advect.u.dissipation, 0.25);
      blit(velocity.write); velocity.swap();

      gl.uniform1i(P.advect.u.uVelocity, bindTex(0, velocity.read.tex));
      gl.uniform1i(P.advect.u.uSource, bindTex(1, dye.read.tex));
      gl.uniform1f(P.advect.u.dissipation, 1.8); // 색이 빨리 옅어져 화면에 쌓이지 않음
      blit(dye.write); dye.swap();
    };

    const render = () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(P.display.p);
      gl.uniform2f(P.display.u.texelSize, 1 / canvas.width, 1 / canvas.height);
      gl.uniform1i(P.display.u.uTexture, bindTex(0, dye.read.tex));
      gl.uniform1f(P.display.u.intensity, light ? 0.8 : 0.9);
      gl.uniform1f(P.display.u.maxAlpha, light ? 0.22 : 0.25); // 글자를 가리지 않도록 최대 농도 제한
      blit(null);
    };

    // ── 입력: 커서 이동량을 그대로 속도로 주입 (보간 없음) ──
    const pointer = { x: 0, y: 0, px: 0, py: 0, moved: false, inside: false, lastMove: 0 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
      pointer.inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      if (!pointer.inside) return;
      if (!pointer.moved) { pointer.px = x; pointer.py = y; }
      pointer.x = x; pointer.y = y; pointer.moved = true; pointer.lastMove = performance.now();
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    // ── 루프 ──
    let visible = true, raf = 0, last = performance.now(), disposed = false, demoT = 0;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) { last = performance.now(); loop(); } }, { threshold: 0 });
    io.observe(host);

    const loop = () => {
      if (disposed || !visible) return;
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      resize();

      if (pointer.moved) {
        const dx = (pointer.x - pointer.px) * 3500, dy = (pointer.y - pointer.py) * 3500;
        if (dx !== 0 || dy !== 0) { splat(pointer.x, pointer.y, dx, dy); }
        pointer.px = pointer.x; pointer.py = pointer.y;
      }
      // 마우스가 2초 이상 멈추면 자동 데모 — 리사주 곡선을 따라 천천히 저을 때처럼
      if (now - pointer.lastMove > 2000) {
        demoT += dt * 0.35;
        const x = 0.5 + 0.32 * Math.sin(demoT * 1.3), y = 0.5 + 0.28 * Math.sin(demoT * 1.9 + 1.1);
        const x2 = 0.5 + 0.32 * Math.sin((demoT + dt * 0.35) * 1.3), y2 = 0.5 + 0.28 * Math.sin((demoT + dt * 0.35) * 1.9 + 1.1);
        splat(x, y, (x2 - x) * 2000, (y2 - y) * 2000, 0.3);
      }
      step(dt);
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true; cancelAnimationFrame(raf); io.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('themechange', applyTheme);
      // 컨텍스트는 끊지 않는다 — 같은 캔버스에서 다시 마운트(StrictMode 등)될 때 재사용
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}
