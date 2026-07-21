---
title: "Fruit Game"
subtitle: "모바일 미니게임 · Unity"
engine: "Unity / C#"
period: "2021.06"
team: "개발자 1 (본인)"
status: ""
image: "/images/yt/fruit.jpg"
video: "https://youtu.be/wzn5y_Gpyq8"
tags: ["Unity", "C#", "2D", "Collision"]
links: { git: "", doc: "", video: "https://youtu.be/wzn5y_Gpyq8" }
---
## 프로젝트 소개
랜덤으로 생성되는 과일을 잘 맞춰 떨어뜨려 같은 과일끼리 합쳐지도록 조작하는 게임입니다. **과일 충돌 종류를 판별**하고 생성하는 과정에 집중해 구현했습니다.
## 💻담당 업무 및 사용 기술
(Unity Engine · C#)
- **충돌 이벤트 감지**
  - Instantiate / Destroy로 새 객체 생성
  - 부하를 줄이기 위해 Dictionary로 변경
- **2D Sprite와 UI 사용**
- **Click / Drag Event**
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> 과일 충돌 시 어떤 개체와 충돌했는지 판별해 기존 개체를 삭제하고 새 객체를 생성하는 과정에서 Instantiate·Destroy를 사용했습니다. 이후 스터디 중 다른 사람이 Dictionary로 구현해 프로그램 부하를 줄인 것을 배우고, 저도 그 방법으로 코드를 다시 작성했습니다. 구현뿐 아니라 최적화·효율성까지 고려하는 것의 중요성을 깨달았습니다.</div>
