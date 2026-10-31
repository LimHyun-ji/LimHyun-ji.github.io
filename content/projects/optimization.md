---
layout: project
order: 2
title: "퍼포먼스 / 메모리 최적화"
role: "Client Developer · 핵심 담당"
period: "상시"
summary: "'보이지 않는 것은 그리지 않는다'를 원칙으로, 모바일 타겟의 UI 렌더링·틱·메모리(GC/풀링/수명)를 다층적으로 최적화."
tags: ["Optimization", "Memory", "Mobile", "Slate", "Object Pooling", "RenderPass", "LOD"]
---

## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">Slate Hitching</p>
    <dl>
      <dt>문제</dt><dd>UI 화면에서 Slate Hitching(프레임 튐) 발생</dd>
      <dt>해결</dt><dd>Unreal Insights로 원인을 측정하고 화면 · 레이어 단위로 Invalidation 적용</dd>
      <dt>결과</dt><dd>매 프레임 위젯 재계산 비용 절감</dd>
    </dl>
    <a class="case-more" href="#case-slate-hitching">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">UObject Max Exceed Crash</p>
    <dl>
      <dt>문제</dt><dd>List View 아이템이 많은 경우 인게임 액터 등 UObject의 한계 수량에 도달해 크래시(모바일 빈번)</dd>
      <dt>해결</dt><dd>Actor Pooling으로 재사용성 향상, 및 풀스크린 진입시 명시적 GC</dd>
      <dt>결과</dt><dd>UObject생성 재사용을 통해 구조적 차단</dd>
    </dl>
    <a class="case-more" href="#case-pooling-crash">자세히 ↓</a>
  </div>
</div>

## 개요

- 모바일 타겟에서 UI 렌더링 · Tick · 메모리 비용을 상시 줄이기 위한 작업 모음

<img class="diagram" src="/images/diagrams/optimization-map.svg" alt="최적화 기법 맵: UI 렌더링(Global Invalidation·ForceVolatile·풀스크린 시 GameRendering false), Tick 제어(Sector 거리별·상태별), 메모리(오브젝트 풀링·명시적 GC로 UObject 개수 초과 방지)" />

## 구현 내용

<div id="case-slate-hitching" class="case-anchor"></div>

### UI 렌더링 최적화 (Slate Invalidation)

- <strong>측정 — Slate Hitching 원인을 Unreal Insights로 확인</strong>
  - UI 화면에서 Slate Hitching(프레임이 순간적으로 튀는 현상) 발생
  - Unreal Insights 측정 결과 `Slate::Tick (Time and Widgets)` · `Slate::DrawWindows` · `Slate_PaintSlowPath`가 매 프레임 실행 → 바뀌지 않은 위젯까지 매 프레임 다시 계산하고 그리고 있었음
  - 이 측정 결과를 근거로 Invalidation을 적용할 화면 / 레이어를 결정

  ![Slate 사이클 카운터 — Total Slate Tick Time·Draw Window·Game UI Paint·Tick Widgets](/images/projects/optimization/image-20250709-123214.png)
  ![Unreal Insights 타이밍 뷰 — Slate::Tick·Slate::DrawWindows·Slate::Prepass·Slate_PaintSlowPath](/images/projects/optimization/image-20250709-123225.png)

- <strong>적용 — Global Invalidation 화면 단위 동적 토글</strong>
  - CommonUI / Slate 최대 비용은 매 프레임 위젯 재계산 → 무거운 화면과 가벼운 HUD를 구분해 레이어 단위로 토글
  - 화면(`USolActivatableWidget`)마다 `bUseGlobalInvalidation` 값을 데이터로 지정하고, 풀스크린 화면이 모두 닫히면 다시 활성화
  - 게임 진입 / 종료 시점에도 전역 토글 → 로딩 중 UI 재계산 절감

    ```cpp
    // GeoFullScreenUILayerWidget.cpp — 활성 풀스크린 화면이 바뀔 때마다 호출
    bool IsGlobalInvalidationEnabled = true;   // 풀스크린 화면이 없으면(HUD만) 활성
    if (const auto* SolActivatableWidget = Cast<USolActivatableWidget>(SolWidgetContainer->GetActiveWidget()))
    {
        // 화면별 데이터로 사용 여부 선택
        IsGlobalInvalidationEnabled = SolActivatableWidget->UseGlobalInvalidation();
    }
    FSlateApplication::Get().ToggleGlobalInvalidation(IsGlobalInvalidationEnabled);
    ```

<div id="case-forcevolatile" class="case-anchor"></div>

