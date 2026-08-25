'use client';

import { useEffect } from 'react';

export default function CodeToggle() {
  useEffect(() => {
    const pres = document.querySelectorAll('.detail-body pre');
    pres.forEach((pre) => {
      if (pre.parentElement?.tagName === 'DETAILS') return; // 이미 처리됨

      // 코드 첫 줄에서 파일명/주석 추출
      const code = pre.querySelector('code');
      const firstLine = code?.textContent?.split('\n')[0]?.trim() || '';
      let label = '코드 보기';
      if (firstLine.startsWith('//')) {
        label = firstLine.replace(/^\/\/\s*/, '');
      }

      const details = document.createElement('details');
      details.className = 'code-toggle';
      const summary = document.createElement('summary');
      summary.textContent = label;
      details.appendChild(summary);
      pre.parentNode?.insertBefore(details, pre);
      details.appendChild(pre);
    });
  }, []);

  return null;
}
