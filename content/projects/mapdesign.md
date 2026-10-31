---
layout: project
order: 5
title: "실시간 위치 기반 맵 설계 — 미니맵 · 월드맵"
role: "Client Developer"
period: "2024 — 현재"
summary: "Material 기반 미니맵 동기화, InputProcessor 월드맵 확대·드래그, 영역 이미지 동적 로딩으로 텍스처 비용 절감."
tags: ["렌더링", "메모리 최적화", "런타임 아키텍처"]
images:
  - src: "/images/projects/mapdesign/mapdesign-preview.gif"
    alt: "맵 설계 동작 미리보기"
---

## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">Model-View구조로 UI와 데이터 분리</p>
    <dl>
      <dt>문제</dt><dd>던전 전용 맵을 추가하려면 같은 맵 View를 복제해야 하는 구조</dd>
      <dt>해결</dt><dd>View(<code>URegionMapWidget</code>)는 하나로 공유하고, 맵 종류별로 달라지는 데이터 소스 선택 · 목록 구성 · 상호작용 규칙만 Strategy(<code>UMapViewerStrategy</code>)로 분리</dd>
      <dt>결과</dt><dd>View 수정 없이 Strategy 추가만으로 던전맵 지원</dd>
    </dl>
    <a class="case-more" href="#case-dungeon">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">월드맵 텍스처 메모리 최적화</p>
    <dl>
      <dt>문제</dt><dd>월드맵 전체를 고해상도 한 장으로 올리면 모바일 메모리 예산 초과</dd>
      <dt>해결</dt><dd>필요한 영역만 동적 로딩 → 라이브에서 타일 단위로 고도화 R&D</dd>
      <dt>결과</dt><dd>화면에 필요한 텍스처만 메모리에 유지</dd>
    </dl>
    <a class="case-more" href="#case-worldmap-memory">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">CustomShader로 미니맵 QuestData 표시</p>
    <dl>
      <dt>문제</dt><dd>퀘스트영역에 따라 아이콘 위젯을 쓰면 대상이 늘수록 UI 비용 증가 및 재사용성 하락</dd>
      <dt>해결</dt><dd>Quest Data는 머티리얼에서 직접 표시</dd>
      <dt>결과</dt><dd>대상이 늘어도 위젯 비용이 늘지 않음</dd>
    </dl>
    <a class="case-more" href="#case-minimap-cost">자세히 ↓</a>
  </div>
</div>

## 개요

- <strong>미니맵</strong>과 <strong>월드맵</strong> 두 축으로, 실시간 위치 기반 맵 표시를 설계
- 미니맵은 머티리얼 중심으로 위치·퀘스트를 표현, 월드맵은 입력 처리·에셋 로딩을 중심으로 설계

<img class="diagram" src="/images/diagrams/mapdesign.svg" alt="맵 설계 관계도: PC Position→MPC→Minimap Material, Quest Data→Minimap Material, InputProcessor→World Map 확대/드래그, 고해상도 영역 이미지→(동적 로딩)→World Map" />

## 구현 내용

### 미니맵 위치 동기화 — MPC 기반

- PC 위치를 <strong>MPC</strong> (Material Parameter Collection) 를 통해 미니맵 머티리얼에 <strong>실시간 위치 parameter</strong>로 전송해 동기화
- 매 프레임 위젯 갱신 대신 머티리얼 파라미터로 위치를 반영 → 위치 표시를 GPU 측에서 처리
- <strong>월드 좌표 → 0~1 정규화 후 MPC 전송</strong>
  - 맵 원점을 빼고 월드 크기로 나눠 텍스처 UV 기준 좌표로 변환

  ```cpp
  // MiniMapWidget.cpp — UpdateActors()
  float X = (ActorLocation.X - MinimapMapData.MapOrigin.X) / MinimapMapData.WorldSize.X;
  float Y = (ActorLocation.Y - MinimapMapData.MapOrigin.Y) / MinimapMapData.WorldSize.Y;
  X = !FMath::IsFinite(X) ? 0.f : X;
  Y = !FMath::IsFinite(Y) ? 0.f : Y;

  if (UMaterialParameterCollectionInstance* Instance = GetWorld()->GetParameterCollectionInstance(MpcMiniMap))
  {
      Instance->SetScalarParameterValue("X", X);
      Instance->SetScalarParameterValue("Y", Y);
  }
  MinimapCursor->ImgCursor->SetRenderTransformAngle(ActorYaw);   // 캐릭터 방향
  MinimapCursor->SzbRadar->SetRenderTransformAngle(CameraYaw);   // 카메라 시야
  ```

