---
layout: project
order: 4
title: "UI 아키텍처 분석 — Layer · Container · WidgetPool"
role: "Client Developer"
period: "구조 분석 문서"
summary: "Sol UI 프레임워크(레이어 스택 · ActivatableWidgetContainer · 위젯 풀)의 관계 구조 분석. 엔진 CommonUI/Lyra 표준 패턴과의 대조 검증 포함."
tags: ["CommonUI", "Slate", "Architecture", "Widget Pooling", "Lyra"]
highlights:
  - "UPrimaryGameLayout → Layer(스택형/캔버스형) → Container → WidgetPool로 이어지는 책임 분리 구조"
  - "스위처(SCommonAnimatedSwitcher)가 스택 표시 규칙·전환 연출·입력 차단·풀 반납 타이밍의 중심축"
  - "엔진 CommonUI 컨테이너와 멤버 단위 1:1 대조 — Epic 권장 패턴 + 모바일용 풀 상한 보강임을 검증"
---

## 전체 관계도

`UPrimaryGameLayout`(UI 루트)이 `FGameplayTag`(UI.Layer.*)로 레이어를 1:N 등록하고,
레이어는 **스택형**(`UCommonUILayerWidget` + 컨테이너)과 **캔버스형**(`UPopupUILayerWidget`) 두 갈래로 나뉩니다.
두 갈래 모두 끝단에서 `FSolUserWidgetPool`이 위젯 UObject를 재사용합니다.

<div class="mermaid">
classDiagram
    direction TB
    class UPrimaryGameLayout {
        &lt;&lt;UI 루트&gt;&gt;
        -Layers : TMap~FGameplayTag, Layer~
        +PushWidgetToLayerStack(Tag, Class)
        +PushWidgetToLayerStackAsync(...)
    }
    class UGameUILayerWidgetBase {
        &lt;&lt;Abstract 레이어 인터페이스&gt;&gt;
        +AddWidget(Class, InitFunc)*
        +RemoveWidget(W)*
    }
    class UCommonUILayerWidget {
        &lt;&lt;스택형: HUD / Full / Sequence&gt;&gt;
        #SolWidgetContainer (BindWidget)
    }
    class UPopupUILayerWidget {
        &lt;&lt;캔버스형: Popup&gt;&gt;
        -Canvas : UCanvasPanel
        -GeneratedWidgetsPool
    }
    class USolActivatableWidgetContainer {
        &lt;&lt;UWidget&gt;&gt;
        #WidgetList (스택)
        #MySwitcher : SCommonAnimatedSwitcher
        #GeneratedWidgetsPool
        #MaxCap 8 / Mobile 1
    }
    class FSolUserWidgetPool {
        &lt;&lt;USTRUCT 풀&gt;&gt;
        -Active / Inactive / SlateCache
        +GetOrCreateInstance(Class)
        +Release(W, bReleaseSlate)
    }
    UPrimaryGameLayout "1" o-- "N" UGameUILayerWidgetBase : UI.Layer.* 태그 등록
    UGameUILayerWidgetBase <|-- UCommonUILayerWidget
    UGameUILayerWidgetBase <|-- UPopupUILayerWidget
    UCommonUILayerWidget "1" *-- "1" USolActivatableWidgetContainer
    USolActivatableWidgetContainer "1" *-- "1" FSolUserWidgetPool
    UPopupUILayerWidget "1" *-- "1" FSolUserWidgetPool
</div>

## Push 한 번에 일어나는 일

<div class="mermaid">
sequenceDiagram
    participant C as 호출자
    participant P as UPrimaryGameLayout
    participant L as Layer
    participant K as Container
    participant Pool as WidgetPool
    C->>P: PushWidgetToLayerStack(UI.Layer.Full, WBP_Guild)
    P->>L: Layers[Tag] → AddWidget(Class)
    L->>K: SolWidgetContainer.AddWidget(...)
    K->>Pool: GetOrCreateInstance(Class)
    Pool-->>K: 재사용 또는 신규 생성
    K->>K: WidgetList.Add → Switcher 전환
    Note over K: 닫힐 때 Release(bReleaseSlate=true)<br/>UObject만 풀 보관, Slate는 파기
