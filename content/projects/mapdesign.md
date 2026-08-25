---
layout: project
order: 5
title: "실시간 위치 기반 맵 설계 — 미니맵 · 월드맵"
role: "Client Developer"
period: "2024 — 현재"
summary: "MPC 기반 미니맵 실시간 동기화, InputProcessor 기반 월드맵 확대·드래그, 영역 이미지 동적 로딩으로 텍스처 비용 절감."
tags: ["Minimap", "World Map", "MPC", "Material", "InputProcessor", "Mobile"]
images:
  - src: "/images/projects/mapdesign/mapdesign-preview.gif"
    alt: "맵 설계 동작 미리보기"
highlights:
  - "미니맵: PC 위치를 MPC(Material Parameter Collection)로 머티리얼에 실시간 위치 parameter 전송해 동기화"
  - "미니맵: Quest Data를 머티리얼에 직접 동적 표시 — 별도 아이콘 위젯 없이 영역 제공하도록 최적화"
  - "월드맵: 모바일·PC 모두 대응하기 위해 InputProcessor 기반으로 설계해 확대·드래그 제공"
  - "월드맵: 그리고자 하는 영역을 고해상도 이미지로 동적 로딩해 텍스처 비용 절감"
  - "라이브 고도화: 월드맵 고해상도 타일링, 던전맵 등 맵 콘텐츠 확장"
---

> **목적** — PC 위치·퀘스트 데이터를 실시간 반영하는 미니맵과, PC·모바일 공통 입력을 지원하는 월드맵 설계
>
> **성과** — 별도 아이콘 위젯 없이 머티리얼 표시로 최적화, 영역 이미지 동적 로딩으로 텍스처 비용↓
>
> **기여** — MPC 기반 미니맵 위치 동기화·머티리얼 Quest Data 표시, InputProcessor 기반 월드맵 확대·드래그 직접 설계

## 개요

- **미니맵**과 **월드맵** 두 축으로, 실시간 위치 기반 맵 표시를 설계
- 미니맵은 머티리얼 중심으로 위치·퀘스트를 표현, 월드맵은 입력 처리·에셋 로딩을 중심으로 설계

<img class="diagram" src="/images/diagrams/mapdesign.svg" alt="맵 설계 관계도: PC Position→MPC→Minimap Material, Quest Data→Minimap Material, InputProcessor→World Map 확대/드래그, 고해상도 영역 이미지→(동적 로딩)→World Map" />

## 1. 미니맵 — MPC 기반 실시간 위치 동기화

- PC 위치를 **MPC(Material Parameter Collection)**를 통해 미니맵 머티리얼에 **실시간 위치 parameter**로 전송해 동기화
- 매 프레임 위젯 갱신 대신 머티리얼 파라미터로 위치를 반영 → 위치 표시를 GPU 측에서 처리

## 2. 미니맵 — Quest Data 머티리얼 직접 표시

- **Quest Data**를 머티리얼에 직접 동적으로 표시
- 별도 아이콘 위젯을 생성하지 않고도 영역을 제공하도록 최적화 → 표시 대상이 늘어도 위젯 비용이 늘지 않는 구조

## 3. 월드맵 — InputProcessor 기반 확대 · 드래그

- 모바일과 PC를 **모두 대응**하기 위해 **InputProcessor 기반**으로 설계
- 플랫폼별 입력 분기를 입력 처리 계층으로 일원화해 **확대·드래그** 조작 제공

## 4. 월드맵 — 영역 이미지 동적 로딩

- 그리고자 하는 영역을 **고해상도 이미지로 동적 로딩**
- 전체 맵을 상시 메모리에 올리지 않고 필요한 영역만 로딩 → **텍스처 비용 절감**

## 5. 라이브 콘텐츠 고도화

- **월드맵 고해상도 타일링** — 단일 영역 이미지 로딩을 타일 단위로 세분화해, 확대 수준에 맞는 해상도 타일만 로딩하도록 고도화
- **던전맵** — 던전 전용 맵 표시를 추가해 인게임 맵 콘텐츠를 확장

## 기술 요약

| 영역 | 내용 |
|------|------|
| 미니맵 위치 | `MPC(Material Parameter Collection)` → 미니맵 Material 실시간 위치 parameter |
| 미니맵 퀘스트 | Quest Data 머티리얼 직접 표시 (별도 아이콘 위젯 없이 영역 제공) |
| 월드맵 입력 | `InputProcessor` 기반 PC·모바일 공통 확대·드래그 |
| 월드맵 로딩 | 영역별 고해상도 이미지 동적 로딩 → 텍스처 비용 절감 |
| 라이브 고도화 | 월드맵 고해상도 타일링 · 던전맵 등 맵 콘텐츠 확장 |
