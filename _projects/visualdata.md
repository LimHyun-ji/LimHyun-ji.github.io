---
layout: project
order: 2
title: "VisualData — 캐릭터 비주얼 데이터 시스템 (인게임 전투)"
role: "Client Developer · 핵심 담당"
period: "2023 — 현재"
summary: "모든 엔티티에 외형·전투 Visual 데이터를 세팅·로드하고, 액션/전투 시스템과 결합하는 캐릭터 비주얼 데이터 시스템의 런타임과 저작 툴을 오너십으로 담당."
tags: ["VisualData", "Character", "SkeletalMesh", "Async Loading", "Action/전투", "Editor Tooling"]
highlights:
  - "PC·NPC·정령·토템·필드오브젝트·아이템 등 모든 엔티티에 부착되는 UVisualDataModuleComponent로, 파츠(Master/Face/Torso/Helmet/Wing/Cape)·Override Material·어태치먼트·본 트랜스폼을 세팅·로드"
  - "VisualGameData(액션/전투 데이터)로부터 타입별 모듈을 생성하고, 전이 규칙(FullReset/PartialUpdate/NoUpdate)으로 필요한 파츠만 부분 갱신"
  - "무기/방어구/헬멧 어태치먼트를 소켓 기반으로 부착 — 무기 애니메이션·Niagara FX·소켓 전환(장착↔납도)까지 처리"
  - "StreamableManager 비동기 로드 + 로드 완료 기준 EntityVisibility 게이팅, LOD·LightingChannel·Niagara Scalability로 렌더 비용 제어"
---

> 제가 **가장 오래·깊게 담당한 핵심 시스템**입니다. VisualData는 단순 외형이 아니라 **전투/액션 데이터와 맞물려 각 캐릭터에 실시간으로 세팅·로드되는 데이터 시스템**입니다. 런타임 컴포넌트부터 저작용 에디터 툴까지 오너십으로 다뤘습니다.

## 개요

캐릭터의 외형(파츠·재질·무기·이펙트)은 전투/액션 상황에 따라 계속 바뀝니다. 그래서 외형을 하드코딩하지 않고, **액션 데이터(VisualGameData)로부터 "모듈"을 만들어 각 엔티티에 적용**하는 데이터 주도 구조로 설계했습니다. 핵심은 **모든 엔티티에 공통으로 붙는 하나의 컴포넌트**가 이 로드·적용·정리를 책임진다는 점입니다.

## 1. 엔티티 공통 컴포넌트 — 각 캐릭터에 Visual 세팅·로드

`UVisualDataModuleComponent`는 PC·NPC·정령·토템·필드오브젝트·아이템 등 **모든 엔티티에 부착**됩니다. 파츠별 스켈레탈 메시를 맵으로 들고, 데이터가 바뀌면 모듈을 새로 만들어 적용합니다.

```cpp
// System/VisualDataCharacter/VisualDataModuleComponent.h
class SOL_API UVisualDataModuleComponent : public UActorComponent
{
    // 데이터(VisualGameData) → 모듈 생성 → 적용
    void SetVisualGameData(const UVisualGameDataBase* InVisualGameData);
    void SetModule(TSharedPtr<FVisualDataModuleBase> InNewModule);
    virtual TSharedPtr<FVisualDataModuleBase> CreateModule(const UVisualGameDataBase* InVisualGameData);

    // 파츠별 스켈레탈 메시 (Master/Face/Torso/Helmet/Wing/Cape)
    TMap<EVisualDataCharacterPartType, USkeletalMeshComponent*> SkeletalMeshComponents;

    // 비동기 로드 (StreamableManager) + 완료 델리게이트
    TSharedPtr<FStreamableHandle> LoadAssets(const TArray<FSoftObjectPath>& AssetList, FStreamableDelegate&& OnCompleted);
    bool bUseAsyncLoading = true;
    FSimpleMulticastDelegate OnModuleLoaded;
};
```

## 2. 타입별 모듈 + 경량 폴리모피즘

엔티티 종류마다 외형 규칙이 달라, `FVisualDataModuleBase`를 상속한 **타입별 모듈**(PC/NPC/Spirit/Item/FieldObject/Totem + Editor용)로 분리했습니다. 모듈은 `UObject`가 아닌 **`TSharedPtr` 기반 경량 객체**라, 커스텀 RTTI(`ModuleCast<T>`)로 안전하게 다운캐스트합니다.

```cpp
// System/VisualDataCharacter/Module/VisualDataModuleBase.h
enum class EVisualDataModuleKind : uint8 { Base, Character, PC, NPC, Spirit, Item, FieldObject, Totem, /* Editor* */ };

class SOL_API FVisualDataModuleBase : public TSharedFromThis<FVisualDataModuleBase>
{
    virtual void ApplyModule(EVisualDataModuleTransitionRule TransitionRule) {}
    virtual void OnEvent(const FInstancedStruct& Event) {}   // 전투/액션 이벤트 수신
    virtual bool IsKindOf(EVisualDataModuleKind InKind) const { return InKind == StaticKind; }
    // copy/move 삭제 — TStrongObjectPtr 완전형 요구를 피해 forward decl 만으로 헤더 사용 가능하게 설계
};
template<typename T> FORCEINLINE TSharedPtr<T> ModuleCast(const TSharedPtr<FVisualDataModuleBase>& P);
```

