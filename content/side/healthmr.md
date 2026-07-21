---
title: "헬스 트레이닝 MR"
subtitle: "MR 헬스 콘텐츠 · 게임잼"
engine: "Unity / Oculus Quest"
period: "2022.07"
team: "개발자 3 · 모델러 2"
status: "GameJam"
image: "/images/yt/healthmr.jpg"
video: "https://youtu.be/WjROo7WEGCY"
tags: ["MR", "Passthrough API", "Oculus Quest", "GameManager"]
links: { git: "", doc: "", video: "https://youtu.be/WjROo7WEGCY" }
---
## 프로젝트 소개
2박 3일로 진행한 게임잼의 MR 헬스 콘텐츠입니다. <br>현실을 기반으로 가상현실과 상호작용하고 현실의 행동을 유도하여 헬스를 도와주는 콘텐츠를 기획 및 제작하였습니다.
## 💻담당 업무 및 해당 업무에서 사용된 기술
- Passthrough API
  - 가상현실만 보여주는 VR과 달리 현실 세계 위에 가상 오브젝트를 투영하는 MR
  - 오큘러스 Quest로 이를 구현하기 위해 현실의 사물과 같은 위치에 가상 오브젝트를 배치할 수 있도록 가이드 라인을 제공
  - Passthrough API를 적용해 현실 세계를 보여줌
  - 개발 당시 시점에는 회색으로 보인다는 하드웨어적 한계가 존재
    - 영상에는 PassThrough API가 적용된 화면으로 녹화가 되지 않았음
  - passthrough API 사용 예시
    ![](/images/side/healthmr/img1.jpg)
 
- 체스트 프레스 유효 판정
  - UI 및 Collider
- GameManager를 통한 전반적인 플로우 관리
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>MR을 이용한 프로젝트 진행 및 기획<br><br></strong>VR, MR 등의 기술을 구현하는 데에 앞서 먼저 중요한 것은 왜? 굳이 이 기술을 사용해야 하는가에 대한 적절한 이해라고 생각합니다. 해당 프로젝트는 그러한 점을 많이 고민했고, 그 결과 헬스장에 가기 어려운 상황, 홈트레이닝을 해야 하는 상황에서 동기부여가 될 수 있도록 콘텐츠를 기획했습니다. 또한, 주변 현실 사물들을 인지해 위험성을 낮추기 위해 현실세계의 투영이 필요하다고 생각했습니다. <br><br>위와 같은 기획 과정을 통해 PassThrough API를 적절히 적용하였고, VR기기를 이용해 MR기술을 일부 구현하는 데에 성공했습니다. 다만 기술적 한계로 인해 선명한 현실을 볼 수 없다는 아쉬움이 있었지만 차후 발전한 기술로 새로운 MR프로젝트를 진행할 수 있을 것이라고 생각합니다.</div>
<strong>+) Oculus Quest Pro 에서 Color PassThrough 기능을 선보였습니다. </strong>

[▶ Color PassThrough 영상 (YouTube)](https://www.youtube.com/watch?v=Tng2O7d7KCI)
