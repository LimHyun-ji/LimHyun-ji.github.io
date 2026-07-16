---
layout: project
order: 5
title: "실시간 위치 기반 맵 (미니맵 · 월드맵)"
role: "Client Developer"
period: "2023 — 현재"
summary: "플레이어 위치를 실시간으로 반영하는 미니맵과, 모바일·PC 입력을 함께 지원하는 월드맵을 설계. 위치 동기화는 MPC로, 표시는 머티리얼·텍스처 동적 로딩으로 비용을 낮춤."
tags: ["MiniMap", "WorldMap", "MPC", "InputProcessor", "Mobile", "Optimization"]
highlights:
  - "미니맵: PC 위치를 Material Parameter Collection(MPC)으로 머티리얼에 실시간 전송해 위치를 동기화"
  - "퀘스트 표시를 머티리얼에 직접 그려, 별도 아이콘 위젯 없이 영역을 표시하는 방식으로 최적화"
  - "월드맵: InputProcessor 기반으로 모바일 터치·PC 마우스휠 입력을 함께 지원하는 확대/드래그 설계"
  - "영역별 고해상도 맵 이미지를 SoftObjectPtr로 필요할 때만 로드해 텍스처 비용 절감"
---

> **목적** — 플레이어 위치를 실시간 반영하는 미니맵·월드맵을 낮은 비용으로 구현
> **성과** — MPC 위치 동기화, 아이콘 위젯 없는 머티리얼 표시, 모바일/PC 입력 통합, 영역 이미지 지연 로딩
> **기여** — 미니맵 MPC·퀘스트 머티리얼 표시, 월드맵 InputProcessor 확대/드래그 직접 설계

## 1. 미니맵 — 위치는 MPC로, 표시는 머티리얼로

미니맵은 매 프레임 위젯을 다시 그리는 대신, **플레이어 위치를 Material Parameter Collection(MPC)으로 머티리얼에 실시간 전송**해 GPU가 위치를 반영하게 했습니다. 위치 갱신이 CPU 위젯 로직이 아니라 머티리얼 파라미터 한 번의 세팅으로 끝납니다.

```cpp
// UI/MiniMap/MiniMapWidget.cpp — PC 위치·줌을 MPC로 머티리얼에 전송
if (UMaterialParameterCollectionInstance* Instance = GetWorld()->GetParameterCollectionInstance(MpcMiniMap))
{
    Instance->SetScalarParameterValue("X", X);
    Instance->SetScalarParameterValue("Y", Y);
    Instance->SetScalarParameterValue("Zoom", ZoomValue);
}
```

**퀘스트 표시를 머티리얼에 직접.** 퀘스트 영역을 아이콘 위젯으로 일일이 배치하지 않고, 퀘스트 데이터를 **머티리얼에 직접 그려** 별도 위젯 없이 영역을 표시했습니다. 표시할 대상이 늘어도 위젯 수가 늘지 않아 비용이 일정합니다.

```cpp
// UI/MiniMap/MiniMapWidget.h — 퀘스트 표시용 MPC · 종류별 텍스처 맵
UMaterialParameterCollection* QuestMiniMap;
TMap<EQuestKind, UTexture2D*> QuestTexMap;   // 퀘스트 종류별 인디케이터
```

## 2. 월드맵 — 모바일·PC 입력을 함께 지원하는 확대/드래그

월드맵은 손가락 터치(모바일)와 마우스휠·드래그(PC)를 **하나의 조작 체계로 통합**해야 했습니다. 그래서 위젯 개별 이벤트에 기대지 않고, Slate 입력 전처리기(`FSolWidgetInputProcessor`)를 등록해 확대·드래그·핀치를 일괄 처리했습니다.

```cpp
// UI/WorldMap/RegionMapWidget.cpp — InputProcessor 등록 후 줌/드래그 델리게이트 바인딩
InputProcessor = MakeShared<FSolWidgetInputProcessor>();
FSlateApplication::Get().RegisterInputPreProcessor(InputProcessor);
// 플랫폼별 줌 속도 — 터치 핀치 vs 마우스휠
InputProcessor->SetZoomSpeed(bTouch ? TouchZoomSpeed : MouseWheelSpeed);
InputProcessor->OnZoom.BindUObject(this, &URegionMapWidget::Zoom);
InputProcessor->OnDrag.BindUObject(this, &URegionMapWidget::Drag);
```

- **핀치/휠 통합** — 터치 핀치와 마우스휠을 같은 `OnZoom`으로 받아 `MinZoom~MaxZoom` 범위로 확대/축소
- **드래그 경계 처리** — 현재 줌 배율에 맞춰 이동 가능 범위를 계산해, 확대된 만큼만 드래그되고 지도 밖으로 넘어가지 않도록 제한
- **자연스러운 관성** — 드래그 후 슬라이드가 이어지도록 상호작용 상태(`IsInteracting`/`IsPinching`)를 구분해 처리

## 3. 영역 이미지 동적 로딩

월드맵은 영역이 많고 각 이미지가 큽니다. 모든 영역 텍스처를 항상 메모리에 올리면 낭비이므로, **영역별 맵 이미지를 SoftObjectPtr로 들고 있다가 해당 영역을 볼 때만 로드**했습니다.

```cpp
// UI/WorldMap/RegionMapWidget.cpp — 현재 영역 이미지를 필요 시점에 로드
UTexture2D* MapTexture = CurrentStrategy->GetMapSource(*RegionAsset).Image.LoadSynchronous();
CurrentStrategy->ApplyMapTexture(WisMapViewer->GetActiveWidget(), MapTexture);
```
영역 종류에 따라 소스를 고르는 부분은 Strategy로 분리해, 표시 로직은 그대로 두고 영역별 데이터만 갈아끼우도록 했습니다.

## 기술 요약

| 영역 | 내용 |
|------|------|
| 미니맵 위치 | `UMaterialParameterCollection`(MPC) → `SetScalarParameterValue(X/Y/Zoom)` |
| 미니맵 퀘스트 | 머티리얼 직접 표시 · `TMap<EQuestKind, UTexture2D*>` 종류별 텍스처 |
| 월드맵 입력 | `FSolWidgetInputProcessor` (Slate InputPreProcessor) · 터치/마우스 통합 |
| 월드맵 줌/드래그 | `OnZoom`/`OnDrag`/`IsPinching` · MinZoom~MaxZoom · 줌 배율 기반 드래그 경계 |
| 이미지 로딩 | 영역별 `TSoftObjectPtr<UTexture2D>` 지연 로드 · Strategy로 소스 분리 |

## 맵 표시 흐름

<div class="mermaid">
flowchart LR
  POS["플레이어 위치"] --> MPC["MPC SetScalar(X/Y/Zoom)"]
  MPC --> MAT["미니맵 머티리얼<br/>(위치·퀘스트 GPU 표시)"]
  IN["터치 · 마우스휠"] --> IP["FSolWidgetInputProcessor"]
  IP --> ZD["Zoom / Drag (경계 제한)"]
  ZD --> IMG["영역 이미지 SoftObjectPtr 로드"]
  IMG --> VIEW["월드맵 표시"]
</div>
