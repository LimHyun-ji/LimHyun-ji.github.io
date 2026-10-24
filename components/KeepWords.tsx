// 제목을 띄어쓰기 단위로만 줄바꿈되게 하는 래퍼.
// - 단어 안의 기호(·, /, -, &, +, 괄호) 앞뒤에 WORD JOINER(U+2060)를 넣어 '길드·수집'처럼 기호 뒤에서 끊기지 않게 함
// - 기호만 있는 단어는 줄 맨 앞/끝에 홀로 남지 않게 nbsp로 붙임
//     · / +    → 앞뒤 단어 모두와 붙임 (예: '미니맵 · 월드맵'은 한 덩어리)
//     — & → 등  → 뒤 단어와만 붙임 (줄이 '— 미니맵', '& 아웃게임'으로 시작하는 건 허용)
// - 단어 하나가 화면보다 길 때만 CSS(overflow-wrap: anywhere)로 예외적으로 끊김
const WJ = '⁠';
const NBSP = ' ';
const BIND_BOTH = /^[·/+|]+$/;
const BIND_NEXT = /^[—–\-→:&]+$/;
const INNER_SYMBOL = /([·/\-&+()])/g;

export default function KeepWords({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  let out = '';
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const glueToPrev = BIND_BOTH.test(w) || (prev !== undefined && (BIND_BOTH.test(prev) || BIND_NEXT.test(prev)));
    if (i > 0) out += glueToPrev ? NBSP : ' ';
    out += w.replace(INNER_SYMBOL, `${WJ}$1${WJ}`);
  });
  return <span className="kw">{out}</span>;
}
