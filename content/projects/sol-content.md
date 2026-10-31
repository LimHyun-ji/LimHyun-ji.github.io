---
layout: project
order: 3
title: "인게임 컨텐츠 · 연출"
role: "Client Developer · Schema 설계·컨텐츠 구현 담당"
period: "2023 — 현재"
summary: "횡적 성장 컨텐츠의 클라이언트 · 서버 통신 및 연출 자원의 수명 관리."
tags: ["네트워크 동기화", "게임 수학", "렌더링"]
imageLayout: slider
images:
  - src: "/images/projects/sol-content/Screenshot_26.png"
  - src: "/images/projects/sol-content/Screenshot_27.png"
  - src: "/images/projects/sol-content/Screenshot_28.png"
---

## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">로그인 패킷 과부하</p>
    <dl>
      <dt>문제</dt><dd>로그인 시점에 받을 데이터가 많아 패킷 과부하</dd>
      <dt>해결</dt><dd>성장 컨텐츠는 진입 시점에 HTTP API로 지연 조회</dd>
      <dt>결과</dt><dd>로그인 패킷 부담 완화</dd>
    </dl>
    <a class="case-more" href="#case-login-packet">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">프레임 드랍 시 획득 연출 폭주</p>
    <dl>
      <dt>문제</dt><dd>Delta Time이 커지면 파티클이 판정 범위를 한 프레임에 지나쳐 목표 주위를 계속 회전</dd>
      <dt>해결</dt><dd>이동 선분 기준 획득 판정 + Delta를 0.03초 이하 스텝으로 나눠 갱신(스텝 수 상한)</dd>
      <dt>결과</dt><dd>한 프레임에 판정 반경을 지나쳐도 획득 처리, 긴 히칭에도 갱신 횟수가 무한히 늘지 않음</dd>
    </dl>
    <a class="case-more" href="#case-obtain">자세히 ↓</a>
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

- **길드 · 수집 · 순례 · 경제 · 채팅** 등 횡적 성장 컨텐츠를 기획 연동부터 UI · 서버 동기화까지 구현
- 컨텐츠 특성에 맞춰 **세 가지 네트워크 방식**을 구분 적용
  - **TCP** — 상시 동기화가 필요한 리텐션 리워드 · 데미지미터 · 세금 등
  - **WebSocket** — 채팅 실시간 송수신
  - **HTTP API** — 횡적 성장 컨텐츠를 진입 시점에 **지연 조회**해 로그인 패킷 과부하 방지
- **채팅 아이템 링크** — 시스템 메시지에 함께 온 아이템 데이터로 렌더 시점에 링크 마크업을 만들고, RichText Decorator로 파싱해 클릭 시 아이템 정보 표시

<div id="case-login-packet" class="case-anchor"></div>

**HTTP API를 따로 둔 이유는 로그인 패킷 과부하였습니다.** 횡적 성장 컨텐츠 데이터까지 로그인 시점에 함께 받으면 로그인 패킷이 무거워지기 때문에, 해당 컨텐츠에 진입하는 시점에 HTTP API로 지연 조회하도록 나눴습니다.

<img class="diagram" src="/images/diagrams/outgame-noti.svg" alt="게임 컨텐츠 Manager 패턴 시퀀스: 서버 NotifyEvt→UNetworkNotiClient→UGuildManager 상태 갱신→델리게이트 브로드캐스트→UI, UI 입력→Manager→서버 요청" />


## 구현 내용

<div id="case-obtain" class="case-anchor"></div>

### 경험치 획득 연출 — 궤적 · 시간 보정

<figure style="text-align:center"><img src="/images/projects/sol-content/exp-obtain-effect.gif" alt="경험치 획득 연출" /><figcaption style="font-size:11px;color:#888;margin-top:6px">경험치 획득 시 파티클이 플레이어 방향으로 가속 추격하는 연출</figcaption></figure>

- <strong>문제 — 프레임 드랍 시 판정 범위 통과</strong>
  - 경험치 파티클이 NPC 피격 위치에서 플레이어를 향해 날아가는 중, 프레임 드랍(히칭)으로 Delta Time이 비정상적으로 커지면 판정 범위를 한 프레임에 뛰어넘어 목표 주위를 계속 회전
- <strong>원인</strong>
  - 이동 후 위치가 목표 반경(`ObtainRange` 30cm) 안에 있는지만 보는 점 판정이라, 한 스텝 이동 거리가 반경보다 길면 목표를 지나침
  - 지나친 뒤에는 목표 방향으로 다시 꺾이며 주위를 맴돎
- <strong>해결 1 — 이동 선분 기준 획득 판정</strong>
  - 이번 스텝의 이동 선분과 목표 사이 거리(`PointDistToSegment`)가 반경 이내면 목표 위치로 붙여 획득 처리 → 한 프레임에 지나쳐도 놓치지 않음
  - 가속이 상한에 닿으면 랜덤 속도 성분을 0으로 만들어 목표로 직진, `LifeTime`을 넘기면 강제 종료하는 안전장치

    ```cpp
    // ObtainEffectObject.cpp — FSingleEffect::UpdateSingle
    FVector NewLocation = CurrentLocation + DesiredVelocity * DeltaTime;

    // 이동 경로가 획득 반경을 지나가면 목표 위치로 스냅 (이동 후 점 판정만으로는 놓칠 수 있음)
    float Distance = FMath::PointDistToSegment(TargetLocation, CurrentLocation, NewLocation);
    if (Distance <= ObtainRange)
    {
        NewLocation = TargetLocation;
    }
    ```

