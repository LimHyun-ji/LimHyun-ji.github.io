/** .gif 경로면 같은 이름의 .mp4 경로를 돌려준다 (GIF가 아니면 null). 서버 · 클라이언트 양쪽에서 사용 */
export function gifToVideo(src?: string): string | null {
  if (!src || !/\.gif$/i.test(src)) return null;
  return src.replace(/\.gif$/i, '.mp4');
}
