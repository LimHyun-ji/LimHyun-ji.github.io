---
layout: project
order: 3
title: "퍼포먼스 최적화 & 라이브 품질 대응"
role: "Client Developer"
period: "상시"
summary: "모바일 타겟 성능 개선과 라이브 빌드 안정성 확보. 전체 작업의 약 30%가 버그·크래시·현상 수정."
tags: ["Optimization", "Mobile", "Debugging"]
highlights:
  - "UI Invalidation·Culling·Mipmap 스트리밍 동적 제어로 렌더링 비용 절감"
  - "다수의 클라이언트 크래시·동기화 이슈 분석 및 수정 (Jira 연계)"
---

## 개요

모바일을 주요 타겟으로 하는 만큼 **성능 최적화**와 **라이브 빌드 안정성**을 상시 과제로 다뤘습니다.
3년여간 반영한 변경의 약 **30%가 버그·크래시·현상 수정**으로, 기능 개발과 품질 대응을 병행했습니다.

## 주요 작업

### 렌더링 / UI 성능
- **UI Invalidation** 패널 적용·Side Effect 정리로 위젯 갱신 비용 절감
- 화면 밖 액터 **Culling** 및 별자리 등 무거운 콘텐츠의 **Mipmap 스트리밍 동적 제어**
- 넷마블 최적화 BP → C++ 코드 이전, Tweener 의존 제거 등 런타임 비용 축소

### 라이브 품질 대응
- 미니맵 깜빡임, 채팅 RichText, 순례 보상 정산, 장비 중복 착용 등 **다수의 현상·크래시 이슈** 분석·수정
- **Jira 티켓 연계** 워크플로로 라이브 빌드의 회귀를 추적하고 핫픽스를 반영

## 기술 요약

| 영역 | 내용 |
|------|------|
| UI 성능 | Slate Invalidation Panel · UIParticle `volatile` 제어 · Side Effect 정리 |
| 렌더링 | Actor Culling · Mipmap(ForceMipStreaming) 동적 제어 |
| 코드 | 최적화 BP → C++ 이전 · Tweener 의존 제거 |
| 품질 | Jira 연계 크래시·회귀 추적 (전체 변경의 약 30%) |

## 최적화 흐름

증가하는 렌더링·갱신 비용을 세 갈래로 나눠 절감했습니다.

<div class="mermaid">
flowchart TD
  COST["렌더링 / 갱신 비용 증가"] --> A["UI Invalidation<br/>위젯 갱신 최소화"]
  COST --> B["Culling<br/>화면 밖 액터 제외"]
  COST --> C["Mipmap 스트리밍<br/>동적 제어"]
  A --> RES["프레임 비용 절감"]
  B --> RES
  C --> RES
</div>