- <strong>해결 2 — Delta 분할 갱신 + 스텝 수 상한</strong>
  - 긴 프레임의 Delta를 `MaxDeltaTime`(0.03초) 이하 스텝으로 나눠 여러 번 갱신해, 한 번에 큰 시간 간격으로 적분하지 않음
  - 스텝 수를 `MaxSubSteps`(8)로 제한하고 남은 시간은 버림 → 긴 히칭에서 갱신 횟수가 늘어 프레임이 더 길어지는 따라잡기 루프 방지

    ```cpp
    // ObtainEffectObject.cpp
    void AObtainEffectObject::Tick(float DeltaSeconds)
    {
        Super::Tick(DeltaSeconds);

        int32 SubStep = 0;
        while (DeltaSeconds > KINDA_SMALL_NUMBER && SubStep < MaxSubSteps && !IsFinished)
        {
            const float StepTime = FMath::Min(DeltaSeconds, MaxDeltaTime);
            UpdateEffect(StepTime);
            DeltaSeconds -= StepTime;
            ++SubStep;
        }
    }
    ```

- <strong>궤적 설계 — 로컬 기저에서 확산 방향 생성</strong>
  - 발사 방향을 회전으로 바꾸고, 그 회전으로 Right · Up 축을 돌려 발사 방향에 수직인 기저를 구성
  - 두 축에 랜덤 가중치를 곱해 합성 → 발사 방향과 수직인 평면 위의 무작위 방향
  - 가속이 누적될수록 랜덤 성분이 줄어들어, 처음엔 퍼지고 점점 목표로 수렴하는 곡선 궤적
  - 피격자와 획득자의 거리에 반비례하는 `CurveDistanceInterpolator`를 곱해, 거리가 멀수록 초기 확산 반경을 크게 설정

    ```cpp
    // ObtainEffectObject.cpp — 발사 방향 기준 로컬 기저 + 거리 기반 곡선 보정
    const FRotator Rotation = Data.StartDirection.Rotation();
    const FVector RightVector = Rotation.RotateVector(FVector::RightVector);
    const FVector UpVector    = Rotation.RotateVector(FVector::UpVector);

    float X = 1 - FMath::Clamp(
        (Distance - Data.DistanceInterpolation.X) /
        (Data.DistanceInterpolation.Y - Data.DistanceInterpolation.X), 0.f, 1.f);
    float CurveDistanceInterpolator =
        FMath::Clamp(X * Data.DistanceInterpolation.Z, 1.f, Data.DistanceInterpolation.Z);

    const float RandY = FMath::RandRange(Data.MinRandomRange.Y, Data.MaxRandomRange.Y);
    const float RandZ = FMath::RandRange(Data.MinRandomRange.Z, Data.MaxRandomRange.Z);
    const FVector TargetDirection = (RightVector * RandY + UpVector * RandZ).GetSafeNormal();

    SingleEffect.RandomVelocity = TargetDirection * Data.CurveForce * CurveDistanceInterpolator;
    ```


### PocketLevel · 시퀀스 수명 관리

<figure style="text-align:center"><img src="/images/projects/rendering-cinema/constellation-preview.gif" alt="별자리 전환 연출 — PocketLevel 안에서 재생되는 별자리 LevelSequence" /><figcaption style="font-size:11px;color:#888;margin-top:6px">별자리 전환 연출 — PocketLevel에서 재생되는 LevelSequence</figcaption></figure>

- PocketLevel Instance로 인게임과 격리된 별도 공간에서 `LevelSequence` 재생
- <strong>진입 시 Stream In · 종료 시 Stream Out</strong>
  - 별자리 연출 진입 시 PocketLevel을 생성 · 스트리밍 인하고, 종료 시 스트리밍 아웃
  - 카메라는 연출 카메라로 ViewTarget을 전환, 종료 시 이전 대상이 아닌 Pawn으로 되돌려 다른 연출과 겹칠 때의 카메라 꼬임 방지
- <strong>PocketLevel 원점 기준 시퀀스 좌표 보정</strong>
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

- <strong>필요 시점 로드 · 시퀀스별 액터 캐시</strong>
  - 연출 시퀀스를 `TSoftObjectPtr`로 보유, 사전 일괄 로드 대신 처음 재생할 때 로드해 시퀀스 액터 생성
  - 시퀀스별 액터 맵으로 이미 만든 시퀀스 액터는 재사용
  - 같은 그룹(예: 룰렛 열기 / 닫기)의 다른 시퀀스가 재생 중이면 먼저 멈추고 재생
- <strong>종료 시 파괴 · 상태 원복</strong>
  - 연출 종료 시 캐시된 시퀀스 액터를 일괄 파괴해, 연출 후 자원이 남지 않도록 관리

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

<div id="case-uiparticle" class="case-anchor"></div>

### UI 파티클 — 부모 변환을 반영한 2D 회전 계산

- 프로젝트에 도입된 UI 파티클 플러그인(Slate 기반)의 렌더 위치 계산부를 수정
- <strong>부모 위젯에 회전 · 스케일이 걸린 화면에서 파티클의 위치와 각도가 어긋나는 문제</strong>
- <strong>기존 코드의 원인</strong>
  - 회전각의 cos를 `A / √(B² + D²)`로 구해, X · Y 스케일이 다르면 값이 틀리고 1을 넘으면 sin 계산(`√(1 − cos²)`)이 NaN이 됨
  - 크기를 먼저 회전한 뒤 스케일을 곱해, 비균일 스케일에서 변환 순서가 어긋남
  - 파티클 위치(`CurPos`)에는 부모 회전이 적용되지 않아, 부모가 회전해도 방출 위치가 따라 돌지 않음
- <strong>수정 내용</strong>
  - 파티클 크기 · 위치에 스케일을 먼저 곱한 뒤 2D 회전 행렬 `(x·cos − y·sin, y·cos + x·sin)` 적용
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
