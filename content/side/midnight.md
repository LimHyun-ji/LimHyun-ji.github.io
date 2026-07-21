---
title: "Midnight Gallery"
subtitle: "Interactive Art · Unity"
engine: "Unity / C#"
period: "2022.08 – 2022.09"
team: "XR 4 · AI 2 · 모델러 2 · 사운드 1"
status: "GameJam"
image: "/images/yt/midnight.jpg"
video: "https://youtu.be/IDryaiFv-Mw"
tags: ["Unity", "AI Hand Tracking", "Compute Shader", "Interactive Art"]
links: { git: "", doc: "", video: "https://youtu.be/IDryaiFv-Mw" }
---
## 프로젝트 소개
2박 3일 미드나잇 캠프(게임잼)에서 진행한 인터랙티브 아트 프로젝트입니다. AI로 핸드 모션을 인식해 아트와 상호작용하며 갤러리의 스토리라인을 진행할 수 있습니다.
## 💻담당 업무 및 해당 업무에서 사용된 기술
- **Unity와 AI 연동**
  - AI가 인식한 손 정보(String)를 Unity로 받아 배열로 변환, 해당 위치에 Collider 생성
- **물 상호작용 기능**
  - Water Material로 물 느낌 구현, Compute Shader로 손과 상호작용한 부분에 물결 파동
- **Sound 처리**
  - 제목 글씨와 손이 충돌할 때 랜덤 효과음 재생
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>AI 직군과의 협업<br><br></strong>AI 기술로 고가 장비 없이 웹캠만으로 실시간 핸드모션을 인식·상호작용하는 인터랙티브 아트를 구현했습니다. 카메라 인식 범위 밖에서는 정확도가 떨어지는 한계가 있었으나(시간 부족으로 추후 보완 예정), AI 기술로 컴퓨터 한 대만으로도 다양한 경험을 줄 수 있다는 장점을 깨달아 이후에도 활용하고자 하는 계기가 됐습니다.</div>
