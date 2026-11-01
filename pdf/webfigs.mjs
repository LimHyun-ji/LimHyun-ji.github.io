// 웹사이트용 그림 렌더러 — pdf/assets/web/*.svg를 PDF와 같은 폰트(Pretendard · JetBrains Mono)로 그려
// public/images/diagrams/fig-<name>.png (2배 해상도)로 저장한다.
// 실행: python pdf/figures.py && node pdf/webfigs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, 'assets', 'web');
const out = path.join(here, '..', 'public', 'images', 'diagrams');

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 });
for (const f of fs.readdirSync(src).filter((x) => x.endsWith('.svg'))) {
  const svg = fs.readFileSync(path.join(src, f), 'utf8').replace(/font-family="Pretendard, 'Malgun Gothic', sans-serif"/, '');
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap" />
<style>html, body { margin: 0; background: transparent; } svg { display: block; font-family: Pretendard, sans-serif; }</style>
</head><body>${svg}</body></html>`, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  const el = await page.$('svg');
  const name = f.replace(/\.svg$/, '') + '.png';
  await el.screenshot({ path: path.join(out, name), omitBackground: true });
  console.log('PNG', name);
}
await browser.close();
