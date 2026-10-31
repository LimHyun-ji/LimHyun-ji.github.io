---
layout: project
order: 1
title: "외형 시스템"
role: "Client Developer · 핵심 담당"
period: "2023 — 현재"
summary: "모든 Entity에 외형을 세팅 · 로드하는 VisualData 인게임 모듈과 데이터 소유 · 수명 구조."
tags: ["VisualData", "Character", "Module", "Attachment", "LOD", "Async Loading"]
highlights:
  - "PC · NPC · 아이템 등 모든 Entity에 부착되는 UVisualDataModuleComponent로, 파츠(Master / Face / Torso / Helmet) · Override Material · Attachment · 본 트랜스폼을 세팅 · 로드"
  - "**데이터 소유 일원화** — 여러 객체가 나눠 갖던 VisualData를 컴포넌트별로 필요한 데이터만 할당하고, 생명주기는 모듈 한 곳에서 관리"
  - "**전이 규칙(FullReset / PartialUpdate / NoUpdate)**으로 바뀐 파츠만 부분 갱신, Override Material · Color Tint · LOD로 에셋 재사용성 향상"
  - "Entity 별 모듈을 UObject 대신 TSharedPtr C++Class 객체로 UObject 개수 초과 방지"
---

> **목적** — 외형을 각 Entity에 **데이터로** 세팅 · 로드하고, 데이터의 소유와 수명을 한곳에서 관리하는 인게임 시스템
>
> **성과** — 외형 표현 데이터 주도 일관화, 데이터 소유 일원화, 부분 갱신 최적화, UObject 개수 초과 · 풀링 × 비동기 크래시 구조적 차단
>
> **기여** — 인게임 모듈 컴포넌트 · 타입별 모듈 · 전이 규칙 · Attachment 구조 설계


## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">구조 정립을 통한 전역 데이터 참조 문제 해결</p>
    <dl>
      <dt>문제</dt><dd>모든 Entity가 VD 데이터를 각자 산발적으로 들고 있던 구조</dd>
      <dt>해결</dt><dd>Module 시스템에서 각 Entity 타입별 Apply Module을 정의 후 필요한 컴포넌트에 데이터만 할당(필요 시 WeakPtr), 생명주기는 모듈 한 곳에서 관리</dd>
      <dt>결과</dt><dd>불필요한 전체 VD 데이터 참조 제거</dd>
    </dl>
    <a class="case-more" href="#case-allocating">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">UObject 최대 개수 초과 크래시</p>
    <dl>
      <dt>문제</dt><dd>Attachment를 UObject로 만들어 Entity가 많은 장면에서 UObject 최대 개수 초과(Exceed)</dd>
      <dt>해결</dt><dd>Attachment를 UObject 대신 TSharedPtr 기반 경량 객체로 전환</dd>
      <dt>결과</dt><dd>Attachment가 UObject 개수 · GC 추적 대상에서 빠짐</dd>
    </dl>
    <a class="case-more" href="#case-attachment">자세히 ↓</a>
  </div>
</div>


## 개요

- 외형 하드코딩 배제 → 데이터(VisualGameData)로 모듈을 생성·적용하는 데이터 주도 구조
- 모든 Entity 공통 단일 컴포넌트(`UVisualDataModuleComponent`)가 로드·적용·정리를 담당
- 전투 액션(몽타주 · ActionNotify)은 [전투 시스템 페이지](/projects/combat/), 에디터 저작 툴 · 데이터 export는 [VisualData 에디터 & Commandlet 페이지](/projects/visualdata-editor/)에서 다룹니다

<img class="diagram" src="/images/diagrams/visualdata-flow.svg" alt="VisualData 구성 구조: VisualGameData→UVisualDataModuleComponent(파츠 맵·현재 모듈 보유)→FVisualDataModuleBase 상속(PC·NPC·Spirit·Item·FieldObject·Totem)→FPCModuleAttachment 소켓 부착" />

## 구현 내용

<div id="case-allocating" class="case-anchor"></div>

