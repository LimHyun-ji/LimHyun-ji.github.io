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

- 인게임 시스템([외형 시스템](/projects/visualdata/) · [전투 시스템](/projects/combat/))과 짝을 이루는 **에디터 저작 툴**
- 에디터 전용 코드는 에디터 모듈(`Editor`)에 두고, 인게임과 같은 데이터·몽타주·Notify를 프리뷰
- 전투 Notify는 **Notify_Editor**로 에디터 프리뷰 동작을 분리해, 인게임 로직(Notify_Game)이 에디터 코드에 의존하지 않음

## 구현 내용

- <strong>아트 테스트 환경 — 서버 없이 인게임과 동일하게</strong>

  - 파츠별 메시 · Override Material · Attachment · 본 트랜스폼을 에디터에서 바로 설정하고 프리뷰
  - 몽타주와 Custom ActionNotify를 서버 없이 재생해 전투 연출을 확인 (Notify_Editor 경로)
  - 갓아머 연출용 본 트랜스폼도 에디터 프리뷰 전용 `EditorTransformBonesComponent`로 분리 → [인게임 연출 페이지](/projects/rendering-cinema/)
  - <strong>Editor Slate 구현</strong>
    - VisualData 에디터의 UI를 Slate로 직접 구현
  - <strong>Preview 환경 확장 · 유지보수</strong>
    - 새 Entity 타입이나 기능이 추가될 때마다 Preview 환경을 확장하고 상시 유지보수
    - 데이터 변경 → Preview 화면 즉시 반영: 디테일 패널에서 값을 바꾸면 프로퍼티 변경 이벤트를 받아 프리뷰에 바로 다시 적용 → 저장하거나 다시 실행하지 않아도 결과 확인

<div id="case-refactor" class="case-anchor"></div>

- <strong>슈퍼클래스 리팩토링</strong>

  - 리팩토링 전에는 PC · NPC · FieldObject · Item · Spirit의 데이터가 하나의 슈퍼클래스에 모여, 타입마다 다른 외형 규칙을 한 클래스 안에서 분기
  - 타입이 늘수록 유지보수가 어려워져 아래처럼 구조를 정리하고, 기존 에셋은 AssetMigration으로 새 타입에 이전
    - <strong>EditorModule 이전</strong> — 에디터 전용 코드를 런타임 모듈에서 분리
    - <strong>PreviewActor 병합</strong> — 흩어져 있던 프리뷰 액터를 하나로 통합
    - <strong>타입별 클래스 분리</strong> — 하나의 슈퍼클래스 Data를 PC / NPC / FieldObject / Item / Spirit 타입별 클래스로 분리
    - <strong>`VisualDataInterface` 제거</strong> — 타입별 클래스로 대체되어 불필요해진 인터페이스 정리

- <strong>AssetMigration — 구 에셋 자동 변환</strong>

  <img class="diagram" src="/images/diagrams/visualdata-migration.svg" alt="VisualData AssetMigration 흐름: 구 UVisualGameData 에셋(GameAsset/VisualData)을 VisualData Migration 에디터 메뉴가 읽어 타입별 클래스 에셋(GameAsset/VisualDataAsset)으로 생성하고, Metadata 에셋의 VisualGameDataAsset 참조를 교체한 뒤 구 클래스와 구 에셋을 삭제. 신 에셋은 UVisualGameDataBase 파생 클래스(PC · GodArmor · Npc · Spirit · Item · FieldObject)의 인스턴스이며, UVisualGameDataFactory(생성 타입 → 클래스 매핑)와 FVisualDataExport(UVisualGameDataBase 필터 · 클래스 프로퍼티 export)가 이를 사용" />

  - 리팩토링 전 슈퍼클래스(`UVisualGameData`)로 저장된 에셋을 에디터 메뉴(VisualData Migration)에서 새 타입 클래스 에셋으로 일괄 변환 → 수작업 재저장 없이 이전
  - <strong>변환 단계</strong>
    - 타입별 클래스 에셋을 새 경로에 생성하고, 이를 가리키는 Metadata 에셋의 참조를 함께 교체
    - 게임 · 에디터 코드의 사용처를 타입별 클래스 기준으로 바꾼 뒤 구 클래스와 구 에셋을 삭제
    - 이전 후 남은 데이터 보정(PC 프리뷰 무기 세팅, NPC SubType을 Monster로 지정)은 별도 서밋으로 정리
  - <strong>새 에셋 생성 경로도 같은 규칙</strong>
    - `UVisualGameDataFactory`가 생성 타입 → 클래스 매핑으로 에셋 클래스를 결정: GodArmor 남 / 여 → `UVisualGameData_GodArmor`, NPC Citizen / Monster → `UVisualGameData_Npc`(SubType으로 구분), PC / Spirit / Item / Object → 각 타입 클래스

- <strong>VisualData Export Commandlet</strong>

  - <strong>에디터 UI 없이 Commandlet</strong>(`UVisualDataExportCommandlet`)으로 VisualData 데이터를 JSON export → Jenkins CI에서 실행
    - Commandlet은 소스 컨트롤 사용 여부에 따라 P4 연동 export와 일반 export를 선택하는 기존 구조 (`Execute_ExportAllJsonWithP4v`)
  - NPC · 갓아머 · 정령 · 필드오브젝트 매핑과 액션 메타데이터를 export
  - export된 데이터는 런타임 메타데이터로 사용 → [메타데이터 파이프라인 페이지](/projects/metadata-pipeline/)
  - <strong>타입별 클래스 분리에 맞춘 export 정리</strong>
    - 에셋 검색 필터를 `UVisualGameDataBase` 기준으로 바꿔 타입별 파생 클래스 에셋을 모두 수집하고, 갓아머 / NPC / PC 액션 데이터는 각 타입 클래스에서 추출
    - 슈퍼클래스 시절에는 `ExportParameter` 프로퍼티마다 `VisualType` 메타("PC/NPC/…")를 파싱해 현재 타입에 해당하는지 걸러냈지만, 분리 후에는 각 클래스가 자기 타입의 필드만 가지므로 이 분기를 제거

      ```cpp
      // VisualDataExport.cpp — FVisualDataExport::ExportJson_Property
      for (TFieldIterator<FProperty> PropIt(InVisualGameData->GetClass(), EFieldIteratorFlags::IncludeSuper); PropIt; ++PropIt)
      {
          const FProperty* Property = *PropIt;
          if (!Property->GetMetaDataMap()->Contains("ExportParameter"))
              continue;
          // VisualType 메타 비교 제거 — 클래스 자체가 타입을 구분
          const void* ValuePtr = Property->ContainerPtrToValuePtr<void>(InVisualGameData);
          if (TSharedPtr<FJsonValue> PropertyValue = WriteValue(Property, ValuePtr))
          {
              FString PropertyName = Property->GetName().ToLower();
              if (Property->GetMetaDataMap()->Contains(FName("ExportParameterName")))
                  PropertyName = Property->GetMetaData(FName("ExportParameterName")).ToLower();
              OutJsonValue->SetField(PropertyName, PropertyValue);
          }
      }
      ```
