---
layout: project
order: 2
title: "퍼포먼스 / 메모리 최적화"
role: "Client Developer · 핵심 담당"
period: "상시"
summary: "'보이지 않는 것은 그리지 않는다'를 원칙으로, 모바일 타겟의 UI 렌더링·틱·메모리(GC/풀링/수명)를 다층적으로 최적화."
tags: ["Optimization", "Memory", "Mobile", "Slate", "Object Pooling", "RenderPass"]
highlights:
  - "Unreal Insights로 Slate Tick 비용을 측정해 Slate Global Invalidation을 화면/레이어 단위로 동적 토글하고, 동적 콘텐츠는 ForceVolatile로 캐시에서 제외해 UI 재계산 비용 절감"
  - "위젯/액터 오브젝트 풀링(용량 상한 · 최근 사용 우선 반환 LIFO) + 큰 UI 전환 직후 명시적 GC(UObject Exceed 방지)로 CPU·메모리 비용 절감"
---

> **목적** — 모바일 타겟의 프레임·메모리 비용 상시 절감
>
> **성과** — UI 재계산 비용↓, 풀링으로 CPU 비용↓
>
> **기여** — Unreal Insights 기반 Slate Tick 측정 → Global Invalidation 동적 토글, 액터 풀링(freed-tick 차단)·명시적 GC


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


<img class="diagram" src="/images/diagrams/optimization-map.svg" alt="최적화 기법 맵: UI 렌더링(Global Invalidation·ForceVolatile·풀스크린 시 GameRendering false), Tick 제어(Significance·상태별), 메모리(오브젝트 풀링 freed-tick 방지·명시적 GC)" />

## 1. UI 렌더링 최적화 (Slate Invalidation)

<div id="case-slate-hitching" class="case-anchor"></div>

### 측정 — Slate Hitching 원인을 Unreal Insights로 확인

**UI 화면에서 Slate Hitching(프레임이 순간적으로 튀는 현상)이 발생했습니다.** Unreal Insights로 UI 프레임 비용을 측정하자 `Slate::Tick (Time and Widgets)` · `Slate::DrawWindows` · `Slate_PaintSlowPath`가 **매 프레임** 실행되고 있었습니다. 바뀌지 않은 위젯까지 매 프레임 다시 계산하고 그리고 있었던 것이고, 이 측정 결과를 근거로 어느 화면/레이어에 Invalidation을 적용할지 정했습니다.

![Slate 사이클 카운터 — Total Slate Tick Time·Draw Window·Game UI Paint·Tick Widgets](/images/projects/optimization/image-20250709-123214.png)
![Unreal Insights 타이밍 뷰 — Slate::Tick·Slate::DrawWindows·Slate::Prepass·Slate_PaintSlowPath](/images/projects/optimization/image-20250709-123225.png)

### 적용 — Global Invalidation

- CommonUI/Slate 최대 비용: **매 프레임 위젯 재계산**
- 무거운 화면·가벼운 HUD 구분 → **Global Invalidation 레이어 단위 동적 토글**

```cpp
IsGlobalInvalidationEnabled = SolActivatableWidget->UseGlobalInvalidation();
...
FSlateApplication::Get().ToggleGlobalInvalidation(IsGlobalInvalidationEnabled);
```
```cpp
// 화면별로 사용 여부를 데이터로 선택
bool bUseGlobalInvalidation = false;
```

<div id="case-forcevolatile" class="case-anchor"></div>

**그런데 Invalidation을 켜자 스크롤 리스트가 제대로 갱신되지 않는 문제가 생겼습니다.** Invalidation은 바뀌지 않은 위젯을 캐시해 재계산을 건너뛰는데, 스크롤처럼 계속 바뀌는 콘텐츠까지 캐시 대상에 들어갔기 때문입니다. 그래서 스크롤 박스만 `ForceVolatile`로 캐시에서 빼고, 나머지 UI는 Invalidation을 유지했습니다.

```cpp
.ForceVolatile(true)  // 동적 콘텐츠 캐싱 이슈 방지를 위해 항상 volatile
```

- 게임 진입/종료 시 전역 토글 → 로딩 중 UI 재계산 절감
- **풀스크린 UI가 뜨면 가려지는 인게임 3D는 그리지 않음** → `GameRendering`을 false로(뷰포트 렌더링 중지)해 모바일 GPU 비용 절감. GPU 렌더 파이프라인에 대한 이해를 바탕으로 보이지 않는 픽셀에 자원을 낭비하지 않는 원칙을 적용

```cpp
// 화면별 플래그로 뷰포트 렌더링 중지
bIsDisableRenderingOnFullScreen = SolActivatableWidget->IsDisableViewportRenderingOnFullScreen();
USolDisableGameRenderingSubsystem::Get()
    ->SetReason(ESolDisableGameRenderingReason::FullScreen, bIsDisableRenderingOnFullScreen);
```

## 2. Tick / 렌더 패스 비용 절감

- **Sector** 기반으로 카메라 거리에 따른 NPC 틱 빈도 자동 조절

- 상태 기반 Tick 비활성화 적용 대상:
  - 조작 불가/원격 상태 플레이어
- FX 그림자 제거: 파티클 Notify에서 `SetCastShadow(false)`

---

<div id="case-pooling-crash" class="case-anchor"></div>

## 3. 메모리 관리

- 모바일 메모리 예산·GC 스파이크 절감
- 명시적 GC — 큰 UI 전환 직후

- 무거운 탭 닫기 직후 즉시 GC → 메모리 스파이크 누적 방지

```cpp
GEngine->ForceGarbageCollection(true);
```
