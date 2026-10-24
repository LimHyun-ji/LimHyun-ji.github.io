---
layout: project
order: 4
title: "인게임 연출 시스템"
role: "Client Developer"
period: "2023 — 현재 (연출·렌더링 영역)"
summary: "별자리 · 순례 · 갓아머 등 인게임 연출을 PocketLevel과 LevelSequence로 구성하고, 연출 에셋 수명과 모바일 GPU 비용을 관리."
tags: ["PocketLevel", "LevelSequence", "SceneCapture", "RenderTarget", "MaterialParameter", "Niagara", "Mobile"]
highlights:
  - "별자리·순례 등 연출을 PocketLevel Instance로 인게임과 별도 공간에 구성하고 LevelSequence로 재생하는 비동기 연출 공간 제공"
  - "LevelSequence가 내려갈 때 안의 Actor도 모두 메모리에서 내려가도록 동적 제어 — 연출 액터를 진입 시 생성·종료 시 파괴하고 시퀀스는 SoftObjectPtr로 비동기 로드"
  - "3D 오브젝트를 SceneCapture2D로 RenderTarget에 캡처해 UI에 합성, 연출 구간에만 캡처를 Visible 토글해 모바일 GPU 비용 절감"
  - "갓아머 연출: TransformBonesComponent로 런타임 본 트랜스폼을 AnimBP와 연동하고 Niagara 잔상을 Deactivate로 정리"
---

> **목적** — 연출을 인게임과 분리된 공간에서 비동기로 띄우고, 연출 구간에만 자원(시퀀스 · 액터 · 캡처)을 쓰는 구조
>
> **성과** — PocketLevel·시퀀스·캡처 수명을 연출 구간에 한정해 모바일 GPU/메모리 비용↓
>
> **기여** — 별자리 룰렛 LevelSequence 동적 생성/파괴, 순례 주사위 SceneCapture 합성, 갓아머 연출 직접 설계


## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">연출 외 구간의 GPU 비용</p>
    <dl>
      <dt>문제</dt><dd>연출이 아닐 때도 캡처 렌더링 비용 발생</dd>
      <dt>해결</dt><dd>SceneCapture를 연출 구간에만 켜고 끄도록 토글</dd>
      <dt>결과</dt><dd>연출 외 구간의 캡처 비용 제거</dd>
    </dl>
    <a class="case-more" href="#case-scenecapture">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">갓아머 연출 후 Niagara 잔상</p>
    <dl>
      <dt>문제</dt><dd>연출이 끝난 뒤 Niagara 잔상이 남음</dd>
      <dt>해결</dt><dd>정리 방식을 <code>ReleaseToPool</code>에서 <code>Deactivate</code>로 교체</dd>
      <dt>결과</dt><dd>연출 종료 후 잔상 제거</dd>
    </dl>
    <a class="case-more" href="#case-niagara">자세히 ↓</a>
  </div>
</div>


<img class="diagram" src="/images/diagrams/cinema-pipeline.svg" alt="인게임 연출 파이프라인: 트리거 → PocketLevel Instance → LevelSequenceActor → SceneCapture2D→RenderTarget → UI 합성, 종료 시 Actor 파괴·캡처 off" />

## 0. PocketLevel — 인게임과 분리된 연출 공간

- PocketLevel Instance로 인게임과 격리된 별도 공간에서 `LevelSequence` 재생

## 1. 비동기 에셋 로딩 & 수명 관리 — 진입 시 로드 · 종료 시 해제

- **비동기 로드** — 연출 시퀀스·액터를 `TSoftObjectPtr`로 보유, 사전 일괄 로드 대신 필요 시점에 비동기 로드
- **수명 동적 제어** — `LevelSequence` 종료 시 내부 Actor 전체 메모리 해제 (연출 후 자원 잔존 없음)
- 진입 시 생성·로드 → 종료 시 파괴·해제로, 연출 에셋이 상시 메모리를 점유하지 않도록 관리

## 2. 별자리 룰렛 — LevelSequence 동적 생성/파괴

- 별·결과별 시퀀스 런타임 생성·바인딩 → 종료 시 파괴 구조 (사전 일괄 로드 배제)

```cpp
// Cinema/Constellation/CinemaConstellationManager.cpp
// 시퀀스 에셋 + 바인딩 맵으로 LevelSequenceActor를 런타임 생성
ALevelSequenceActor* UCinemaConstellationManager::CreateLevelSeqActor(
    UObject* Outer, const TSoftObjectPtr<ULevelSequence>& SequenceAsset, TMap<FName, AActor*> InBindingMap);
void UCinemaConstellationManager::DestroyLevelSeqActors(ALevelSequenceActor*& OutActor); // 연출 종료 시 파괴

// 이미 생성된 시퀀스는 맵에서 재사용, 없으면 생성
TMap<TSoftObjectPtr<ULevelSequence>, ALevelSequenceActor*> LevelSeqActorMap;
```

