interface ImagePlaceholderProps {
  slug: string;
  type: 'project' | 'side' | 'profile';
  count?: number;
}

export default function ImagePlaceholder({ slug, type, count = 3 }: ImagePlaceholderProps) {
  const dirMap = {
    project: `/images/projects/${slug}/`,
    side: `/images/side/${slug}/`,
    profile: `/images/`,
  };
  const dir = dirMap[type];
  const frontmatterField = type === 'profile' ? 'photo' : 'images';
  const configFile = type === 'project'
    ? `content/projects/${slug}.md`
    : type === 'side'
    ? `content/side/${slug}.md`
    : 'content/profile.yml';

  return (
    <div className="img-placeholder">
      <div className="img-placeholder-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
      <p className="img-placeholder-title">이미지를 추가해보세요</p>
      <div className="img-placeholder-steps">
        <div className="img-placeholder-step">
          <span className="img-step-num">1</span>
          <span>이미지 파일을 <code>public{dir}</code> 폴더에 넣으세요</span>
        </div>
        <div className="img-placeholder-step">
          <span className="img-step-num">2</span>
          <span><code>{configFile}</code> 파일에서 <code>{frontmatterField}</code> 항목을 수정하세요</span>
        </div>
      </div>
      <details className="img-placeholder-example">
        <summary>예시 보기</summary>
        <pre><code>{type === 'profile'
          ? `# content/profile.yml\nphoto: "/images/profile.jpg"`
          : `# ${configFile}\nimages:\n${Array.from({ length: count }, (_, i) =>
              `  - src: "${dir}img${i + 1}.png"\n    alt: "설명 텍스트"\n    caption: "캡션 (선택)"`
            ).join('\n')}`
        }</code></pre>
      </details>
    </div>
  );
}
