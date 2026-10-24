---
layout: project
order: 7
title: "데이터 파이프라인 — Excel ↔ JSON 변환 기능 확장 (Python)"
role: "Tools / Pipeline"
period: "2023.02 — 현재 (상시)"
summary: "기획 Excel ↔ JSON 메타데이터 변환 파이프라인(Python)에 Cron식 변환 · Unit 단위계 지원 · Custom Validation Script 지원을 추가."
tags: ["Python", "Data Pipeline", "Validation", "Cron", "Metadata"]
highlights:
  - "Python 기반 Excel ↔ JSON 메타데이터 변환 파이프라인 개선"
  - "Cron식 변환 지원 — 기획이 반복 일정을 Cron식으로 입력하면 파이프라인이 변환해 데이터로 반영"
  - "Unit 단위계 지원 — 단위가 붙은 값을 파이프라인에서 일관된 단위로 처리"
  - "Custom Validation Script 지원 — 데이터별 검증 스크립트를 붙여 변환 단계에서 잘못된 값을 차단"
---

> **목적** — 기획이 Excel에 입력한 데이터를 사람이 다시 손보지 않고, 검증된 형태로 런타임 메타데이터까지 전달
>
> **성과** — 잘못된 데이터의 런타임 유입 차단, 기획 데이터 작성 편의성 향상
>
> **기여** — Python 변환 파이프라인에 Cron식 변환 · Unit 단위계 · Custom Validation Script 기능 추가

## 개요

- 기획 Excel 데이터를 JSON 메타데이터로 변환하는 **Python 데이터 파이프라인**
- 기존 변환 흐름 위에 **데이터 표현력**(Cron식 · 단위계)과 **데이터 무결성**(커스텀 검증) 기능을 추가
- 변환된 메타데이터는 런타임 `MetaDataSubsystem`이 `RidType` 키로 조회

## 1. Cron식 변환 지원

- 반복 일정(예: 특정 요일·시각마다 열리는 콘텐츠)을 기획이 **Cron식**으로 입력
- 파이프라인이 Cron식을 해석·변환해 데이터로 반영 → 일정 데이터를 사람이 풀어서 적지 않아도 됨

## 2. Unit 단위계 지원

- 단위가 붙은 값을 파이프라인에서 인식해 **일관된 단위로 처리**
- 기획은 읽기 쉬운 단위로 입력하고, 런타임은 정해진 단위의 값만 받음 → 단위 착오로 인한 데이터 오류 감소

## 3. Custom Validation Script 지원

- 데이터(테이블)별로 **커스텀 검증 스크립트**를 붙일 수 있는 구조
- 변환 단계에서 스크립트가 값을 검사 → 규칙에 맞지 않는 데이터는 변환 시점에 걸러져 런타임으로 넘어가지 않음

## 4. 런타임 연결 — MetaDataSubsystem

- 변환된 메타데이터 테이블을 런타임 `MetaDataSubsystem`이 제공, 콘텐츠 Manager들이 `RidType` 키로 조회
- 에디터 툴의 export 결과도 같은 경로로 유입
  - 레벨 · 스폰 데이터 → [AreaTool 페이지](/projects/areatool/)
  - VisualData 매핑 · 액션 메타데이터 → [VisualData 에디터 & Commandlet 페이지](/projects/visualdata-editor/)

## 기술 요약

| 영역 | 내용 |
|------|------|
| 언어 | Python |
| 파이프라인 | 기획 Excel ↔ JSON 메타데이터 변환 |
| 추가 기능 | Cron식 변환 · Unit 단위계 지원 · Custom Validation Script |
| 런타임 | `MetaDataSubsystem` · `RidType` 키 |
