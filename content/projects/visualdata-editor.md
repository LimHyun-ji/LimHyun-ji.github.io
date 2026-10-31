---
layout: project
order: 6
title: "VisualData 에디터(유지보수 및 개선)"
role: "Tools / Editor"
period: "2023 — 현재 (리팩토링)"
summary: "서버 없이 인게임과 같은 외형·전투 연출을 미리 보는 VisualData 에디터 확장."
tags: ["Editor Tooling", "VisualData", "Slate", "EditorModule", "AssetMigration", "Commandlet"]
images:
  - src: "/images/projects/visualdata/Screenshot_25.png"
    alt: "VisualData 에디터 — 파츠별 메시 설정과 캐릭터 프리뷰"
---

## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">프리뷰에서 본 트랜스폼 미적용</p>
    <dl>
      <dt>문제</dt><dd>에디터 프리뷰 메시는 <code>UAnimPreviewInstance</code>로 재생돼, 인게임 AnimInstance를 거치는 본 트랜스폼이 적용되지 않음</dd>
      <dt>해결</dt><dd>프리뷰 인스턴스의 <code>ModifyBone()</code>으로 본별 Bone Modify 노드를 넣고, 스케일 · 이동의 적용 공간을 분리</dd>
      <dt>결과</dt><dd>체형 값을 바꾸면 에디터 프리뷰에 바로 반영</dd>
    </dl>
    <a class="case-more" href="#case-preview-bones">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">슈퍼클래스에 엉킨 타입별 규칙</p>
    <dl>
      <dt>문제</dt><dd>모든 타입의 에디터 데이터가 하나의 슈퍼클래스에 모여 유지보수가 어려움</dd>
      <dt>해결</dt><dd>타입별 클래스 분리 + AssetMigration으로 구 에셋 자동 변환</dd>
      <dt>결과</dt><dd>기존 에셋 일괄 이전, 에디터 구조 부채 해소</dd>
    </dl>
    <a class="case-more" href="#case-refactor">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">에디터 · 인게임 외형 로직 이중화</p>
    <dl>
      <dt>문제</dt><dd>에디터 전용 컴포넌트가 인게임 외형 로직을 따로 구현해, 외형 변경 시 양쪽을 모두 수정해야 함</dd>
      <dt>해결</dt><dd>인게임 모듈 컴포넌트를 상속해 모듈 생성(<code>CreateModule</code>)만 교체, 에디터 전용 동작은 모듈 override로 분리</dd>
      <dt>결과</dt><dd>에디터 전용 컴포넌트 삭제, 인게임 모듈 수정이 프리뷰에 그대로 반영</dd>
    </dl>
    <a class="case-more" href="#case-module-reuse">자세히 ↓</a>
  </div>
</div>

## 개요

<img class="diagram" src="/images/diagrams/visualdata-editor.svg" alt="VisualData 에디터 구조: FVisualDataEditor → Preview/ActionTable/Property/Outliner 탭, UVisualDataEditorSubsystem, Visual PlayMode, Export → JSON → 서버 동기화" />

- 인게임 시스템([외형 시스템](/projects/visualdata/) · [전투 시스템](/projects/combat/))과 짝을 이루는 **에디터 저작 툴**
- 에디터 전용 코드는 에디터 모듈(`Editor`)에 두고, 인게임과 같은 데이터·몽타주·Notify를 프리뷰

## 구현 내용

### 아트 테스트 환경 — 서버 없는 인게임 동일 프리뷰

- 파츠별 메시 · Override Material · Attachment · 본 트랜스폼을 에디터에서 바로 설정하고 프리뷰
- 몽타주와 Custom ActionNotify를 서버 없이 재생해 전투 연출을 확인 (Notify_Editor 경로)
- <strong>Editor Slate 구현</strong>
  - VisualData 에디터의 UI를 Slate로 직접 구현
- <strong>Preview 환경 확장 · 유지보수</strong>
  - 새 Entity 타입이나 기능이 추가될 때마다 Preview 환경을 확장하고 상시 유지보수

<div id="case-preview-bones" class="case-anchor"></div>

### 에디터 본 트랜스폼 프리뷰 — AnimPreviewInstance

![VisualData 에디터 — 파츠 · BoneTransform 값을 디테일 패널에서 바꾸면 우측 프리뷰 캐릭터에 바로 반영](/images/projects/visualdata/editor-bone-transform.jpg)

- PC의 체형 값을 인게임에서는 AnimInstance(`ULocomotionAnimInstance`)에 넘겨 적용
- 에디터 프리뷰 메시(`UDebugSkelMeshComponent`)는 `UAnimPreviewInstance`로 재생돼 이 경로를 타지 않음 → 에디터 전용 `UEditorTransformBonesComponent`에서 프리뷰 인스턴스에 직접 적용
- <strong>본별 Bone Modify 노드 주입</strong>
  - `UAnimPreviewInstance::ModifyBone()`이 본 이름으로 `FAnimNode_ModifyBone`을 찾거나 추가 → 체형 값이 바뀔 때마다 같은 노드를 갱신
  - 스케일은 컴포넌트 공간에서 교체, 이동은 부모 본 공간에서 더하기, 회전은 건드리지 않음

    ```cpp
    // EditorTransformBonesComponent.cpp
    if (auto* PrevInst = Cast<UAnimPreviewInstance>(SkelMesh->PreviewInstance))
    {
        auto Apply = [PrevInst](FName Bone, FVector Scale, FVector Trans = FVector::ZeroVector)
        {
            FAnimNode_ModifyBone& Mod = PrevInst->ModifyBone(Bone);   // find-or-add
            Mod.ScaleMode        = EBoneModificationMode::BMM_Replace;
            Mod.Scale            = Scale;
            Mod.ScaleSpace       = EBoneControlSpace::BCS_ComponentSpace;
            Mod.TranslationMode  = EBoneModificationMode::BMM_Additive;
            Mod.Translation      = Trans;
            Mod.TranslationSpace = EBoneControlSpace::BCS_ParentBoneSpace;
            Mod.RotationMode     = EBoneModificationMode::BMM_Ignore;
        };
        Apply("head", Cur.HeadScale);
        Apply("pelvis", Cur.PelvisScale, Cur.PelvisTrans);
        Apply("upperarm_l", Cur.ArmsScale);
        // spine · clavicle · thigh 등 12개 본
    }
    ```


