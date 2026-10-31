---
layout: project
order: 4
title: "인게임 연출 시스템"
role: "Client Developer"
period: "2023 — 현재 (연출·렌더링 영역)"
summary: "별자리 · 순례 · 갓아머 등 인게임 연출을 PocketLevel과 LevelSequence로 구성하고, 연출 에셋 수명과 모바일 GPU 비용을 관리."
tags: ["PocketLevel", "LevelSequence", "SceneCapture", "RenderTarget", "MaterialParameter", "Niagara", "Mobile"]
images:
  - src: "/images/projects/rendering-cinema/constellation-preview.gif"
    alt: "별자리 전환 연출"
---

## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">연출 외 구간의 GPU 비용</p>
    <dl>
      <dt>문제</dt><dd>연출이 아닐 때도 캡처 렌더링 비용 발생</dd>
      <dt>해결</dt><dd>PocketLevel 진입·퇴장 시 연출 구간에만 켜고 끄도록 토글</dd>
      <dt>결과</dt><dd>연출 외 구간의 캡처 비용 제거</dd>
    </dl>
    <a class="case-more" href="#case-scenecapture">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">회전된 UI에서 파티클 배치 어긋남</p>
    <dl>
      <dt>문제</dt><dd>부모 위젯에 회전 · 스케일이 걸리면 UI 파티클의 위치 · 각도가 어긋남</dd>
      <dt>해결</dt><dd>누적 변환 행렬에서 <code>Atan2</code>로 회전각을 구하고, 스케일 → 회전 순서로 크기 · 위치를 재계산</dd>
      <dt>결과</dt><dd>회전 · 스케일된 UI 안에서도 파티클이 의도한 위치 · 방향으로 표시</dd>
    </dl>
    <a class="case-more" href="#case-uiparticle">자세히 ↓</a>
  </div>
</div>


## 개요

- 별자리 · 순례 · 갓아머 연출을 인게임과 분리된 공간(PocketLevel)에서 재생하고, 시퀀스 · 액터 · 캡처 자원은 연출 구간에만 쓰는 구조

<img class="diagram" src="/images/diagrams/cinema-pipeline.svg" alt="인게임 연출 파이프라인: 트리거 → PocketLevel Instance → LevelSequenceActor → SceneCapture2D→RenderTarget → UI 합성, 종료 시 Actor 파괴·캡처 off" />

## 구현 내용

- <strong>PocketLevel — 인게임과 분리된 연출 공간</strong>

  - PocketLevel Instance로 인게임과 격리된 별도 공간에서 `LevelSequence` 재생
  - <strong>진입 시 Stream In · 종료 시 Stream Out</strong>
    - 별자리 연출 진입 시 PocketLevel을 생성 · 스트리밍 인하고, 종료 시 스트리밍 아웃
    - 진입 후 PocketLevel 안의 카메라 · 룰렛 · 별자리 액터를 태그로 찾아 연결하고, 별자리는 `Order` 값으로 정렬
    - 카메라는 연출 카메라로 ViewTarget을 전환, 종료 시 이전 대상이 아닌 Pawn으로 되돌려 다른 연출과 겹칠 때의 카메라 꼬임 방지
  - <strong>시퀀스 좌표를 PocketLevel 원점에 맞춤</strong>
    - PocketLevel은 월드 어딘가에 생성되므로, 시퀀스 액터 위치와 `TransformOrigin`을 PocketLevel 경계 원점으로 덮어써 연출을 그 공간 안에서 재생
    - 별자리(`PocketLevel.Constellation`) · 순례(`PocketLevel.Pilgrimage`) 모두 GameplayTag로 인스턴스를 찾아 같은 방식 적용

    ```cpp
    // ConstellationUtil.cpp — CreateLevelSeqActor()
    if (UPocketLevelInstance* PocketLevelInstance =
            PocketLevelSubsystem->GetPocketLevelInstance(FGameplayTag::RequestGameplayTag(ConstellationLevelTag)))
    {
        const FVector Origin = PocketLevelInstance->GetBounds().Origin;
        RetActor->SetActorLocationAndRotation(Origin, FRotator::ZeroRotator);
        RetActor->bOverrideInstanceData = true;
        if (auto* InstanceData = Cast<UDefaultLevelSequenceInstanceData>(RetActor->DefaultInstanceData))
        {
            InstanceData->TransformOrigin = FTransform{ Origin };
        }
    }
    ```