> `OnEvent(FInstancedStruct)`로 **전투/액션 이벤트를 받아** 해당 시점의 외형·연출을 갱신합니다 — VisualData가 전투 시스템과 맞물리는 지점입니다.

## 3. 전이 규칙으로 부분 갱신 최적화

외형이 바뀔 때마다 전체를 다시 로드하면 비쌉니다. 그래서 **다음 데이터와 현재 상태를 비교해 갱신 범위를 결정**합니다.

```cpp
// EvaluateTransitionRule → 갱신 범위 결정
enum class EVisualDataModuleTransitionRule { FullRest, PartialUpdate, NoUpdate };
```
- **NoUpdate**: 동일 → 아무것도 안 함
- **PartialUpdate**: 바뀐 파츠만 교체 (예: 헬멧만)
- **FullReset**: 전면 재구성

## 4. 어태치먼트 — 무기 / 방어구 / 헬멧

PC 모듈은 방어구·헬멧·주/보조 무기를 **소켓 기반 어태치먼트**로 붙입니다. 어태치먼트도 경량 RTTI(`AttachmentCast<T>`)로 관리하며, 비동기 로드·FX·소켓 전환을 처리합니다.

```cpp
// System/VisualDataCharacter/Module/PCModuleAttachment.h
enum class EPCModuleAttachmentType : uint8 { None, Armor, Helmet, MainWeapon, SubWeapon };

class SOL_API FPCModuleAttachment_Weapon : public FPCModuleAttachment
{
    virtual void Attach(UVisualDataModuleComponent* InOwnerComponent) override;
    void ChangeSocket(bool bInIsHeld);        // 장착 ↔ 납도 소켓 전환
    void PlayAnimation(UAnimSequence*, float PlayRate, bool bLooping); // 무기 애니메이션
    virtual void CreateFx() override;         // Niagara FX
private:
    void LoadAsyncAssets();                    // StreamableHandle 비동기 로드
    TSharedPtr<FStreamableHandle> StreamingHandle;
};
```

## 5. 전투/액션 결합 · 렌더 최적화

- **전투/액션 결합**: 모듈은 액션 데이터(`VisualGameData`, `System/Action/`)로부터 생성되고, `OnEvent`로 전투 이벤트를 받아 외형·연출을 갱신
- **가시성 게이팅**: VisualData **로드가 끝난 엔티티만 표시**(`EntityVisibilityRule_VisualDataCompleted`) — 로딩 중 깜빡임·미완성 노출 방지
- **렌더 비용 제어**: `OptimizeLOD`, `SetLightingChannels`, `bAllowNiagaraScalability`, 단일 그림자 캐시 갱신(`RefreshSingleShadowCaches`)
- **수명 안전**: 모듈/컴포넌트는 `TWeakObjectPtr`·`TSharedPtr`로 관리, `OnUnregister`에서 정리

## 기술 요약

| 영역 | 내용 |
|------|------|
| 컴포넌트 | `UVisualDataModuleComponent` (전 엔티티 공통) |
| 파츠 | `EVisualDataCharacterPartType` (Master·Face·Torso·Helmet·Wing·Cape) |
| 모듈 | 타입별(`PC/NPC/Spirit/Item/FieldObject/Totem`) + 커스텀 RTTI `ModuleCast<T>` |
| 갱신 | `EvaluateTransitionRule` → FullReset / PartialUpdate / NoUpdate |
| 어태치먼트 | 무기·방어구·헬멧, 소켓 전환, 무기 애니메이션, Niagara FX |
| 로딩 | `StreamableManager` 비동기 + 로드 완료 기준 EntityVisibility 게이팅 |
| 최적화 | LOD · LightingChannel · Niagara Scalability · SingleShadow 캐시 |
| 저작 툴 | VisualData 에디터(타입별 클래스 분리·AssetMigration) — [에디터 툴 페이지 참고] |

## 데이터 흐름

<div class="mermaid">
flowchart LR
  VGD["VisualGameData<br/>(액션·전투 데이터)"] --> COMP["UVisualDataModuleComponent<br/>(전 엔티티 공통)"]
  COMP --> MOD["타입별 모듈<br/>PC · NPC · Spirit · Item …"]
  MOD --> LOAD["비동기 로드<br/>(StreamableManager)"]
  LOAD --> RULE["전이 규칙<br/>Full / Partial / No"]
  RULE --> APPLY["파츠·어태치먼트·FX 적용"]
  APPLY --> VIS["로드 완료 → EntityVisibility 표시"]
  EVT["전투/액션 이벤트"] -. OnEvent .-> MOD
</div>
