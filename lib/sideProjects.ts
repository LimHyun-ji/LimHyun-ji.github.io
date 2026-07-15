export interface SideProject {
  title: string;
  subtitle: string;
  meta: string;      // 기간 · 팀
  engine: string;
  desc: string;
  tags: string[];
  images: string[];  // /images/*.png
}

export const sideProjects: SideProject[] = [
  {
    title: 'It Takes Two (Unity 클론)',
    subtitle: '협동 액션 어드벤처 — 프레임워크 · 캐릭터 담당',
    meta: '2022.08 · 2인',
    engine: 'Unity / C#',
    desc: 'FSM 상태머신, TPS 카메라(Cinemachine Collider 직접 구현), 슬라이딩(Vector 내적), ScriptableObject 데이터, Bezier·IK, Stencil 실루엣 셰이더 등 로우레벨 게임플레이 프로그래밍을 직접 구현.',
    tags: ['Unity', 'C#', 'FSM', 'Shader', 'IK', 'Math'],
    images: ['/images/ittakestwo-1.png', '/images/ittakestwo-2.png', '/images/ittakestwo-3.png'],
  },
  {
    title: 'Cinepx (메타버스 · 카메라 도구)',
    subtitle: '메타버스 전시관 — 전반 기능 · 영화 촬영 시스템 담당',
    meta: '2022.10~11 · 팀',
    engine: 'Unity',
    desc: '다중 카메라 구조화, RenderTexture 미리보기, Camera Timeline(Queue) 블렌딩을 구현하고, 성능 최적화(30→68fps)·그래픽 최적화(Static·Light Baking·Occlusion Culling)로 렌더 비용을 절반 이하로 낮춤.',
    tags: ['Unity', 'Camera', 'RenderTexture', 'Optimization'],
    images: ['/images/cinepx-1.png', '/images/cinepx-2.png', '/images/cinepx-3.png'],
  },
];