- <strong>에셋 지연 로딩 & 수명 관리 — 진입 시 로드 · 종료 시 해제</strong>

  - <strong>필요 시점 로드</strong>
    - 연출 시퀀스를 `TSoftObjectPtr`로 보유, 사전 일괄 로드 대신 처음 재생할 때 로드해 시퀀스 액터 생성
  - <strong>시퀀스별 액터 캐시</strong>
    - `TMap<TSoftObjectPtr<ULevelSequence>, ALevelSequenceActor*>`로 이미 만든 시퀀스 액터는 재사용
    - 같은 그룹(예: 룰렛 열기 / 닫기)의 다른 시퀀스가 재생 중이면 먼저 멈추고 재생
  - <strong>종료 시 파괴 · 상태 원복</strong>
    - 연출 종료 시 캐시된 시퀀스 액터를 일괄 파괴해, 연출 후 자원이 남지 않도록 관리
    - 시퀀스는 끝난 상태를 유지(`ForceKeepState`)하도록 재생하므로, 파괴 전에 시작 프레임으로 되돌려 상태 잔존을 방지

    ```cpp
    // ConstellationUtil.cpp — DestroyLevelSeqActors()
    if (ULevelSequencePlayer* SeqPlayer = OutActor->GetSequencePlayer())
    {
        // 파괴 전 상태를 원복 (Keep state 사이드 이펙트 방지용)
        SeqPlayer->SetPlaybackPosition(FMovieSceneSequencePlaybackParams(
            SeqPlayer->GetStartTime().Time, EUpdatePositionMethod::Jump));
        SeqPlayer->Stop();
    }
    OutActor->Destroy();
    OutActor = nullptr;
    ```

  - <strong>순례 · 룰렛 액터</strong>
    - 순례 주사위 시퀀스 액터는 재생이 끝나는 시점에 파괴
    - 룰렛 슬롯 액터는 결과를 받을 때 생성하고, 닫기 · 포커스 연출이 끝나면 파괴