- <strong>축척 · 줌 단계</strong>
  - Region별 미니맵 이미지의 텍스처 해상도 × 축척(`MapDimension`)으로 월드 크기를 계산
  - 줌 단계는 Region 데이터의 표시 거리 · 줌 간격으로 만들고, MPC `Zoom` 파라미터와 아이콘 크기에 함께 반영
- <strong>화면 밖 파티원 — 가장자리 고정 + 방향 화살표</strong>
  - 내 위치 → 파티원 방향을 `Atan2`로 각도화해 화살표를 회전

  ```cpp
  // MiniMapWidget.cpp — UpdatePcIcons()
  bool IsVisibleOnMap = AdjustedPos.X >= BoxMin.X && AdjustedPos.X <= BoxMax.X
                     && AdjustedPos.Y >= BoxMin.Y && AdjustedPos.Y <= BoxMax.Y;
  FVector2D ClampedPos(FMath::Clamp(AdjustedPos.X, BoxMin.X, BoxMax.X),
                       FMath::Clamp(AdjustedPos.Y, BoxMin.Y, BoxMax.Y));
  if (!IsVisibleOnMap)
  {
      FVector2D Dir = (ClampedPos - MyIndicatorSlot->GetPosition()).GetSafeNormal();
      PcData->Direction = FVector2D(Dir.X, -Dir.Y);
  }

  // MapPCIconWidget.cpp — 화면 밖일 때만 화살표 표시
  float Angle = FMath::RadiansToDegrees(FMath::Atan2(Data->Direction.X, Data->Direction.Y));
  BodArrow->SetRenderTransformAngle(Angle);
  ```
<div id="case-minimap-cost" class="case-anchor"></div>

### 미니맵 퀘스트 표시 — 머티리얼 직접 렌더

- <strong>퀘스트 위치를 아이콘 위젯으로 하나씩 표시하면, 표시 대상이 늘어날수록 위젯 비용도 함께 늘어나는 구조</strong>
- Quest Data를 미니맵 머티리얼에서 직접 표시해, 별도 아이콘 위젯 없이 영역을 제공하여 표시 대상이 늘어도 위젯 비용이 늘지 않는 구조
- <strong>퀘스트 좌표를 1줄짜리 R16F 텍스처로 인코딩</strong>
  - 퀘스트 종류별로 (X, Y, 반경)을 정규화해 float16 배열로 만들고, 임시 텍스처에 복사해 머티리얼에 전달

  ```cpp
  // MiniMapWidget.cpp — OnUpdateQuest()
  TArray<FFloat16> QuestTexData;
  for (const FMiniMapQuestData& Quest : QuestData)
  {
      QuestTexData.Add((Quest.X - MapOrigin.X) / WorldSize.X);
      QuestTexData.Add((Quest.Y - MapOrigin.Y) / WorldSize.Y);
      QuestTexData.Add(Quest.Radius / WorldSize.X);
  }
  QuestNum = QuestTexData.Num();
  QuestTex = UTexture2D::CreateTransient(QuestNum, 1, PF_R16F);

  FFloat16* TextureData = static_cast<FFloat16*>(QuestTex->GetPlatformData()->Mips[0].BulkData.Lock(LOCK_READ_WRITE));
  FMemory::Memcpy(TextureData, QuestTexData.GetData(), QuestNum * sizeof(FFloat16));
  QuestTex->GetPlatformData()->Mips[0].BulkData.Unlock();
  QuestTex->UpdateResource();

  Dmi->SetTextureParameterValue(QuestIndicatorTexName[Kind], QuestTex);
  Dmi->SetScalarParameterValue(QuestIndicatorNumName[Kind], QuestNum);
  ```

- <strong>기기 포맷 지원 확인</strong>
  - 기기가 `PF_R16F` 텍스처 샘플링을 지원하지 않으면 퀘스트 인디케이터를 표시하지 않도록 분기

### 월드맵 입력 — InputProcessor 확대/드래그

<img class="diagram" src="/images/diagrams/worldmap-input.svg" alt="월드맵 입력 흐름: FSlateApplication에 등록한 FSolWidgetInputProcessor가 터치 · 마우스를 판별해 OnZoom(핀치 거리 변화 · 휠), OnDrag(한 손가락 · 마우스 누름 이동), OnClick(이동 8 이하 · 핀치 아님)으로 전달하고, URegionMapWidget의 Zoom · Drag가 GetAdjustMapPos로 이동 범위를 Clamp한 뒤 SetAdjustMapPos가 Tick마다 RenderTranslation · Scale을 보간" />

