---
layout: project
order: 6
title: "VisualData 에디터 & Commandlet (유지보수 및 개선)"
role: "Tools / Editor"
period: "2023 — 현재 (리팩토링)"
summary: "서버 없이 인게임과 같은 외형·전투 연출을 미리 보는 VisualData 에디터와, 데이터를 빌드 단계에서 export하는 Commandlet 담당."
tags: ["Editor Tooling", "VisualData", "Slate", "EditorModule", "AssetMigration", "Commandlet"]
images:
  - src: "/images/projects/visualdata/Screenshot_25.png"
    alt: "VisualData 에디터 — 파츠별 메시 설정과 캐릭터 프리뷰"
highlights:
  - "서버 없이 인게임과 동일한 외형·전투 동작을 미리 보는 아트 테스트 환경 제공 — 아트팀 이터레이션 단축"
  - "에디터 UI를 Slate로 직접 구현하고, 변경이 프리뷰 화면에 바로 반영되도록 Editor Preview 환경을 확장 · 유지보수"
  - "VD슈퍼클래스 리팩토링: EditorModule 이전 · PreviewActor 병합 · 타입별(PC / NPC / FieldObject / Item / Spirit) 클래스 분리 · VisualDataInterface 제거"
  - "구 에셋을 새 타입으로 자동 변환하는 AssetMigration 툴로 에디터 구조 부채를 일괄 정리"
---

> **목적** — 아트·기획이 서버 없이 외형과 전투 연출을 직접 확인하고, 데이터는 빌드 단계에서 자동으로 export되는 저작 환경
>
> **성과** — 아트 이터레이션 단축, 에디터 구조 부채 일괄 정리, 데이터 export 자동화
>
> **기여** — VisualData 에디터 Slate UI · Preview 환경 개발 · 리팩토링, AssetMigration 툴, VisualData Export Commandlet


## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">슈퍼클래스에 엉킨 타입별 규칙</p>
    <dl>
      <dt>문제</dt><dd>모든 타입의 에디터 데이터가 하나의 슈퍼클래스에 모여 유지보수가 어려움</dd>
      <dt>해결</dt><dd>타입별 클래스 분리 + AssetMigration으로 구 에셋 자동 변환</dd>
      <dt>결과</dt><dd>기존 에셋 일괄 이전, 에디터 구조 부채 해소</dd>
    </dl>
    <a class="case-more" href="#case-refactor">자세히 ↓</a>
  </div>
</div>


## 개요

<img class="diagram" src="/images/diagrams/visualdata-editor.svg" alt="VisualData 에디터 구조: FVisualDataEditor → Preview/ActionTable/Property/Outliner 탭, UVisualDataEditorSubsystem, Visual PlayMode, Export → JSON → 서버 동기화" />

- 인게임 시스템([VisualData 페이지](/projects/visualdata/))과 짝을 이루는 **에디터 저작 툴**
- 에디터 전용 코드는 에디터 모듈(`SolEditor`)에 두고, 인게임과 같은 데이터·몽타주·Notify를 프리뷰
- 전투 Notify는 **Notify_Editor**로 에디터 프리뷰 동작을 분리해, 인게임 로직(Notify_Game)이 에디터 코드에 의존하지 않음

## 1. 아트 테스트 환경 — 서버 없이 인게임과 동일하게

- 파츠별 메시 · Override Material · Attachment · 본 트랜스폼을 에디터에서 바로 설정하고 프리뷰
- 몽타주와 Custom ActionNotify를 서버 없이 재생해 전투 연출을 확인 (Notify_Editor 경로)
- 갓아머 연출용 본 트랜스폼도 에디터 프리뷰 전용 `EditorTransformBonesComponent`로 분리 → [인게임 연출 페이지](/projects/rendering-cinema/)

### Editor Slate 구현

- VisualData 에디터의 UI를 **Slate로 직접 구현**

### Preview 환경 확장 · 유지보수

- 새 Entity 타입이나 기능이 추가될 때마다 **Preview 환경을 확장**하고 상시 유지보수
- **데이터 변경 → Preview 화면 즉시 반영** — 디테일 패널에서 데이터 값을 바꾸면 프로퍼티 변경 이벤트를 받아 프리뷰에 바로 다시 적용 → 저장하거나 다시 실행하지 않아도 결과를 확인

<div id="case-refactor" class="case-anchor"></div>

## 2. 슈클래스 리팩토링

**리팩토링 전에는 PC · NPC · FieldObject · Item · Spirit의 에디터 데이터가 하나의 슈퍼클래스에 모여, 타입마다 다른 외형 규칙을 한 클래스 안에서 분기하고 있었습니다.** 타입이 늘수록 유지보수가 어려워져 아래처럼 구조를 정리했고, 기존 에셋은 AssetMigration(3번)으로 새 타입에 옮겼습니다.

- **EditorModule 이전** — 에디터 전용 코드를 런타임 모듈에서 분리
- **PreviewActor 병합** — 흩어져 있던 프리뷰 액터를 하나로 통합
- **타입별 클래스 분리** — 하나의 슈퍼클래스 Data를 PC / NPC / FieldObject / Item / Spirit 타입별 클래스로 분리
- **`VisualDataInterface` 제거** — 타입별 클래스로 대체되어 불필요해진 인터페이스 정리

## 3. AssetMigration — 구 에셋 자동 변환

- 리팩토링 전 구조로 저장된 에셋을 **새 타입으로 자동 변환**
- 수작업 재저장 없이 기존 에셋을 일괄 이전 → 에디터 아키텍처 부채 일괄 해소

## 4. VisualData Export Commandlet

- **에디터 UI 없이 Commandlet**으로 VisualData 데이터를 JSON export → Jenkins CI에서 실행
- NPC · 갓아머 · 정령 · 필드오브젝트 매핑과 액션 메타데이터를 export, 필요 시 P4 연동
- export된 데이터는 런타임 메타데이터로 사용 → [메타데이터 파이프라인 페이지](/projects/metadata-pipeline/)

## 기술 요약

| 영역 | 내용 |
|------|------|
| 에디터 | UE5 Editor Module(`SolEditor`) · Slate UI · 타입별 클래스 · PreviewActor |
| 프리뷰 | 서버 없이 외형 · 몽타주 · Custom ActionNotify(Notify_Editor) 재생 · UPROPERTY 변경 즉시 반영 |
| 마이그레이션 | AssetMigration — 구 에셋 → 신 타입 자동 변환 |
| 자동화 | `VisualDataExportCommandlet` → `FVisualDataExport` JSON export · Jenkins CI · P4 |