- <strong>별자리 룰렛 — LevelSequence 동적 생성/파괴</strong>

  - 별 · 결과별 시퀀스 런타임 생성 · 바인딩 → 종료 시 파괴 구조 (사전 일괄 로드 배제)
  - <strong>연출 단계별 시퀀스 분리</strong>
    - `ACineConstellationRoulette`가 활성 / 닫기 / 슬롯세팅 / 스핀 시퀀스와 별자리별 포커스 시퀀스를 `TSoftObjectPtr`로 보유
    - 단계가 끝나면 다음 단계를 이어서 재생 (닫기 → 해당 별자리 포커스 → 별자리 갱신)
    - 공통 생성 · 재생 · 파괴는 `FConstellationUtil`로 묶어 별자리 매니저와 룰렛이 함께 사용
  - <strong>결과 각도 역산 + 커브 이징 회전</strong>
    - 서버 결과 슬롯에서 목표 회전량(바퀴 수 × 360 + 슬롯 각도 + 현재 각도)을 먼저 계산
    - 여러 이징 커브 중 하나를 골라 0 → 1 진행도에 회전량을 곱해 회전
    - 커브가 1에 도달하면 목표 각도로 맞추고, `Fmod`로 각도를 0~360으로 정규화해 다음 회전의 시작 각도로 사용

    ```cpp
    // CineConstellationRoulette.cpp
    // 결과 수신 시: 목표 회전량 계산 + 커브 선택
    SpinRadius = RouletteSpinCount * RouletteRadius
               + (RouletteRadius / SlotNum) * (Result.SelectedSlotIndex + 1) + InitSpinnerAngle;
    CurveIndex = FMath::RandRange(0, RouletteSpinCurves.Num() - 1);

    // Tick: 커브 진행도만큼 회전
    float NewPitch = -RouletteSpinCurves[CurveIndex]->GetFloatValue(CurrentTime) * SpinRadius + InitSpinnerAngle;
    Spinner->SetActorRelativeRotation(FRotator(NewPitch, 0.f, 0.f));

    // 정지: 정확한 목표 각도로 맞추고 시작 각도를 정규화
    if (FMath::IsNearlyZero(RouletteSpinCurves[CurveIndex]->GetFloatValue(CurrentTime) - 1.f, 0.00001f))
    {
        double Pitch = -1.f * SpinRadius + InitSpinnerAngle;
        Spinner->SetActorRelativeRotation(FRotator(Pitch, 0.f, 0.f));
        InitSpinnerAngle = FMath::Fmod(Pitch, RouletteRadius);
    }
    ```

  - <strong>회전 중 점수 실시간 표시</strong>
    - 현재 각도에서 바늘 아래 슬롯 인덱스를 계산해, 슬롯이 바뀔 때마다 점수 텍스트와 High / Low 연출 갱신
  - <strong>시퀀스와 회전 동기화</strong>
    - 스핀 시퀀스의 이벤트에서 룰렛 Tick을 켜 회전 시작 시점을 연출에 맞춤
    - 스킵 시 스핀 시퀀스 재생 위치와 회전 시간을 같은 지점으로 이동
  - <strong>슬롯 동적 구성</strong>
    - 보유한 High 슬롯 수에 따라 각 슬롯의 `ChildActorComponent` 클래스 · 스케일을 바꿔 생성

<div id="case-scenecapture" class="case-anchor"></div>

- <strong>SceneCapture — 3D 연출을 RenderTarget에 캡처해 UI에 합성</strong>

  - 실제 3D 메시 굴림 → `SceneCapture2D`로 `RenderTarget` 캡처 → UI 위젯 합성
  - 캡처 카메라를 `LevelSequence` named binding에 주입, 연출이 카메라 직접 제어

    ```cpp
    // CinePilgrimageManager.cpp
    // 태그로 배치된 캡처 카메라를 찾아, LevelSequence의 named binding에 주입
    UGameplayStatics::GetAllActorsWithTag(World, RenderTargetCamTag, RenderCams);
    RenderTargetCam = RenderCams[0];
    LevelSeqActor->AddBinding(LevelSeqActor->FindNamedBinding(RenderTargetCamTag), RenderTargetCam);
    ```

  - <strong>연출이 아닐 때도 캡처 비용이 계속 드는 문제</strong>
    - SceneCapture2D는 켜져 있는 동안 매 프레임 씬을 한 번 더 렌더링
    - 연출이 시작될 때만 캡처를 켜고, 끝나면 끄도록 연출 구간에 맞춰 토글

    ```cpp
    // CinePilgrimageManager.cpp
    // 핵심 비용 최적화 — SceneCapture는 매 프레임 GPU를 먹으므로 "연출 중에만" 켭니다.
    if (RenderTargetCam && RenderTargetCam->GetComponentByClass<USceneCaptureComponent2D>())
        RenderTargetCam->GetComponentByClass<USceneCaptureComponent2D>()->SetVisibility(true);  // 연출 시작
    ...
        RenderTargetCam->GetComponentByClass<USceneCaptureComponent2D>()->SetVisibility(false); // 연출 종료
    ```

  - 동일 패턴을 `DialogueRenderer`에도 적용 (`SetVisibleInSceneCaptureOnly(true)` / 모바일 `WeightedBlendables` 비우기)