<div id="case-module-reuse" class="case-anchor"></div>

### 에디터 프리뷰의 인게임 모듈 재사용

- 기존에는 에디터 전용 `VisualDataEditorComponent`가 인게임 외형 로직을 따로 구현 → 외형 기능을 바꿀 때마다 인게임 · 에디터 양쪽 수정
- <strong>상속 + 모듈 생성 교체 (Factory Method)</strong>
  - 에디터 컴포넌트를 인게임 `UVisualDataModuleComponent`의 자식으로 바꾸고, 타입별 모듈 생성 함수 `CreateModule()` 하나만 override
  - 생성되는 에디터 모듈도 인게임 모듈을 상속 → 로드 · 파츠 적용 · 전이 규칙은 인게임 코드 그대로 실행

    ```cpp
    // VisualDataEditorModuleComponent.cpp
    TSharedPtr<FVisualDataModuleBase> UVisualDataEditorModuleComponent::CreateModule(const UVisualGameDataBase* InVisualGameData)
    {
        if (InVisualGameData->DataType == EVisualGameDataType::GodArmor
            || InVisualGameData->DataType == EVisualGameDataType::PC)
        {
            // FVisualDataEditorModulePC : FVisualDataModulePC
            TSharedPtr<FVisualDataModuleBase> Module = MakeShared<FVisualDataEditorModulePC>(this);
            Module->SetVisualGameData(const_cast<UVisualGameDataBase*>(InVisualGameData));
            return Module;
        }
        ...
        return Super::CreateModule(InVisualGameData);   // 그 외 타입은 인게임 모듈 그대로
    }
    ```

<div id="case-refactor" class="case-anchor"></div>

### 데이터 에셋 타입 분리 · 구 에셋 일괄 이전

- 리팩토링 전에는 PC · NPC · FieldObject 등의 데이터가 하나의 슈퍼클래스에 모여, 타입마다 다른 외형 규칙을 한 클래스 안에서 분기
- 타입이 늘수록 유지보수가 어려워져 아래처럼 구조를 정리하고, 기존 에셋은 AssetMigration으로 새 타입에 이전
  - <strong>EditorModule 이전</strong> — 에디터 전용 코드를 런타임 모듈에서 분리
  - <strong>PreviewActor 병합</strong> — 흩어져 있던 프리뷰 액터를 하나로 통합
  - <strong>타입별 클래스 분리</strong> — 하나의 슈퍼클래스 Data를 PC / NPC / FieldObject / Item / Spirit 타입별 클래스로 분리
  - <strong>`VisualDataInterface` 제거</strong> — 타입별 클래스로 대체되어 불필요해진 인터페이스 정리


<img class="diagram" src="/images/diagrams/visualdata-migration.svg" alt="VisualData AssetMigration 흐름: 구 UVisualGameData 에셋(GameAsset/VisualData)을 VisualData Migration 에디터 메뉴가 읽어 타입별 클래스 에셋(GameAsset/VisualDataAsset)으로 생성하고, Metadata 에셋의 VisualGameDataAsset 참조를 교체한 뒤 구 클래스와 구 에셋을 삭제. 신 에셋은 UVisualGameDataBase 파생 클래스(PC · GodArmor · Npc · Spirit · Item · FieldObject)의 인스턴스이며, UVisualGameDataFactory(생성 타입 → 클래스 매핑)와 FVisualDataExport(UVisualGameDataBase 필터 · 클래스 프로퍼티 export)가 이를 사용" />

- 리팩토링 전 슈퍼클래스(`UVisualGameData`)로 저장된 에셋을 에디터 메뉴(VisualData Migration)에서 새 타입 클래스 에셋으로 일괄 변환 → 수작업 재저장 없이 이전

### VisualData Export Commandlet

- <strong>에디터 UI 없이 Commandlet</strong>으로 VisualData 데이터를 JSON export (`UVisualDataExportCommandlet`) → Jenkins CI에서 실행
  - Commandlet은 소스 컨트롤 사용 여부에 따라 P4 연동 export와 일반 export를 선택하는 기존 구조 (`Execute_ExportAllJsonWithP4v`)
- <strong>타입별 클래스 분리에 맞춘 export 정리</strong>
  - 슈퍼클래스 시절에는 `ExportParameter` 프로퍼티마다 `UPROPERTY` 메타("PC/NPC/…")를 파싱해 현재 타입에 해당하는지 걸러냈지만, 분리 후에는 각 클래스가 자기 타입의 필드만 가지므로 이 분기를 제거

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