- 모바일과 PC를 <strong>모두 대응</strong>하기 위해 <strong>InputProcessor 기반</strong>으로 설계
- 플랫폼별 입력 분기를 입력 처리 계층으로 일원화해 <strong>확대 · 드래그</strong> 조작 제공
- <strong>Slate 입력 전처리기로 등록</strong>
  - 위젯보다 먼저 터치 · 마우스 이벤트를 받아 줌 / 드래그 / 클릭 델리게이트로 변환
- <strong>핀치 줌 · 휠 줌의 OnZoom 공통 처리</strong>
  - 두 손가락 거리 변화량을 휠 Delta와 같은 단위로 넘겨, 줌 처리 코드를 하나로 유지

  ```cpp
  // SolWidgetInputProcessor.cpp — HandleMouseMoveEvent()
  if (TouchPositions.Contains(FingerIndex))
  {
      TouchPositions[FingerIndex] = TouchLocation;
      if (TouchPositions.Num() == 2)
      {
          TArray<FVector2D> TouchPoints;
          TouchPositions.GenerateValueArray(TouchPoints);
          const float CurrentDistance = FVector2D::Distance(TouchPoints[0], TouchPoints[1]);
          PinchDelta = CurrentDistance - PinchDistance;
          PinchDistance = CurrentDistance;
          if (CurrentDistance > 0) bIsPinching = true;
      }
  }
  if (bIsPinching)          OnZoom.ExecuteIfBound(PinchDelta * MouseWheelSpeed);
  else if (IsTouchStarted)  OnDrag.ExecuteIfBound(InPointerEvent);
  ```

- <strong>클릭과 드래그 · 핀치 구분</strong>
  - 누른 위치에서 일정 거리(8) 이상 움직였거나 핀치 중이었다면 클릭으로 처리하지 않음
- <strong>드래그 범위 제한 — 줌 · DPI 기준</strong>
  - 뷰포트 픽셀을 슬레이트 단위로 환산한 뒤, 현재 줌에서 맵이 화면 밖으로 넘친 만큼만 이동을 허용

  ```cpp
  // RegionMapWidget.cpp — GetAdjustMapPos()
  const float ViewportDPI = UWidgetLayoutLibrary::GetViewportScale(this);
  const FVector2D ViewportSlate = (ViewportDPI > 0.f) ? ViewportSize / ViewportDPI : ViewportSize;
  const FVector2D ScbScale(CurrentZoom * UIScale,
                           CurrentZoom * UIScale * ViewportSlate.X / ViewportSlate.Y);

  // 최대 이동량: Size * (Scale - 1) / (2 * Scale). Scale < 1이면 0
  const float CapableX = FMath::Max(0.f, LocalSize.X * (ScbScale.X - 1.f) / (2.f * ScbScale.X)) * DragLimitX;
  const float CapableY = FMath::Max(0.f, LocalSize.Y * (ScbScale.Y - 1.f) / (2.f * ScbScale.Y)) * DragLimitY;
  AdjustedPos.X = FMath::Clamp(AdjustedPos.X, OriginX - CapableX, OriginX + CapableX);
  AdjustedPos.Y = FMath::Clamp(AdjustedPos.Y, OriginY - CapableY, OriginY + CapableY);
  ```

- <strong>드래그 후 미끄러지듯 정지</strong>
  - 드래그는 즉시 이동하고, 입력 종류별 이동 속도로 계산한 목표 위치를 저장
  - 손을 뗀 뒤에는 Ticker에서 목표 위치 · 줌 배율로 보간해 자연스럽게 감속

<div id="case-worldmap-memory" class="case-anchor"></div>

### 월드맵 동적 로딩 — 영역 이미지 타일화

- <strong>월드맵 전체를 고해상도 한 장으로 상시 메모리에 올리면 모바일 메모리 예산을 넘는 문제</strong>
- 그리려는 영역만 <strong>고해상도 이미지로 동적 로딩</strong>
- 이를 타일 단위로 세분화해 확대 수준에 맞는 해상도의 타일만 불러오도록 고도화 (라이브 컨텐츠 고도화 참고)
- <strong>Region별 이미지를 Soft 참조로 보유</strong>
  - Region 에셋은 월드맵 · 미니맵 이미지를 `TSoftObjectPtr`로만 들고, 해당 Region을 열 때 로드

<div id="case-dungeon" class="case-anchor"></div>