</div>

## 왜 Canvas가 아니라 AnimatedSwitcher인가

컨테이너의 Slate 구조는 `SOverlay( MySwitcher + MyInputGuard )`. 스위처가 다섯 가지 역할을 묶어 해결합니다.

| 역할 | 구현 |
|---|---|
| **스택 의미론** | "N개 보유, 1개만 표시" = 스위처 모델 그 자체. Pop은 `TransitionToIndex(top-1)` 한 줄 |
| **전환 연출** | TransitionType/Curve/Duration 내장 — 페이드/슬라이드 공짜 |
| **입력 차단** | 전환 시작/끝을 아는 건 스위처뿐 → `OnIsTransitioningChanged`로 InputGuard 토글 |
| **풀 반납 타이밍** | 전환 완료(`OnActiveIndexChanged`) 시점에만 위 슬롯 일괄 Release — 연출 중 파괴 방지 |
| **0번 더미 슬롯** | `SNullWidget`을 깔아 첫 화면도 전환 연출로 in/out |

**Canvas와 비교** — Canvas는 모든 자식을 매 프레임 paint(풀스크린 오버드로)하고, 표시 상태·전환 연출·타이밍 이벤트를 전부 손으로 구현해야 합니다. 스위처 계열은 **활성 1개만 paint**. 실제로 Sol은 용도별로 둘 다 사용합니다: 화면 간 전환이 필요한 스택 = 스위처, 여러 개 동시 표시가 필요한 Popup 레이어 = Canvas.

## 엔진 권장 구조인가 — CommonUI/Lyra 대조

**그렇습니다.** 엔진 `UCommonActivatableWidgetContainerBase`(Plugins/Runtime/CommonUI)와 **멤버명까지 1:1 일치**합니다:

```cpp
// 엔진 원본 CommonActivatableWidgetContainer.h:139-144
UPROPERTY(Transient)
FUserWidgetPool GeneratedWidgetsPool;            // 풀 내장 — 엔진 설계
TSharedPtr<SOverlay> MyOverlay;
TSharedPtr<SSpacer> MyInputGuard;
TSharedPtr<SCommonAnimatedSwitcher> MySwitcher;  // 스위처 — 엔진 설계
TArray<TSharedPtr<SWidget>> ReleasedWidgets;     // 1프레임 보관 트릭까지 동일
```

`UPrimaryGameLayout` + GameplayTag 레이어 등록은 Epic 공식 샘플 **Lyra**의 패턴이고, `FUserWidgetPool`은 엔진 UMG 공식 API입니다.

**Sol이 더한 것**: 엔진 풀에는 용량 상한이 없는데, Sol은 `FSolUserWidgetPool`로 포크해 **MaxCapacity + FIFO 초과 파괴**와 **플랫폼별 상한(모바일 1 / PC 8)** 을 추가 — 모바일 메모리 예산에 맞춘 보강입니다.

### 참고 문서
- [Common UI Plugin (공식)](https://dev.epicgames.com/documentation/en-us/unreal-engine/common-ui-plugin-for-advanced-user-interfaces-in-unreal-engine)
- [UCommonActivatableWidgetContainerBase API](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Plugins/CommonUI/UCommonActivatableWidgetContaine-)
- [FUserWidgetPool API](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Runtime/UMG/Blueprint/FUserWidgetPool)
- [Optimization Guidelines for UMG](https://dev.epicgames.com/documentation/en-us/unreal-engine/optimization-guidelines-for-umg-in-unreal-engine)
- [Lyra Cross-platform UI Development (Epic 강연)](https://dev.epicgames.com/community/learning/talks-and-demos/k88P/lyra-cross-platform-ui-development)
