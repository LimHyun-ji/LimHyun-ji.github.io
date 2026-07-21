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
랜덤으로 생성되는 과일들을 잘 맞추어 떨어뜨리고  같은 과일끼리 합쳐지도록 조작합니다.<br><strong>과일 충돌 종류를  판별</strong>하고 생성하는 과정에 집중해 구현하였습니다.
## 💻담당 업무 및 사용 기술
<strong>Unity Engine C#<br></strong>
- <strong>충돌 이벤트 감지 </strong>
  - <strong> Instantiate/ Destory 하여 새로운 객체 생성</strong>
  - <strong>부하를 줄이기 위해 Dictionary 로 변경</strong>
- <strong>2D Sprite와 UI 사용</strong>
- <strong>Click/ Drag Event</strong>
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> 과일 게임 오브젝트 충돌 시 ,어떤 개체와 충돌했는지 판별하여 기존 개체를 삭제하고 새로운 객체를 생성하는 과정에서 Instantiate와 Destory를 사용했습니다. 하지만 해당 프로젝트를 가지고 스터디를 하는 도중, 다른 사람은 Dictionary로 구현하여 프로그램의 부하를 줄였다는 사실을 배우고 저 또한 그 방법을 고려해 코드를 다시 작성해보았습니다. <br>이 과정에서 코드의 구현 뿐 아니라 최적화와 효율성까지 고려하여 작성하는 것의 중요성을 깨닫게 되었습니다.</div>
