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
2박 3일로 진행한 미드나잇 캠프의 인터렉티브 아트 프로젝트입니다. <br>AI로 핸드 모션을 인식하여 아트와 상호작용 하여 갤러리의 스토리라인을 진행할 수 있습니다.
## 💻담당 업무 및 해당 업무에서 사용된 기술
- <strong>Unity 와 AI 연동</strong>
  - AI에서 인식한 손 정보를 Unity로 불러와 
    String으로 받은 정보를 배열로 변환하여 해당 위치에 Collider 생성
- 물 상호작용 기능 구현
  - Water Material을 적용하여 물의 느낌을 구현
  - Compute Shader를 통해 손과 상호작용한 부분에 물의 파동을 줄 수 있도록 제작
- Sound 처리
  - 제목의 글씨와 손이 충돌할 때 랜덤으로 효과음을 재생
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>AI 직군과의 협업<br><br></strong>AI 기술을 이용해 고가의 장비 없이 웹캠만으로도 실시간으로 핸드모션을 인식하고 상호작용하는 인터렉티브 아트를 구현하였습니다. 카메라의 인식 범위 밖으로 나가면 정확도가 떨어진다는 단점이 있었으나, 2박 3일이라는 시간의 부족으로 인해 성능을 개선할 수 없었기에 이후 보완할 예정입니다. <br><br>이와 같이 Ai기술을 이용하면 다양한 분야로 콘텐츠를 확장할 수 있고 컴퓨터 한 대만으로 유저에게 많은 경험을 선사할 수 있다는 장점을 깨달았습니다. 이후 프로젝트에도 AI기술을 활용하여 다양한 콘텐츠를 개발해보고자 하는 계기가 되었습니다.</div>
