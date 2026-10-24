export interface SideProject {
  slug: string;
  title: string;
  subtitle: string;
  engine: string;
  desc: string;
  tags: string[];
  image: string;
  links: { git?: string; video?: string; doc?: string };
}

// Notion 포트폴리오에서 이관. 상위 5개(중요도순) = 주요 프로젝트, 이후 = 그 외 프로젝트.
export const sideProjects: SideProject[] = [
  {
    slug: 'ittakestwo',
    title: 'It Takes Two 모작',
    subtitle: '2인 협동 어드벤처 · Unity',
    engine: 'Unity / C#',
    desc: 'SnowGlobe 챕터를 모작하며 오브젝트 특수 상호작용과 협동 시각 요소를 구현하고, 클래스 FSM·벡터 내적 슬라이딩·Bezier·Stencil 셰이더·IK를 재사용성 있게 설계.',
    tags: ['Unity', 'FSM', 'Shader', 'Bezier', 'IK'],
    image: '/images/ittakestwo-1.png',
    links: { git: 'https://github.com/LimHyun-ji/ItTakesTwo_GG', video: 'https://youtu.be/23g39-UNHLQ', doc: 'https://www.miricanvas.com/v/11j6dmn' },
  },
  {
    slug: 'genshin',
    title: '원신 (Genshin) 모작',
    subtitle: '오픈월드 RPG · Unity',
    engine: 'Unity / C#',
    desc: 'GameManager로 던전 Flow를 관리하고, 원소·자연물 상호작용, 상속 기반 다중 캐릭터, 클래스형 FSM, 캐릭터 교체 오브젝트 풀링을 구현.',
    tags: ['Unity', 'C#', 'FSM', 'Object Pooling', 'Cinemachine'],
    image: '/images/yt/genshin.jpg',
    links: { git: 'https://github.com/LimHyun-ji/GenshinImpact_Copy', video: 'https://youtu.be/K3E_Jpei_Oc', doc: 'https://www.miricanvas.com/v/11mr28x' },
  },
  {
    slug: 'cinepx',
    title: 'Cinepx',
    subtitle: '메타버스 영화 촬영 플랫폼 · Unity',
    engine: 'Unity / C#',
    desc: '다중 카메라 구조화, RenderTexture 미리보기, Camera Timeline(Queue) 블렌딩을 구현하고, 그래픽 최적화(Static·Light Baking·Occlusion Culling)를 담당.',
    tags: ['Unity', 'Cinemachine', 'RenderTexture', 'Optimization'],
    image: '/images/cinepx-1.png',
    links: { git: 'https://github.com/LimHyun-ji/AppleBox', video: 'https://youtu.be/aKcv3BfkqDQ', doc: 'https://www.miricanvas.com/v/11mr28x' },
  },
  {
    slug: 'bridge',
    title: 'Bridge Theater: Red Riding Hood',
    subtitle: '관객 참여형 VR 연극 · 경진대회 우수상',
    engine: 'Unreal / C++',
    desc: 'Steam 멀티플레이 서버, LiveLink 배우 풀트래킹, VR Expansion 관객 핸드트래킹, Behavior Tree AI를 직접 구현한 관객 참여형 VR 연극.',
    tags: ['Unreal', 'C++', 'VR', 'LiveLink', 'Behavior Tree'],
    image: '/images/yt/bridge.jpg',
    links: { git: 'https://github.com/LimHyun-ji/VR-Theater', video: 'https://youtu.be/D6_bDRrNd8w' },
  },
  {
    slug: 'journey',
    title: 'Journey To Space',
    subtitle: '우주·행성 탐험 FPS RPG · Unreal',
    engine: 'Unreal / C++',
    desc: '블루프린트를 최소화하고 C++ 중심으로 행성 파트의 보스·일반 적 AI 행동 패턴과 플레이어 전투·스킬·기믹을 구현.',
    tags: ['Unreal', 'C++', 'AI Behavior', 'Destructible', 'FPS RPG'],
    image: '/images/yt/journey.jpg',
    links: { git: 'https://github.com/LimHyun-ji/Space-To-Journey', video: 'https://youtu.be/xfQBWUyWXu8' },
  },
  {
    slug: 'squid',
    title: '오징어게임 VR',
    subtitle: '무궁화 꽃이 피었습니다 · 기업 연계',
    engine: 'Unreal / BP·C++',
    desc: "드라마 '오징어 게임'을 VR로 구현 — Steam VR 다중 서버 멀티플레이, AI 참가자 움직임, 참가자 스코어보드를 담당.",
    tags: ['Unreal', 'VR', 'Blueprint', 'OnlineSubsystem', '멀티플레이'],
    image: '/images/yt/squid.jpg',
    links: { video: 'https://youtu.be/hiWAjNyuSsM' },
  },
  {
    slug: 'zezz',
    title: 'Zezz',
    subtitle: 'Zepeto+Sims 마이홈 메타버스 · Unity',
    engine: 'Unity / C#',
    desc: '아바타 커스터마이징·마이홈 꾸미기 메타버스. Building/Save-Load 시스템, HashTable 기반 룸 커스텀 저장, Firebase 로그인·실시간 DB 연동을 구현.',
    tags: ['Unity', 'Firebase', 'Realtime DB', 'Building System'],
    image: '/images/yt/zezz.jpg',
    links: { video: 'https://youtu.be/dXVODz3MJaY', doc: 'https://www.miricanvas.com/v/11mr28x' },
  },
  {
    slug: 'midnight',
    title: 'Midnight Gallery',
    subtitle: 'Interactive Art · Unity',
    engine: 'Unity / C#',
    desc: 'AI 핸드 모션 인식으로 아트와 상호작용하며 스토리를 진행하는 인터랙티브 아트. Compute Shader 기반 물 상호작용·사운드 처리를 구현.',
    tags: ['Unity', 'AI Hand Tracking', 'Compute Shader', 'Interactive Art'],
    image: '/images/yt/midnight.jpg',
    links: { video: 'https://youtu.be/IDryaiFv-Mw' },
  },
  {
    slug: 'healthmr',
    title: '헬스 트레이닝 MR',
    subtitle: 'MR 헬스 콘텐츠 · 게임잼',
    engine: 'Unity / Oculus Quest',
    desc: 'Passthrough API로 현실 위에 가상 오브젝트를 투영하는 MR 헬스 콘텐츠. 체스트 프레스 유효 판정(UI/Collider)과 GameManager 플로우를 담당.',
    tags: ['MR', 'Passthrough API', 'Oculus Quest', 'GameManager'],
    image: '/images/yt/healthmr.jpg',
    links: { video: 'https://youtu.be/WjROo7WEGCY' },
  },
  {
    slug: 'fruit',
    title: 'Fruit Game',
    subtitle: '모바일 미니게임 · Unity',
    engine: 'Unity / C#',
    desc: '같은 과일끼리 합쳐지는 모바일 미니게임. 과일 충돌 종류 판별 후 새 객체를 생성하는 로직과 Dictionary 최적화·드래그 이벤트를 구현.',
    tags: ['Unity', 'C#', '2D', 'Collision'],
    image: '/images/yt/fruit.jpg',
    links: { video: 'https://youtu.be/wzn5y_Gpyq8' },
  },
  {
    slug: 'shooting',
    title: 'Shooting Game',
    subtitle: 'Java 슈팅 게임 · 학습',
    engine: 'Java',
    desc: '키 입력으로 적을 공격하고 점수를 얻는 슈팅 게임. 객체지향 구조·GUI·오디오 시스템으로 게임 개발 기초를 학습.',
    tags: ['Java', 'OOP', 'GUI'],
    image: '/images/yt/shooting.jpg',
    links: { video: 'https://youtu.be/Zu2oAUBnlsk' },
  },
  {
    slug: 'musical',
    title: '뮤지컬 관리 프로그램',
    subtitle: '데이터베이스 · Java JDBC',
    engine: 'Java / MySQL',
    desc: '뮤지컬 배우·극·후기·로그인을 제공하는 관리 시스템. Java JDBC + MySQL 연동과 검색 기능을 담당.',
    tags: ['Java', 'JDBC', 'MySQL'],
    image: '/images/yt/musical.jpg',
    links: { video: 'https://youtu.be/wdOllSk33T0' },
  },
];