- `ACineConstellationRoulette` — 활성/닫기/슬롯세팅/스핀 시퀀스를 `TSoftObjectPtr`로 보유, 필요 시점 비동기 로드

```cpp
// Cinema/Constellation/CineConstellationRoulette.h
TSoftObjectPtr<ULevelSequence> ActiveRouletteSeq;
TSoftObjectPtr<ULevelSequence> SpinRouletteSeq;
TMap<int32, TSoftObjectPtr<ULevelSequence>> ConstellationFocusSeqMap; // 별별 포커스 연출
ALevelSequenceActor* PlaySequence(TSoftObjectPtr<ULevelSequence> LevelSequence, bool NeedLoop = false);
void DestroyLevelSeqActor(ALevelSequenceActor*& InActor);
```

## 3. SceneCapture — 3D 연출을 RenderTarget에 캡처해 UI에 합성

- 실제 3D 메시 굴림 → `SceneCapture2D`로 `RenderTarget` 캡처 → UI 위젯 합성
- 캡처 카메라를 `LevelSequence` named binding에 주입, 연출이 카메라 직접 제어

<div id="case-scenecapture" class="case-anchor"></div>

**연출이 아닐 때도 캡처 비용이 계속 드는 문제가 있었습니다.** SceneCapture2D는 켜져 있는 동안 매 프레임 씬을 한 번 더 렌더링하기 때문입니다. 그래서 연출이 시작될 때만 캡처를 켜고, 끝나면 끄도록 연출 구간에 맞춰 토글했습니다.

```cpp
// Cinema/Pilgrimage/CinePilgrimageManager.cpp
#include "Components/SceneCaptureComponent2D.h"
#include "Engine/SceneCapture2D.h"

// 태그로 배치된 캡처 카메라를 찾아, LevelSequence의 named binding에 주입
UGameplayStatics::GetAllActorsWithTag(World, RenderTargetCamTag, RenderCams);
RenderTargetCam = RenderCams[0];
LevelSeqActor->AddBinding(LevelSeqActor->FindNamedBinding(RenderTargetCamTag), RenderTargetCam);
```

```cpp
// 핵심 비용 최적화 — SceneCapture는 매 프레임 GPU를 먹으므로 "연출 중에만" 켭니다.
if (RenderTargetCam && RenderTargetCam->GetComponentByClass<USceneCaptureComponent2D>())
    RenderTargetCam->GetComponentByClass<USceneCaptureComponent2D>()->SetVisibility(true);  // 연출 시작
...
    RenderTargetCam->GetComponentByClass<USceneCaptureComponent2D>()->SetVisibility(false); // 연출 종료
```

- 동일 패턴을 `DialogueRenderer`에도 적용 (`SetVisibleInSceneCaptureOnly(true)` / 모바일 `WeightedBlendables` 비우기)

## 4. 머티리얼 기반 GPU 렌더링 — 미니맵 인디케이터

- 퀘스트·심볼 데이터를 RenderTarget 텍스처로 변환 → 미니맵 머티리얼 파라미터 주입 (CPU 위젯이 아닌 GPU 머티리얼에서 렌더링 처리)
- 플레이어 위치는 Material Parameter Collection으로 실시간 반영
- 별도 아이콘 위젯 없이 GPU 표시 처리 → 대상 증가에도 일정 비용
- MPC·머티리얼 기반 미니맵 및 월드맵 설계 상세 → [실시간 위치 기반 맵 설계 페이지](/projects/mapdesign/)

<div id="case-niagara" class="case-anchor"></div>

## 5. 갓아머 연출 — 런타임 본 트랜스폼 ↔ AnimBP

- `TransformBonesComponent` 신규 설계 — 런타임 본 트랜스폼 계산 ↔ AnimBP 연동
- 에디터 프리뷰 전용 `EditorTransformBonesComponent` 분리
- **연출이 끝난 뒤 Niagara 잔상이 남는 문제가 있었습니다.** `ReleaseToPool`로 반납할 때 이펙트가 제대로 정리되지 않았기 때문이라, 정리 방식을 `Deactivate`로 교체했습니다.

```
Source/Sol/Entity/Character/TransformBonesComponent.{h,cpp}      // 런타임
Source/SolEditor/VisualDataEditor/EditorTransformBonesComponent  // 에디터 프리뷰
```

## 기술 요약

| 영역 | 내용 |
|------|------|
| 시퀀서 | `ALevelSequenceActor` 런타임 생성/파괴 · named binding 주입 · `DefaultInstanceData` |
| 캡처 | `USceneCaptureComponent2D` → `RenderTarget` → UI 합성 · 연출 중에만 Visible |
| 로딩 | `TSoftObjectPtr<ULevelSequence>` 비동기 로드 (진입 전 미로드) |
| 스켈레탈 | `TransformBonesComponent` 런타임 본 트랜스폼 ↔ AnimBP |
| FX | Niagara `Deactivate`(잔상 정리) · 모바일 PostProcess off |
| 비용 | 모바일에서 SceneCapture/시퀀스 액터 수명을 연출 구간에 한정 |
