// 포트폴리오 PDF 생성 — node pdf/build.mjs [버전키...]   (사전 준비: npm i --no-save puppeteer)
// slides.mjs의 데이터를 16:9 HTML 슬라이드로 렌더링한 뒤 Chrome(puppeteer)으로 PDF 출력.
// 목차 → 각 장 내부 링크, 각 장 제목 · "웹에서 보기" → 웹사이트 해당 섹션 외부 링크.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import yaml from 'js-yaml';
import { SLIDES, VERSIONS, SITE } from './slides.mjs';

const require = createRequire(import.meta.url);
const hljs = require('highlight.js/lib/core');
hljs.registerLanguage('cpp', require('highlight.js/lib/languages/cpp'));
const puppeteer = require('puppeteer');

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'pdf', 'out');
const pub = (p) => pathToFileURL(path.join(ROOT, 'public', 'images', p)).href;
const asset = (p) => pathToFileURL(path.join(ROOT, 'pdf', 'assets', p)).href;
const profile = yaml.load(fs.readFileSync(path.join(ROOT, 'content', 'profile.yml'), 'utf8'));

const TONE = { '런타임 아키텍처': '#C9572E', '엔진 툴 확장': '#8A6700', '퍼포먼스 최적화': '#0F7A42', '메모리 최적화': '#2F6A9E',
  '렌더링': '#7A5A93', '애니메이션': '#66630E', '게임 수학': '#B24A22', '네트워크 동기화': '#4E5B66' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const chip = (t) => `<span class="chip" style="--c:${TONE[t] ?? '#0F7A42'}">${t}</span>`;
const code = (src) => hljs.highlight(src, { language: 'cpp' }).value;
// 가장 긴 줄이 칸(약 565px)에 들어가도록 코드 글자 크기 자동 조정 (한글은 2칸으로 계산)
const fitFont = (src, max = 13) => {
  const longest = Math.max(...src.split(String.fromCharCode(10)).map((l) => [...l].reduce((n, ch) => n + (/[가-힣]/.test(ch) ? 1.75 : 1), 0)));
  return Math.max(9, Math.min(max, 516 / (longest * 0.6)));
};
const preStyle = (src, extra = '') => `style="font-size:${fitFont(src + String.fromCharCode(10) + extra).toFixed(2)}px"`;

const CSS = `
@page { size: 1280px 720px; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: 'Pretendard', 'Malgun Gothic', sans-serif; color: #18201c; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
a { color: inherit; text-decoration: none; }
.page { width: 1280px; height: 720px; position: relative; overflow: hidden; page-break-after: always; background: #fbfcfb; padding: 40px 56px 0; }
.page:last-child { page-break-after: auto; }
code, pre { font-family: 'JetBrains Mono', Consolas, monospace; }
:not(pre) > code { font-size: .86em; background: #e8f2ec; color: #0F7A42; padding: 1px 5px; border-radius: 4px; }
b { color: #0c1a13; }
.chip { display: inline-block; font-size: 14px; font-weight: 700; color: var(--c); border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
  background: color-mix(in srgb, var(--c) 9%, transparent); padding: 3px 11px; border-radius: 999px; margin-right: 6px; }
.foot { position: absolute; left: 56px; right: 56px; bottom: 18px; display: flex; justify-content: space-between; align-items: center;
  font-size: 13.5px; color: #6b7570; border-top: 1px solid #e3e9e5; padding-top: 9px; }
.foot a { color: #0F7A42; font-weight: 700; }
.foot .mid { display: flex; gap: 18px; }

/* 표지 */
.cover { padding: 0; display: grid; grid-template-columns: 1.15fr 1fr; background: #0d1411; color: #e8eee9; }
.cover-l { padding: 64px 56px; display: flex; flex-direction: column; }
.cover-r { padding: 64px 52px 56px; background: #fbfcfb; color: #18201c; display: flex; flex-direction: column; gap: 22px; }
.eyebrow { font-size: 15.5px; letter-spacing: .14em; text-transform: uppercase; font-weight: 800; color: #F7845A; }
.cover h1 { font-size: 66px; margin: 14px 0 6px; letter-spacing: -1.5px; font-weight: 800; }
.cover .role { font-size: 21.5px; color: #9fb0a7; font-weight: 600; }
.cover .ver { margin-top: 40px; font-size: 32px; font-weight: 800; color: #22A862; letter-spacing: -.5px; }
.cover .pitch { margin-top: 12px; font-size: 19.5px; line-height: 1.65; color: #cfd8d3; max-width: 560px; }
.cover .focus { margin-top: 22px; }
.cover .focus .chip { background: rgba(255,255,255,.06); color: #e8eee9; border-color: rgba(255,255,255,.22); }
.cover .links { margin-top: auto; display: flex; flex-wrap: wrap; gap: 10px 22px; font-size: 16px; }
.cover .links a { color: #22A862; font-weight: 700; border-bottom: 1px solid rgba(34,168,98,.4); }
.sec-h { font-size: 14.5px; letter-spacing: .14em; text-transform: uppercase; font-weight: 800; color: #B24A22; margin: 0 0 10px; }
.hist { list-style: none; margin: 0; padding: 0; }
.hist li { display: grid; grid-template-columns: 138px 1fr; gap: 12px; padding: 8px 0; border-top: 1px solid #e3e9e5; font-size: 16px; }
.hist li:first-child { border-top: 0; }
.hist .per { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; color: #B24A22; padding-top: 2px; }
.hist .t { font-weight: 700; } .hist .s { color: #5d6863; font-size: 15px; } .hist .n { color: #8A6700; font-size: 15px; font-weight: 700; }
.stack { display: grid; grid-template-columns: 128px 1fr; gap: 8px 12px; align-items: center; }
.stack .cat { font-family: 'JetBrains Mono', monospace; font-size: 13px; letter-spacing: .08em; font-weight: 700; text-transform: uppercase; }

/* 목차 */
.toc h2 { font-size: 36px; margin: 6px 0 4px; letter-spacing: -.5px; }
.toc .lead { color: #5d6863; font-size: 17px; margin-bottom: 14px; }
.toc ol { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 9px 28px; }
.toc li a.item { display: grid; grid-template-columns: 40px 1fr; gap: 10px; padding: 11px 14px; border: 1px solid #e3e9e5; border-radius: 12px; background: #fff; }
.toc .num { font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #0F7A42; font-size: 20.5px; }
.toc .tt { font-weight: 800; font-size: 17.5px; line-height: 1.35; }
.toc .th { font-size: 14.5px; color: #5d6863; margin-top: 3px; line-height: 1.45; }
.toc .chips { margin-top: 6px; } .toc .chips .chip { font-size: 13px; padding: 1px 8px; }

/* 사례 */
.hd { display: flex; align-items: center; justify-content: space-between; }
.hd .no { font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #0F7A42; font-size: 16.5px; }
h2.t { font-size: 29px; margin: 8px 0 6px; letter-spacing: -.5px; line-height: 1.25; }
h2.t a::after { content: ' ↗'; font-size: 19.5px; color: #0F7A42; }
.thesis { font-size: 17px; color: #34413a; border-left: 3px solid #22A862; padding: 2px 0 2px 12px; margin: 0 0 16px; line-height: 1.55; }
.body { display: grid; grid-template-columns: 1.06fr 1fr; gap: 26px; height: 510px; }
.col-l { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.blk .lb { display: inline-block; font-size: 13.5px; font-weight: 800; letter-spacing: .06em; color: #fff; padding: 2px 8px; border-radius: 5px; margin-bottom: 4px; }
.blk p { margin: 0; font-size: 15.5px; line-height: 1.58; color: #26312b; }
.lb.p { background: #B24A22; } .lb.c { background: #8A6700; } .lb.s { background: #0F7A42; } .lb.r { background: #2F6A9E; }
.blk ul { margin: 0; padding-left: 17px; } .blk li { font-size: 15.3px; line-height: 1.55; margin: 2px 0; color: #26312b; }
.formula { font-family: 'Pretendard', sans-serif; font-weight: 600; font-size: 14.8px; background: #fff7e6; border: 1px solid #f0dfb6; color: #5b4300; padding: 8px 11px; border-radius: 8px; }
.col-r { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
pre { margin: 0; background: #2B2B2B; color: #A9B7C6; border-radius: 10px; padding: 12px 14px 12px; font-size: 13.1px; line-height: 1.5; white-space: pre; overflow: hidden; }
pre .file { display: block; color: #808080; font-style: italic; margin-bottom: 6px; font-size: 13px; }
.hljs-keyword, .hljs-built_in, .hljs-literal { color: #CC7832; } .hljs-title.function_, .hljs-title { color: #FFC66D; }
.hljs-string { color: #6A8759; } .hljs-number { color: #6897BB; } .hljs-comment { color: #808080; font-style: italic; }
.hljs-meta { color: #BBB529; } .hljs-type, .hljs-title.class_ { color: #A9B7C6; } .hljs-attr, .hljs-variable, .hljs-property { color: #9876AA; }
.dia { background: #fff; border: 1px solid #e3e9e5; border-radius: 10px; padding: 10px; display: flex; align-items: center; justify-content: center; flex: 1; min-height: 0; }
.dia img { max-width: 100%; max-height: 100%; object-fit: contain; }
.dia.fig svg { width: 100%; height: auto; max-height: 100%; }
.dia.shots { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.dia .shot { width: 100%; height: 100%; max-height: 100%; object-fit: contain; border: 0; }
.dia.shotbox, .dia.shots { padding: 6px; background: #f3f5f4; }
.photos { display: grid; gap: 6px; flex: 0 0 auto; }
.photos.row { grid-template-columns: 1fr 1fr; }
.photos.stack { grid-template-columns: 1fr; }
.photos img { width: 100%; height: auto; display: block; border-radius: 7px; border: 1px solid #e3e9e5; }
.photos.row img { height: 150px; object-fit: contain; background: #0d1411; }
.dia.fig { flex: 0 1 auto; }
pre.snip { flex: 0 0 auto; padding: 10px 14px; line-height: 1.55; }
.frames { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.frames img { width: 100%; height: 106px; object-fit: contain; background: #0d1411; border-radius: 7px; border: 1px solid #e3e9e5; }
.cap { font-size: 13px; color: #6b7570; display: flex; justify-content: space-between; }
.cap a { color: #0F7A42; font-weight: 700; }
.shot { display: block; border-radius: 8px; object-fit: contain; }

/* 마무리 */
.end { background: #0d1411; color: #e8eee9; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
.end h1 { font-size: 86px; margin: 0; letter-spacing: -2px; }
.end p { color: #9fb0a7; font-size: 19.5px; margin: 14px 0 34px; }
.end .links { display: flex; gap: 26px; font-size: 17.5px; } .end .links a { color: #22A862; font-weight: 700; border-bottom: 1px solid rgba(34,168,98,.4); }
`;

function foot(v, n, total) {
  return `<div class="foot"><span>임현지 · ${esc(v.title)} 포트폴리오</span>
    <span class="mid"><a href="#toc">목차</a><a href="${SITE}/">웹 포트폴리오 ↗</a></span><span>${n} / ${total}</span></div>`;
}

function cover(v) {
  const hist = (profile.history ?? []).map((h) => `<li><span class="per">${esc(h.period)}</span><span><span class="t">${esc(h.title)}</span>
    ${h.sub ? `<div class="s">${esc(h.sub)}</div>` : ''}${h.note ? `<div class="n">🏆 ${esc(h.note)}</div>` : ''}</span></li>`).join('');
  const cols = ['#B24A22', '#8A6700', '#0F7A42', '#2F6A9E'];
  const stack = (profile.skills ?? []).map((g, i) => `<span class="cat" style="color:${cols[i % 4]}">${esc(g.category)}</span>
    <span>${g.items.map((it) => `<span class="chip" style="--c:${cols[i % 4]}">${esc(it)}</span>`).join('')}</span>`).join('');
  return `<section class="page cover" id="cover">
    <div class="cover-l">
      <div class="eyebrow">Game Client Developer · UE5 C++</div>
      <h1>임현지</h1>
      <div class="role">알트나인 · Sol (UE5 MMORPG) · 2023.01 — 현재</div>
      <div class="ver">${esc(v.title)} 포트폴리오</div>
      <div class="pitch">${esc(v.pitch)}</div>
      <div class="focus">${v.focus.map(chip).join('')}</div>
      <div class="links"><a href="${SITE}/">웹 포트폴리오 ↗</a><a href="${profile.links.github}">GitHub ↗</a><a href="mailto:${profile.links.email}">${esc(profile.links.email)}</a></div>
    </div>
    <div class="cover-r">
      <div><div class="sec-h">이력</div><ul class="hist">${hist}</ul></div>
      <div><div class="sec-h">기술 스택</div><div class="stack">${stack}</div></div>
    </div></section>`;
}

function toc(v, total) {
  const items = v.slides.map((k, i) => {
    const s = SLIDES[k];
    return `<li><a class="item" href="#s-${k}"><span class="num">${String(i + 1).padStart(2, '0')}</span>
      <span><div class="tt">${esc(s.title)}</div><div class="th">${esc(s.thesis)}</div></span></a></li>`;
  }).join('');
  return `<section class="page toc" id="toc"><div class="eyebrow" style="color:#B24A22">Contents</div><h2>목차</h2>
    <div class="lead">각 항목을 누르면 해당 장으로 이동합니다. 각 장의 제목은 웹 포트폴리오의 해당 섹션으로 연결됩니다.</div>
    <ol>${items}</ol>${foot(v, 2, total)}</section>`;
}

// 사례 그림(pdf/assets/fig/*.svg, figures.py 생성)은 인라인으로 넣어 웹 폰트가 적용되게 한다
const fig = (name) => fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets', 'fig', `${name}.svg`), 'utf8');

function visual(s) {
  const parts = [];
  const vis = s.visual;
  if (vis?.type === 'fig') parts.push(`<div class="dia fig">${fig(vis.src)}</div>`);
  if (vis?.type === 'diagram') parts.push(`<div class="dia"><img src="${pub('diagrams/' + vis.src)}" /></div>`);
  if (vis?.type === 'image') parts.push(`<div class="dia shotbox"><img class="shot" src="${pub(vis.src)}" /></div><div class="cap"><span>${esc(vis.caption ?? '')}</span></div>`);
  if (vis?.type === 'images') parts.push(`<div class="dia shots">${vis.src.map((x) => `<img class="shot" src="${pub(x)}" />`).join('')}</div><div class="cap"><span>${esc(vis.caption ?? '')}</span></div>`);
  if (s.photos) parts.push(`<div class="photos ${s.photos.layout}">${s.photos.src.map((x) => `<img src="${pub(x)}" />`).join('')}</div><div class="cap"><span>${esc(s.photos.caption ?? '')}</span></div>`);
  if (s.snip) parts.push(`<pre class="snip" ${preStyle(s.snip)}>${code(s.snip)}</pre>`);
  if (s.frames) parts.push(`<div class="frames">${['0.15', '0.5', '0.85'].map((t) => `<img src="${asset(`frames/${s.frames}_${t}.jpg`)}" />`).join('')}</div>
    <div class="cap"><span>실제 화면 (영상 장면 3컷)</span><a href="${s.url}">▶ 웹에서 영상으로 보기</a></div>`);
  return parts.join('');
}

function slide(v, k, i, total) {
  const s = SLIDES[k];
  const [pl, cl] = s.labels ?? ['문제', '원인'];
  return `<section class="page" id="s-${k}">
    <div class="hd"><span class="no">${String(i + 1).padStart(2, '0')} / ${String(v.slides.length).padStart(2, '0')}</span><span>${s.tags.map(chip).join('')}</span></div>
    <h2 class="t"><a href="${s.url}">${esc(s.title)}</a></h2>
    <p class="thesis">${esc(s.thesis)}</p>
    <div class="body">
      <div class="col-l">
        <div class="blk"><span class="lb p">${pl}</span><p>${s.problem}</p></div>
        <div class="blk"><span class="lb c">${cl}</span><p>${s.cause}</p></div>
        <div class="blk"><span class="lb s">판단 · 해결</span><ul>${s.solution.map((x) => `<li>${x}</li>`).join('')}</ul></div>
        ${s.formula ? `<div class="formula">${esc(s.formula)}</div>` : ''}
        <div class="blk"><span class="lb r">결과</span><p>${s.result}</p></div>
      </div>
      <div class="col-r">${visual(s)}</div>
    </div>${foot(v, i + 3, total)}</section>`;
}

function end(v, total) {
  return `<section class="page end" id="end"><div class="eyebrow">Thank you for reading</div><h1>Thank You</h1>
    <p>각 사례의 전체 코드와 영상은 웹 포트폴리오에서 볼 수 있습니다.</p>
    <div class="links"><a href="${SITE}/">${SITE.replace('https://', '')} ↗</a><a href="${profile.links.github}">GitHub ↗</a><a href="mailto:${profile.links.email}">${esc(profile.links.email)}</a></div>
    <div style="position:absolute;bottom:22px;font-size:11px;color:#6b7570">${total} / ${total}</div></section>`;
}

function html(v) {
  const total = v.slides.length + 3;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap" />
<style>${CSS}</style></head><body>
${cover(v)}${toc(v, total)}${v.slides.map((k, i) => slide(v, k, i, total)).join('')}${end(v, total)}
</body></html>`;
}

const want = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch();
for (const v of VERSIONS.filter((x) => !want.length || want.includes(x.key))) {
  const htmlPath = path.join(OUT, `${v.key}.html`);
  fs.writeFileSync(htmlPath, html(v));
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const pdfPath = path.join(OUT, `${v.file}.pdf`);
  await page.pdf({ path: pdfPath, width: '1280px', height: '720px', printBackground: true, preferCSSPageSize: true });
  console.log('PDF', pdfPath, Math.round(fs.statSync(pdfPath).size / 1024) + 'KB');
  await page.close();
}
await browser.close();
