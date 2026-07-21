---
title: "원신 (Genshin) 모작"
subtitle: "오픈월드 RPG · Unity"
engine: "Unity / C#"
period: "2022.07"
team: "개발자 2인"
status: "Highlights"
image: "/images/yt/genshin.jpg"
video: "https://youtu.be/K3E_Jpei_Oc"
tags: ["Unity", "C#", "FSM", "Object Pooling", "Cinemachine"]
links: { git: "https://github.com/LimHyun-ji/GenshinImpact_Copy", doc: "https://www.miricanvas.com/v/11mr28x", video: "https://youtu.be/K3E_Jpei_Oc" }
---
## 프로젝트 소개
오픈월드형 RPG 원신을 모작한 프로젝트로, 플로우를 사용하기 위해 던전 형식을 차용했습니다. 기본에 충실한 움직임을 모두 구현하고자 노력하였으며, GameManager를 통해 던전의 전반적인 Flow를 관리하였습니다. 원소 및 다중 캐릭터를 사용하는 원작의 특성을 반영하였으며 각 원소는 자연물과도 상호작용이 가능하며, 다중 캐릭터의 경우 상속을 통해 공통 기능과 캐릭터별 특성을 구현했습니다.
## 📚프로젝트 자료
↘️클릭 시 원본 링크로 이동합니다
### [코드 분석 및 기술소개서](https://www.miricanvas.com/v/11mr28x)
### [Git Repository](https://github.com/LimHyun-ji/GenshinImpact_Copy)
## 💻담당 업무 및 해당 업무에서 사용된 기술
- **인벤토리**
  - Item Struct로 아이템 정보 관리
  - Dictionary를 통해 획득한 아이템의 정보 및 UI를 관리
- **캐릭터 클래스 상태머신**
  - 특수 모션 — 등반: 눈높이에서 Ray를 쏘며 벽이 존재하는지 판별
- **Virtual Camera를 이용한 자연스러운 카메라 구현**
- **상속을 통한 다중 캐릭터 구현**
  - Player — 근거리 / 원거리로 구분
- **캐릭터 교체 Object Pooling**
  - 캐릭터를 매번 생성/파괴하지 않고 Pooling해두고 Active만 On/Off
- **GameManager: 던전 전반 Flow 관리**
  - Scene 변경 시 호출될 기능은 SceneManager의 sceneLoaded에 delegate로 등록해 자동화
- **캐릭터 Animation**
  - Animation SubState를 이용해 효율적으로 관리
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>클래스 유한 상태 머신(FSM) 설계<br><br></strong>enum형으로 작성하던 기존 상태 머신과 달리 클래스형으로 작성해 상속 가능한 상태머신을 설계·구현했습니다. 기존에는 불가능했던 다중 상태가 가능해지고, Grounded 상태에서만 발생하는 Trigger를 자식 클래스에 공통 적용하는 등 이벤트 공통화가 가능해졌습니다. 다만 enum형보다 구조가 복잡해 추후 간소화 리팩토링이 필요하다고 판단했습니다. 같은 코드를 다른 구조로 설계·구현하며 각 구조의 장단점을 파악하는 계기가 됐습니다.</div>
