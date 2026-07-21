---
title: "뮤지컬 관리 프로그램"
subtitle: "데이터베이스 · Java JDBC"
engine: "Java / MySQL"
period: "2021.05 – 2021.06"
team: "개발자 3"
status: ""
image: "/images/yt/musical.jpg"
video: "https://youtu.be/wdOllSk33T0"
tags: ["Java", "JDBC", "MySQL"]
links: { git: "", doc: "", video: "https://youtu.be/wdOllSk33T0" }
---
## 프로젝트 소개
**사용자에게 뮤지컬 배우, 극 정보, 후기, 로그인 시스템을 제공하는 뮤지컬 관리 시스템**입니다. Java JDBC와 MySQL데이터베이스를 연동하여 만든 시스템으로 흩어진 정보를 취합해 제공하기 위해 작성하였습니다.
## 💻담당 업무
**Java JDBC, MySQL**
MySQL 데이터 자료 및 JDBC 내 검색 기능 담당
- **MySQL과 JDBC의 연동을 통해 사용자에게 효율적인 검색 관리 기능 제공**
- **JDBC GUI 활용**
- **MySQL query문 작성 및 활용**
  - Statement : 정적인 쿼리문을 동작 시 사용
  - Prepared Statement: 파라미터 값을 입력 받는 동적인 쿼리문 동작 시 사용
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> MySQL 데이터베이스와 JDBC의 연동을 통해 프로그램에서 쿼리문을 어떻게 데이터베이스로 전달하고, 또 받아오는지 구조와 원리를 파악할 수 있었습니다. 특히 Statement의 경우 사용자가 고의로 쿼리문에 영향을 주는 검색어를 입력하였을 때, 오류가 발생하거나 보안 취약점이 발생할 수 있다는 점을 고려해 Prepared Statement를 이용해서 이를 방지하였습니다.</div>
