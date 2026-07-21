---
title: "헬스 트레이닝 MR"
subtitle: "MR 헬스 콘텐츠 · 게임잼"
engine: "Unity / Oculus Quest"
period: "2022.07"
team: "개발자 3 · 모델러 2"
status: "GameJam"
image: "/images/yt/healthmr.jpg"
video: "https://youtu.be/uVdVijj9Cqg"
tags: ["MR", "Passthrough API", "Oculus Quest", "GameManager"]
links: { git: "", doc: "", video: "https://youtu.be/uVdVijj9Cqg" }
---
## 프로젝트 소개
2박 3일 게임잼에서 진행한 MR 헬스 콘텐츠입니다. 현실을 기반으로 가상현실과 상호작용하고, 현실의 행동을 유도해 헬스를 도와주는 콘텐츠를 기획·제작했습니다.
## 💻담당 업무 및 해당 업무에서 사용된 기술
- **Passthrough API**
  - 가상현실만 보여주는 VR과 달리 현실 세계 위에 가상 오브젝트를 투영하는 MR
  - Oculus Quest로 구현하기 위해 현실 사물과 같은 위치에 가상 오브젝트를 배치하는 가이드라인 제공
  - Passthrough API를 적용해 현실 세계를 보여줌 (당시 하드웨어 한계로 회색 표시, 영상엔 미반영)
  - Passthrough API 사용 예시
  ![](/images/side/healthmr/img1.jpg)
- **체스트 프레스 유효 판정** (UI 및 Collider)
- **GameManager를 통한 전반적인 플로우 관리**
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>MR을 이용한 프로젝트 진행 및 기획<br><br></strong>VR·MR 기술을 구현하기 전, '왜 이 기술을 써야 하는가'에 대한 이해가 중요하다고 생각합니다. 헬스장에 가기 어렵거나 홈트레이닝을 해야 하는 상황에서 동기부여가 되도록 기획했고, 주변 현실 사물을 인지해 위험성을 낮추기 위해 현실 투영이 필요하다고 판단했습니다. 이에 Passthrough API를 적용해 VR 기기로 MR 기술을 일부 구현했습니다. 기술적 한계로 선명한 현실을 볼 수 없다는 아쉬움은 있었으나, 발전한 기술로 새로운 MR 프로젝트를 진행할 수 있으리라 생각합니다.</div>