- <strong>머티리얼 기반 GPU 렌더링 — 미니맵 인디케이터</strong>

  - 퀘스트 위치 · 반경을 float16 텍스처(`PF_R16F`) 한 줄로 인코딩해 미니맵 머티리얼 파라미터로 주입 (CPU 위젯이 아닌 GPU 머티리얼에서 렌더링 처리)
  - 플레이어 위치 · 줌 배율은 Material Parameter Collection으로 실시간 반영
  - 퀘스트 영역은 별도 아이콘 위젯 없이 GPU 표시 처리 → 대상이 늘어도 위젯 수가 늘지 않음
  - MPC · 머티리얼 기반 미니맵 및 월드맵 설계 상세 → [실시간 위치 기반 맵 설계 페이지](/projects/mapdesign/)

<div id="case-uiparticle" class="case-anchor"></div>

- <strong>UI 파티클 — 부모 변환을 반영한 2D 회전 계산</strong>

  - 프로젝트에 도입된 UI 파티클 플러그인(Slate 기반)의 렌더 위치 계산부를 수정
  - <strong>부모 위젯에 회전 · 스케일이 걸린 화면에서 파티클의 위치와 각도가 어긋나는 문제</strong>
  - <strong>기존 코드의 원인</strong>
    - 회전각의 cos를 `A / √(B² + D²)`로 구해, X · Y 스케일이 다르면 값이 틀리고 1을 넘으면 sin 계산(`√(1 − cos²)`)이 NaN이 됨
    - 크기를 먼저 회전한 뒤 스케일을 곱해, 비균일 스케일에서 변환 순서가 어긋남
    - 파티클 위치(`CurPos`)에는 부모 회전이 적용되지 않아, 부모가 회전해도 방출 위치가 따라 돌지 않음
  - <strong>수정 내용</strong>
    - 부모까지 누적된 `RenderTransform`의 2×2 행렬 성분(A, B)에서 `Atan2(B, A)`로 회전각을 직접 계산
    - 파티클 크기 · 위치에 스케일을 먼저 곱한 뒤 2D 회전 행렬 `(x·cos − y·sin, y·cos + x·sin)` 적용
    - 회전된 위치에서 회전된 크기의 절반을 빼 중심 기준 위치로 보정
    - 자식 Geometry의 렌더 변환은 `FScale2D` · `FQuat2D(부모 회전 − 파티클 회전)`을 합성

    ```cpp
    // EasyParticleState.cpp — 렌더 위치 계산
    float A, B, C, D;
    RenderTransform.GetMatrix().GetMatrix(A, B, C, D);
    const float TotalAngle = FMath::Atan2(B, A);                 // 부모 누적 회전각
    const float Cosvalue = FMath::Cos(TotalAngle);
    const float Sinvalue = FMath::Sin(TotalAngle);

    FSlateRenderTransform Transform(::Concatenate(
        FScale2D(DirectionScale, VerticalDirectionScale),
        FQuat2D(TotalAngle - FMath::DegreesToRadians(CurRotation))));

    const FVector2D ScaledSize = FVector2D(CurSizeX, CurSizeY) * Scale2D;
    const FVector2D RotatedSize(ScaledSize.X * Cosvalue - ScaledSize.Y * Sinvalue,
                                ScaledSize.Y * Cosvalue + ScaledSize.X * Sinvalue);
    const FVector2D ScaledCurPos = CurPos * Scale2D;
    const FVector2D RotatedCurPos(ScaledCurPos.X * Cosvalue - ScaledCurPos.Y * Sinvalue,
                                  ScaledCurPos.Y * Cosvalue + ScaledCurPos.X * Sinvalue);

    const FVector2D AbsolutePosition = RotatedCurPos - RotatedSize / 2;   // 중심 기준
    const FVector2D FixPosition = AllottedGeometry.AbsoluteToLocal(AbsolutePosition + BasePos - WindowOffset);
    ```

  - <strong>레이아웃 대응</strong>
    - DesiredSize를 (100, 100)으로 고정하고 실제 배치 크기와의 비율(`LocalScale`)을 스케일에 반영
    - 앵커를 중앙 정렬로 변경해 레이아웃 안에 배치된 파티클도 크기 · 위치 유지
