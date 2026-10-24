import { glue } from '@/lib/keepWords';

// 제목용 래퍼 — 띄어쓰기 기준 줄바꿈(lib/keepWords.ts의 glue) + 기호 단어 처리
// - 기호만 있는 단어는 줄 맨 앞/끝에 홀로 남지 않게 nbsp로 붙임
//     / + ↔    → 앞뒤 단어 모두와 붙임 (예: '퍼포먼스 / 메모리', 'Excel ↔ JSON'은 한 덩어리)
//     ·        → 앞 단어와만 붙임 (줄이 '·'로 시작하지 않게. '길드 · 수집 · …' 같은 긴 나열은 '·' 뒤에서 줄바꿈)
//     — & → 등  → 뒤 단어와만 붙임 (줄이 '— 미니맵', '& 아웃게임'으로 시작하는 건 허용)
const NBSP = ' ';
const BIND_BOTH = /^[/+|↔]+$/;
const BIND_PREV = /^[·]+$/;
const BIND_NEXT = /^[—–\-→:&]+$/;

export default function KeepWords({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  let out = '';
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const glueToPrev = BIND_BOTH.test(w) || BIND_PREV.test(w) || (prev !== undefined && (BIND_BOTH.test(prev) || BIND_NEXT.test(prev)));
    if (i > 0) out += glueToPrev ? NBSP : ' ';
    out += glue(w);
  });
  return <span className="kw">{out}</span>;
}