- <strong>인게임 모듈 컴포넌트 — 각 Entity에 Visual 세팅 · 로드</strong>

  - 처음에는 여러 객체가 VisualData를 각자 들고 있어, 데이터가 언제 만들어지고 사라지는지가 흩어져 있었음
  - 각 컴포넌트에는 필요한 데이터만 할당(필요하면 WeakPtr로 참조)하고, 데이터 생명주기는 모듈 한 곳에서 관리
  - 모듈 생성은 `CreateModule` Factory로 통일
  - PC · NPC · Spirit · 필드오브젝트 · 아이템 등 <strong>모든 Entity 부착 대상</strong>
  - 파츠별 스켈레탈 메시를 맵으로 보유, 데이터 변경 시 모듈 재생성 · 재적용

    ```cpp
    class UVisualDataModuleComponent : public UActorComponent
    {
        // 데이터(VisualGameData) → 모듈 생성 → 적용
        void SetVisualGameData(const UVisualGameDataBase* InVisualGameData);
        virtual TSharedPtr<FVisualDataModuleBase> CreateModule(const UVisualGameDataBase* InVisualGameData);

        // 파츠별 스켈레탈 메시 (Master / Face / Torso / Helmet / Wing / Cape)
        TMap<EVisualDataCharacterPartType, USkeletalMeshComponent*> SkeletalMeshComponents;

        // 비동기 로드 (StreamableManager) + 완료 델리게이트
        TSharedPtr<FStreamableHandle> LoadAssets(const TArray<FSoftObjectPath>& AssetList, FStreamableDelegate&& OnCompleted);
    };
    ```

  - <strong>타입별 모듈 + 경량 폴리모피즘</strong>
    - `UObject` 대신 `TSharedPtr` 경량 모듈 채택 — 대량 Entity 생성 · GC 등록 · 추적 비용 회피
    - Entity 종류별 외형 규칙 차이 → `FVisualDataModuleBase` 상속 타입별 분리(PC / NPC / Spirit / Item / FieldObject / Totem)
    - `UObject`가 아니라 `Cast<>`를 쓸 수 없으므로 커스텀 RTTI(`ModuleCast<T>`)로 안전 다운캐스트

- <strong>전이 규칙으로 부분 갱신 최적화</strong>

  - 헬멧 하나만 바꿔도 전신 파츠와 Attachment를 전부 다시 로드하고 있었음 → 외형 데이터가 바뀔 때마다 모듈 전체를 다시 적용하는 구조였기 때문
  - 다음 데이터와 현재 상태를 비교해 갱신 범위를 정하는 <strong>전이 규칙</strong>(`EvaluateTransitionRule`) 도입
    - <strong>NoUpdate</strong>: 동일 → 아무것도 안 함
    - <strong>PartialUpdate</strong>: 바뀐 파츠만 교체 (예: 헬멧만)
    - <strong>FullReset</strong>: 전면 재구성
  - 실제 변경 파츠로 재로드 범위 한정 → 불필요한 전신 재로드 제거

- <strong>Override Material — 파츠 단위 공통화</strong>

  - NPC · Spirit 등 타입별 클래스에 따로 있던 Override Material 필드(본체 / Helmet / Torso 배열)를 캐릭터 공통 클래스(`UVisualGameData_Character`)의 파츠 키 맵 하나로 통합
  - 에디터에서 파츠 메시를 바꾸면 해당 파츠의 기본 머티리얼 목록을 맵에 다시 채우고, 런타임은 파츠 타입으로 찾아 적용
  - 통합 후 기존 VisualData 에셋을 새 필드 구조로 갱신하고, PC 헬멧에 Override Material이 적용되지 않던 누락을 수정

<div id="case-attachment" class="case-anchor"></div>

- <strong>Attachment — 무기 / 방어구 / 헬멧</strong>

  - PC 모듈은 방어구 · 헬멧 · 주 / 보조 무기를 <strong>소켓 기반 Attachment</strong>(`FPCModuleAttachment` 파생)로 부착
  - Attachment는 `TSharedPtr` 기반 경량 객체 → Entity가 많은 장면에서도 UObject 개수 · GC 추적 대상에 포함되지 않음
  - 경량 RTTI(`AttachmentCast<T>`) + 비동기 로드 · FX · 소켓 전환 처리
    - 무기 메시 · 추가 메시 · 이펙트를 한 번의 `FStreamableHandle`로 비동기 로드, 다시 로드하거나 Detach할 때 이전 핸들을 취소
  - <strong>무기 FX 정리</strong>
    - FX System Manager가 없는 액터(갓아머 연출 시퀀스의 프리뷰 캐릭터 등)에서 무기를 바꾸면 이전 무기의 나이아가라가 남는 문제
    - `ReleaseToPool()`만으로는 이펙트가 꺼지지 않아, 매니저가 없을 때 Detach에서 직접 즉시 비활성화

      ```cpp
      // PCModuleAttachment.cpp — FPCModuleAttachment_Weapon::Detach
      if (UFXSystemManagerComponent* FXSystemManagerComponent = UFXSystemManagerComponent::Get(OwnerActor))
      {
          FXSystemManagerComponent->RemoveFXSystemComponentsByTag(GetFXTagName(), true);
      }
      else // FX System Manager가 없는 경우 별도로 정리
      {
          for (const auto& NiagaraComp : NiagaraComponents)
          {
              if (NiagaraComp.IsValid())
                  NiagaraComp->DeactivateImmediate();
          }
      }
      NiagaraComponents.Empty();
      ```

- <strong>로딩 · 렌더 최적화</strong>

  - <strong>가시성 게이팅</strong>: VisualData <strong>로드가 끝난 Entity만 표시</strong> (`EntityVisibilityRule_VisualDataCompleted`) — 로딩 중 깜빡임 · 미완성 노출 방지
  - <strong>렌더 비용 제어</strong>: `OptimizeLOD`(2) 이상에서 Helmet / Face 파츠를 숨기는 LOD별 파츠 통합 — 상세는 [퍼포먼스 최적화 페이지](/projects/optimization/) 참고
