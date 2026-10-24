---
layout: project
order: 7
title: "메타데이터 파이프라인 & 런타임 서브시스템"
role: "Tools / Pipeline"
period: "2023.02 — 현재 (상시)"
summary: "기획 Excel을 JSON과 C++ enum/struct로 자동 생성하는 파이프라인과, 생성된 메타데이터를 런타임에 제공하는 MetaDataSubsystem."
tags: ["Python", "Code Generation", "Metadata", "MetaDataSubsystem", "Perforce"]
highlights:
  - "Excel → JSON → C++ enum/struct 자동 생성 파이프라인 설계·구축 (Perforce 자동화 · JSON Schema 검증 · 한글 인코딩)"
  - "생성된 메타데이터를 런타임 MetaDataSubsystem이 RidType 키로 제공 — 콘텐츠 규칙을 코드가 아닌 데이터로 정의"
  - "기획 Excel 수정 → 검증된 C++ 자동 생성으로 반복 작업 · 휴먼 에러 감소"
---

> **목적** — 기획 데이터를 손으로 옮기지 않고, 검증된 형태로 코드와 런타임까지 자동 전달
>
> **성과** — 데이터 반영 반복 작업 · 휴먼 에러 감소, 잘못된 데이터의 런타임 유입 차단
>
> **기여** — 코드 생성 파이프라인 설계·구축, 런타임 메타데이터 구조

## 개요

- 기획 Excel → JSON → C++ 코드까지 이어지는 **데이터 코드 생성 파이프라인**
- 생성된 메타데이터는 런타임 **`MetaDataSubsystem`**이 `RidType` 키로 조회 — 콘텐츠·VisualData·AreaTool 데이터가 모두 이 경로로 들어옴

## 1. Excel → JSON → C++ 코드 생성

- **Excel 원본 → JSON → C++ enum/struct** 자동 생성 흐름을 Python으로 설계·구축
- Perforce 체크인/아웃 자동화 · JSON Schema 검증 · 리스트 형식(`use_effect[0]/[1]`) · 한글 인코딩 처리 포함
- 기획 Excel 수정 → 검증된 C++ 자동 생성 구조 (반복 작업 · 휴먼 에러 감소)

## 2. MetaDataSubsystem — 런타임 메타데이터

- 생성된 메타데이터 테이블을 런타임에 제공하는 서브시스템
- 콘텐츠 Manager들이 `RidType` 키로 테이블을 조회 → 콘텐츠 규칙을 코드가 아닌 데이터로 정의
- 에디터 툴의 export 결과도 같은 경로로 유입
  - 레벨 · 스폰 데이터 → [AreaTool 페이지](/projects/areatool/)
  - VisualData 매핑 · 액션 메타데이터 → [VisualData 에디터 & Commandlet 페이지](/projects/visualdata-editor/)

## 기술 요약

| 영역 | 내용 |
|------|------|
| 언어 | Python · C++ |
| 생성 | Excel → JSON → C++ enum/struct |
| 검증 | JSON Schema · 리스트 형식 · 한글 인코딩 |
| 소스 컨트롤 | Perforce 체크인/아웃 자동화 |
| 런타임 | `MetaDataSubsystem` · `RidType` 키 |
