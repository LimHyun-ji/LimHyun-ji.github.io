---
layout: project
order: 2
title: "에디터 툴 & 데이터 파이프라인"
role: "Tools / Pipeline"
period: "2023.02 — 현재"
summary: "콘텐츠 제작 생산성과 데이터 무결성을 위한 사내 에디터 툴과 빌드 파이프라인을 개발."
tags: ["Editor Tooling", "Python", "Commandlet", "CI", "Metadata"]
highlights:
  - "레벨/스폰 데이터 AreaTool 및 Commandlet 기반 CI 자동화(레벨데이터 검증·export)"
  - "메타데이터 Generator·VisualData Editor 등 데이터 주도 에디터 툴 개발"
  - "미니맵 데이터 텍스처 변환·퀘스트 인디케이터 파이프라인 구축"
  - "Python 기반 P4 자동화·단위계 변환·검증 스크립트로 데이터 워크플로 개선"
---

## 개요

콘텐츠 제작팀의 생산성과 게임 데이터의 무결성을 높이기 위한 **사내 에디터 툴과 빌드 파이프라인**을
개발했습니다. 게임플레이 기능 못지않게 비중이 큰 작업 영역으로, 데이터가 자동으로 검증·생성·배포되는
흐름을 만드는 데 집중했습니다.

## 주요 작업

### 레벨 / 스폰 데이터 파이프라인 (AreaTool)
레벨 영역·NPC 스폰·순찰(Patrol) 데이터를 다루는 AreaTool을 개선하고,
**Commandlet 기반 CI**로 레벨데이터 검증과 export를 자동화해 수작업과 누락을 줄였습니다.

### 데이터 주도 에디터 툴
메타데이터 Generator, VisualData Editor(캐릭터 외형/소켓 프리뷰) 등
데이터 주도 설계를 지원하는 에디터 도구를 개발했습니다.

### 미니맵 파이프라인
미니맵 데이터를 텍스처로 변환하고 퀘스트 인디케이터를 거리 비례로 표시하는 파이프라인을 구축했습니다.

### Python 자동화
프로젝트 초기부터 **Python 기반 P4 자동화·단위계 변환·데이터 검증 스크립트**를 작성해
반복 작업과 휴먼 에러를 줄이고 데이터 워크플로를 정비했습니다.

## 기술 요약

| 영역 | 내용 |
|------|------|
| 언어 | C++ · Python |
| 에디터 | UE5 Editor Module(`SolEditor`) · `UDeveloperSettings` |
| 자동화 | Commandlet 기반 CI(Jenkins) · P4 자동화 스크립트 |
| 데이터 | 메타데이터 Generator · VisualData Editor · `RidType` 키 |
| 출력 | 검증된 Generated 메타데이터 → 런타임 `MetaDataSubsystem` |

## 파이프라인 구조

원본 데이터가 에디터 툴·Commandlet을 거쳐 **검증·생성·배포**되는 자동화 흐름입니다.

<div class="mermaid">
flowchart LR
  SRC["원본 데이터<br/>Excel · 에셋 · 레벨"] --> TOOL["에디터 툴<br/>AreaTool · Generator"]
  TOOL --> CMD["Commandlet<br/>(CI 자동 실행)"]
  CMD --> VAL["검증 · Export"]
  VAL --> GEN["Generated 메타데이터<br/>(RidType 키)"]
  GEN --> RT["런타임<br/>MetaDataSubsystem"]
</div>
