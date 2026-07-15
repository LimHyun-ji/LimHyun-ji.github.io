/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',          // 정적 export → GitHub Pages
  images: { unoptimized: true },
  trailingSlash: true,       // /projects/slug/ 형태 (Jekyll pretty permalink과 동일)
};
export default nextConfig;