- <strong>부작용 대응 — 계속 바뀌는 위젯만 Volatile</strong>
  - Invalidation을 켜자 스크롤 리스트 · 파티클처럼 계속 바뀌는 UI가 갱신되지 않는 문제 발생
  - 원인: Invalidation은 바뀌지 않은 위젯을 캐시해 재계산을 건너뛰는데, 동적 컨텐츠까지 캐시 대상에 들어감
  - 해당 위젯만 Volatile로 캐시에서 빼고 나머지 UI는 Invalidation 유지 — HUD에서 항상 Paint하는 위젯 · 선택상자 팝업 · 특성 강화 UI · UI Particle

    ```cpp
    // UIParticle.cpp — 재생 중 매 프레임 바뀌므로 위젯이 다시 만들어질 때마다 Volatile 지정
    void UUIParticle::OnWidgetRebuilt()
    {
        Super::OnWidgetRebuilt();
        ForceVolatile(true);
    }
    ```

- <strong>풀스크린 UI 아래 3D 렌더링 중지</strong>
  - 풀스크린 UI가 뜨면 가려지는 인게임 3D는 그리지 않는 기존 구조 (`USolDisableGameRenderingSubsystem`) 와 같은 화면 전환 지점에서 Invalidation 토글이 함께 동작

### LOD별 파츠 통합

- 원거리 Entity는 분리된 파츠(Master / Face / Torso / Helmet) 중 Helmet / Face 메시를 LOD에 따라 숨겨, 원거리에서 그리는 파츠 수를 줄임
- <strong>적용 대상</strong>
  - VisualData 에셋의 `bUseLODOptimize`를 켠 에셋만 적용 → 에셋별로 데이터에서 선택
  - 타입별 대상 파츠: PC → Face, 갓아머 / NPC → Helmet · Face
- <strong>판정 기준</strong>
  - Torso 메시의 `GetPredictedLODLevel()`이 `OptimizeLOD`(2) 이상이면 대상 파츠를 숨김
  - 컴포넌트 Tick(1초 간격)에서 LOD 값이 바뀐 경우에만 Visibility를 갱신하고, 에셋 로드 완료 시점에 한 번 다시 적용

    ```cpp
    // VisualDataModulePC.cpp
    void FVisualDataModulePC::Tick(float DeltaTime)
    {
        FVisualDataModuleCharacter::Tick(DeltaTime);
        if (!CanUseLODOptimizeBase())          // 에셋의 bUseLODOptimize
            return;
        const int32 CurrentLOD = GetBaseLOD(EVisualDataCharacterPartType::Torso); // GetPredictedLODLevel
        if (CurrentLOD == LastLOD)             // LOD가 바뀔 때만 처리
            return;
        LastLOD = CurrentLOD;
        OptimizeWithLOD(LastLOD);
    }

    void FVisualDataModulePC::OptimizeWithLOD(const int32 InLODIndex)
    {
        // LODPartTypes: PC → Face, GodArmor → Helmet · Face
        for (const EVisualDataCharacterPartType PartType : LODPartTypes.FindRef(VisualGameData->DataType))
            if (USkeletalMeshComponent* SkeletalComp = GetOwnerComponent()->GetSkeletalMeshComponent(PartType))
                SkeletalComp->SetVisibility(InLODIndex < GetOwnerComponent()->OptimizeLOD);
    }
    ```

### Tick / 기타 비용 절감

- <strong>월드맵 위젯 Tick 분리</strong>
  - 월드맵 지역 화면의 `NativeTick`을 제거하고, 화면이 열려 있는 동안에만 `FTSTicker`에 틱을 등록 · 닫힐 때 해제
- <strong>함께 적용된 프로젝트 공통 구조</strong>
  - Sector 기반으로 카메라 거리에 따른 NPC 틱 빈도 조절
  - 조작 불가 / 원격 상태 플레이어의 상태 기반 Tick 비활성화
  - FX 그림자 제거: 파티클 Notify에서 `SetCastShadow(false)`

<div id="case-pooling-crash" class="case-anchor"></div>

### 메모리 관리

- 모바일 메모리 예산 · GC 스파이크 절감
- <strong>UObject → 일반 C++ 클래스 전환</strong>
  - 아이템 수집 UI의 레시피 슬롯 · 수집 조건 데이터를 `UObject`에서 일반 클래스(`TSharedPtr<FItemCollectionRecipeSlot>`, `FItemCollectionCondition`)로 변경 → 리스트 데이터가 UObject 개수 · GC 추적 대상에서 빠짐
- <strong>VisualData 무기 FX 정리</strong>
  - FX System Manager가 없는 액터(갓아머 연출 시퀀스의 프리뷰 캐릭터 등)에서 무기 교체 시 나이아가라 잔상이 남던 문제 → Detach에서 직접 `DeactivateImmediate()` 호출로 정리 (`ReleaseToPool()`만으로는 꺼지지 않음)
- <strong>함께 적용된 프로젝트 공통 구조</strong>
  - 위젯 / 액터 오브젝트 풀링
  - 큰 UI 전환 · 무거운 탭 닫기 직후 명시적 GC(`ForceGarbageCollection`) → 메모리 스파이크 누적 방지
