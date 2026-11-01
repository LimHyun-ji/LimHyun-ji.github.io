// 포트폴리오 PDF 슬라이드 데이터 — 웹사이트 상세 페이지 내용을 근거로 작성 (새 사실을 추가하지 않음)
// 각 사례: 문제 → 원인 → 판단 · 해결 → 결과 + 시각 자료(다이어그램 · 코드 · 영상 장면)
export const SITE = 'https://limhyun-ji.github.io';
const P = (slug, anchor) => `${SITE}/projects/${slug}/${anchor ? '#' + encodeURIComponent(anchor) : ''}`;

export const SLIDES = {
  hit: {
    title: '피격 연출 타이밍 — 속도 커브 역산',
    tags: ['게임 수학', '네트워크 동기화'],
    thesis: '판정은 서버가 확정한다. 클라이언트는 판정을 바꾸지 않고 "언제 보여줄지"만 계산한다.',
    url: P('combat', 'case-hit-delay'),
    problem: '관통 · 확산 스킬도 Hit Notify 한 번에 대상 전원이 같은 프레임에 맞아, 투사체가 지나가는 느낌이 없었음',
    cause: '첫 지연 계산은 진행 방향 투영 + 등속 가정. 실제 이펙트(Moving 파티클)는 속도 커브로 가감속해 표시 시점이 어긋남',
    solution: [
      '대상까지의 거리 비율 <b>r = d(start, target) / L</b>을 구하고, 속도 커브의 누적 이동 비율 <b>S(t/T)</b>가 처음 r에 도달하는 시각을 찾음',
      '커브가 단조 증가라는 보장이 없어 이분 탐색 대신 <b>1/60초 선형 탐색</b>으로 "처음 도달" 시각을 보장',
      '공격 속도(PlayRate)를 Duration에 반영하고 파티클 이동에도 같은 배율 적용 → 두 시간축을 일치',
      '계산을 <code>UActionNotify_Hit</code>에 두어 게임과 툴이 같은 함수를 사용',
    ],
    result: '이펙트가 닿는 순간에 피격 연출 표시 · 툴에서 본 타이밍 = 게임 타이밍',
    formula: 't* = min { t | S(t / T) ≥ r },  T = Duration / PlayRate',
    visual: { type: 'code', file: '피격 타이밍 역산', code: `// 속도 커브에서 "타깃까지 이동 비율 r"에 처음 도달하는 시각 t*를 역산
const float Duration = PathDuration / PlayRate;                          // 공격 속도 반영
const float r = FMath::Min(FVector::Dist2D(Start, Target) / FVector::Dist2D(Start, End), 1.0);

for (float t = 0.f; t < Duration; t += 1.f / 60.f)                       // 60fps 간격 샘플링
    if (EvaluateSpeedCurve(SpeedCurve, t / Duration) >= r) return t;     // t* = min{ t | S(t / T) ≥ r }
return Duration;` },
    frames: 'combat-preview',
  },

  sync: {
    title: '전투 서버 동기화 — Notify 시점 처리',
    tags: ['네트워크 동기화', '애니메이션'],
    thesis: '패킷이 도착한 순간이 아니라 몽타주 Notify 시점에 연출을 처리해 서버 · 클라이언트 순서를 맞춘다.',
    url: P('combat', '전투-서버-동기화-actionnotify-begin-시점-처리'),
    problem: 'ActionEvt 수신 시점에 바로 연출을 처리하면 클라이언트 몽타주 타이밍과 어긋남',
    cause: '패킷 도착 시각은 네트워크 상황에 따라 흔들리지만, 애니메이션의 기준 시각은 몽타주 Notify',
    solution: [
      '연출 처리 시점을 <b>ActionNotify Begin</b>으로 이동',
      '서버와 클라이언트가 같은 <b>Export ActionData</b>(몽타주 Notify 데이터)로 시점을 계산',
      '게임 시간은 서버 시각보다 <b>약 200ms 늦게</b> 재생해 패킷 도착 여유를 두고, Notify 처리는 그 위에서 순서를 보장',
      'Immediate / Lazy Hit 분기 → StatusEffect → AttackEndEvt 흐름으로 정리',
    ],
    result: '서버가 확정한 판정은 그대로 두고 연출 순서 · 타이밍만 일치',
    visual: { type: 'diagram', src: 'combat-sync.svg' },
  },

  notify: {
    title: 'Action Table · Notify — 인게임 / 에디터 경로 통일',
    tags: ['애니메이션', '런타임 아키텍처'],
    thesis: '에디터 프리뷰도 인게임과 같은 재생 경로를 타게 하되, 인게임 코드는 에디터에 의존하지 않게 한다.',
    url: P('combat', 'case-notify'),
    problem: '에디터에서 재생한 ActionNotify가 인게임과 다르게 동작하고, 인게임 로직이 에디터 코드에 의존할 위험',
    cause: '재생 경로가 둘로 갈라져 같은 데이터라도 실행되는 코드가 달랐음',
    solution: [
      'Entity 타입별 액션 → 몽타주를 <b>Action Table</b> 데이터로 정의 → 액션 추가는 코드 수정 없이 데이터로',
      'Notify 재생을 <b>Simulator 객체(Has-A)</b>에 위임 → 에디터도 인게임과 같은 경로로 실행',
      '처리부만 <code>Notify_Game</code> / <code>Notify_Editor</code>로 분리 → 의존 방향을 한쪽으로 고정',
    ],
    result: '서버 유무와 관계없이 같은 몽타주 · Notify 동작, 인게임 모듈은 에디터 코드와 독립',
    visual: { type: 'diagram', src: 'visualdata-action.svg' },
  },

  obtain: {
    title: '획득 연출 — 큰 Delta에서도 안정적인 시간 적분',
    tags: ['게임 수학'],
    thesis: '"지나쳐도 잡고, 무한히 따라잡지 않는다" — 판정과 적분을 프레임 길이에 독립적으로.',
    url: P('sol-content', 'case-obtain'),
    problem: '히칭으로 Delta Time이 커지면 경험치 파티클이 판정 반경(30cm)을 한 프레임에 지나쳐 목표 주위를 계속 회전',
    cause: '이동 후 위치만 보는 점 판정 → 한 스텝 이동 거리가 반경보다 길면 놓치고, 지나친 뒤 다시 꺾이며 맴돎',
    solution: [
      '<b>이동 선분 기준 판정</b>: 이번 스텝의 선분과 목표 사이 거리 <code>PointDistToSegment</code> ≤ 반경이면 목표로 스냅',
      '<b>Delta 분할</b>: <code>MaxDeltaTime</code>(0.03초) 이하 스텝으로 나눠 적분 → 한 번에 큰 시간 간격을 쓰지 않음',
      '<b>스텝 상한</b> <code>MaxSubSteps</code>(8), 남은 시간은 버림 → 갱신이 늘어 프레임이 더 길어지는 따라잡기 루프 방지',
      '안전장치: 가속 상한 도달 시 랜덤 성분 제거 · <code>LifeTime</code> 초과 시 종료',
    ],
    result: '판정 반경을 한 프레임에 지나쳐도 획득 처리, 긴 히칭에도 갱신 횟수는 상한 안',
    formula: 'dist( P_target , segment(P_t , P_t+Δt) ) ≤ r  ⇒  snap',
    visual: { type: 'code', file: '서브스텝 적분 + 선분 판정', code: `// 큰 DeltaTime을 MaxDeltaTime 단위로 나눠 적분 — 프레임 드랍에도 궤적이 튀지 않게
for (int32 Step = 0; DeltaSeconds > KINDA_SMALL_NUMBER && Step < MaxSubSteps && !bFinished; ++Step)
{
    const float Dt = FMath::Min(DeltaSeconds, MaxDeltaTime);
    UpdateEffect(Dt);
    DeltaSeconds -= Dt;                                // 상한 (MaxSubSteps)으로 최악 비용 제한
}

// 이동 구간 (선분)과 목표의 최단 거리로 도착 판정 — 끝점만 보면 고속에서 반경을 건너뜀
FVector Next = Cur + Velocity * DeltaTime;
if (FMath::PointDistToSegment(Target, Cur, Next) <= ObtainRange)
    Next = Target;                                     // 목표로 스냅` },
    frames: 'exp-obtain-effect',
  },

  traj: {
    title: '획득 연출 궤적 — 로컬 기저 확산 · 거리 기반 곡률',
    tags: ['게임 수학'],
    thesis: '발사 방향에 수직인 평면에서 확산을 만들고, 거리에 따라 곡률을 보정해 "퍼졌다가 모이는" 궤적을 만든다.',
    url: P('sol-content', '경험치-획득-연출-궤적-시간-보정'),
    labels: ['목표', '설계 포인트'],
    problem: '경험치 파티클이 처음엔 퍼졌다가 플레이어에게 모이는 곡선으로 날아가고, 대상과의 거리가 달라도 비슷한 비율의 곡선을 그려야 함',
    cause: '확산 방향이 발사 방향과 겹치면 퍼지지 않으므로, 발사 방향에 수직인 평면 위에서 방향을 골라야 함',
    solution: [
      '발사 방향을 회전으로 바꾸고 그 회전으로 Right · Up 축을 돌려 <b>발사 방향에 수직인 기저</b> 구성',
      '두 축에 랜덤 가중치를 곱해 합성 → 수직 평면 위의 무작위 확산 방향',
      '가속이 누적될수록 랜덤 성분이 줄어 처음엔 퍼지고 점점 목표로 수렴',
      '피격자 · 획득자 거리에 따른 보간값 <code>CurveDistanceInterpolator</code>로 먼 대상일수록 초기 확산을 크게',
    ],
    result: '거리와 무관하게 비슷한 비율의 곡선 궤적, 발사 방향과 겹치지 않는 확산',
    formula: 'dir = normalize( R·a + U·b ),  R, U ⟂ forward',
    visual: { type: 'code', file: '로컬 기저 + 거리 보정', code: `// 발사 방향 기준 로컬 기저 — 캐릭터가 어느 쪽을 보든 같은 모양의 곡선
const FRotator Basis = StartDirection.Rotation();
const FVector Right = Basis.RotateVector(FVector::RightVector);
const FVector Up    = Basis.RotateVector(FVector::UpVector);

// 거리 보정 — (Near, Far)를 0~1로 정규화해 가까울수록 곡선 힘 증가 (1 ~ MaxBoost)
const float Closeness = 1.f - FMath::Clamp((Distance - Near) / (Far - Near), 0.f, 1.f);
const float Boost = FMath::Clamp(Closeness * MaxBoost, 1.f, MaxBoost);

// 로컬 Right · Up 평면의 랜덤 방향 → 이펙트마다 다른 궤적
CurveVelocity = (Right * RandY + Up * RandZ).GetSafeNormal() * CurveForce * Boost;` },
  },

  uiparticle: {
    title: 'UI 파티클 — 누적 변환에서 회전각 복원',
    tags: ['게임 수학', '렌더링'],
    thesis: '2×2 변환 행렬에서 각도를 정확히 다시 구하고, 스케일 → 회전 순서를 바로잡는다.',
    url: P('sol-content', 'case-uiparticle'),
    problem: '부모 위젯에 회전 · 스케일이 걸린 화면에서 UI 파티클(플러그인)의 위치와 각도가 어긋남',
    cause: 'cos를 A / √(B² + D²)로 계산 → 비균일 스케일에서 틀리고, 1을 넘으면 sin = √(1 − cos²)가 NaN. 회전 후 스케일을 곱해 순서가 뒤바뀌었고, 방출 위치(CurPos)에는 부모 회전이 빠져 있었음',
    solution: [
      '회전각을 <b>θ = atan2(B, A)</b>로 복원 → 스케일 크기와 무관하게 정확',
      '크기 · 위치 모두 <b>스케일을 먼저</b> 곱한 뒤 2D 회전 행렬 적용',
      '자식 Geometry 렌더 변환은 <code>FScale2D</code> · <code>FQuat2D(θ부모 − θ파티클)</code>을 합성',
    ],
    result: '회전 · 스케일된 UI 안에서도 파티클이 의도한 위치 · 방향으로 표시',
    formula: "p' = R(θ) · (S · p),  R(θ) = [cos θ  −sin θ ; sin θ  cos θ]",
    visual: { type: 'code', file: 'UI 파티클 회전 복원', code: `// 렌더 행렬 [A B; C D]에서 부모 누적 회전 복원 — θ = atan2(B, A)
float A, B, C, D;
RenderTransform.GetMatrix().GetMatrix(A, B, C, D);
const float Theta = FMath::Atan2(B, A);
const float c = FMath::Cos(Theta), s = FMath::Sin(Theta);
auto Rotate = [c, s](const FVector2D& V) { return FVector2D(V.X * c - V.Y * s, V.Y * c + V.X * s); };

// 스케일 → 회전 순으로 변환, 중심 기준으로 맞춘 뒤 위젯 로컬 좌표로
const FVector2D Size = Rotate(ParticleSize * Scale);
const FVector2D Pos  = Geometry.AbsoluteToLocal(Rotate(ParticlePos * Scale) - Size / 2 + BasePos);` },
  },

  ray: {
    title: '폴리곤 편집 — 광선 · 선분 3D 교차',
    tags: ['게임 수학', '엔진 툴 확장'],
    thesis: '화면 클릭을 월드 광선으로 바꾸고, 폴리곤의 각 변과의 교차를 벡터 연산으로 직접 푼다.',
    url: P('areatool', 'case-polygon-edit'),
    problem: '꼭짓점 추가가 "선택한 점을 Alt + 드래그로 복제"라 원하는 변 위치에 넣기 어렵고, 회전된 영역에서는 드래그 방향과 점 이동이 어긋남',
    cause: '편집 입력이 화면 좌표 · 로컬 좌표 · 월드 좌표를 구분하지 않고 처리',
    solution: [
      '<code>DeprojectFVector2D</code>로 클릭 → 광선 (O, d), 각 변은 월드 변환 후 e = Q − P',
      '<b>n = d × e = 0</b>이면 평행 → 제외 · <b>(P − O) · n ≈ 0</b>이면 동일 평면 (허용 오차는 툴 설정)',
      '교차 매개변수 <b>t, s ∈ [0, 1]</b>이면 실제 교차 → 교차점 O + t·d를 로컬화해 다음 인덱스에 삽입, <code>Modify()</code>로 Undo',
      '드래그 이동량은 액터 회전의 역(<code>Quat.GetInverse()</code>)으로 돌려 로컬 공간에 반영',
    ],
    result: '클릭한 변 위에 바로 꼭짓점 추가, 회전된 영역에서도 드래그 방향대로 편집',
    formula: 't = ((w × e) · n) / |n|²,  s = ((w × d) · n) / |n|²,  w = P − O',
    visual: { type: 'code', file: '광선-선분 교차', code: `// 클릭 광선 (O, D)과 폴리곤 각 변 (P, E)의 교차 → 맞은 변 뒤에 꼭짓점 삽입
View->DeprojectFVector2D(ClickPos, O, D);
for (int32 i = 0; i < Num; ++i)
{
    const FVector P = T.TransformPosition(Pts[i]);
    const FVector E = T.TransformPosition(Pts[(i + 1) % Num]) - P;
    const FVector N = D ^ E;                                    // 외적
    if (N.IsNearlyZero()) continue;                             // 평행
    const FVector W = P - O;
    if (!FMath::IsNearlyZero(W.GetSafeNormal() | N.GetSafeNormal())) continue;   // 동일 평면 아님
    const float t = ((W ^ E) | N) / N.SizeSquared();            // 광선 매개변수
    const float s = ((W ^ D) | N) / N.SizeSquared();            // 변 매개변수
    if (InRange01(t) && InRange01(s))
    {
        Pts.Insert(T.InverseTransformPosition(O + t * D), i + 1);   // 로컬 좌표로 삽입
        break;
    }
}` },
  },

  centroid: {
    title: '스폰 프리뷰 기준점 — 면적 가중 무게중심',
    tags: ['게임 수학', '엔진 툴 확장'],
    thesis: '꼭짓점 평균이 아니라 Shoelace 공식으로 면적을 반영한 중심을 쓴다.',
    url: P('areatool', '저작-ux-2d-polygon-3d-point-actor'),
    problem: '스폰 그룹 프리뷰 메시를 Territory 중앙에 두어야 하는데, 꼭짓점이 한쪽에 몰린 다각형에서는 평균점이 영역 밖으로 치우침',
    cause: '꼭짓점 평균은 점의 분포만 보고 면적 분포를 반영하지 않음 (오목 다각형에서 특히 어긋남)',
    solution: [
      '각 변의 외적(부호 있는 면적 × 2)을 누적해 <b>부호 있는 면적 A</b>를 구함',
      '변마다 (xᵢ + xᵢ₊₁) · cross 를 누적해 <b>면적 가중 중심</b> 계산 → 6A로 나눔',
      'NPC · FieldObject 스폰 그룹 프리뷰 위치와 Territory 디버그 표시 위치에 공통 사용',
    ],
    result: '오목 · 비대칭 다각형에서도 영역의 실제 중심에 프리뷰 배치',
    formula: 'A = ½ Σ (xᵢ yᵢ₊₁ − xᵢ₊₁ yᵢ),   Cx = (1/6A) Σ (xᵢ + xᵢ₊₁)(xᵢ yᵢ₊₁ − xᵢ₊₁ yᵢ)',
    visual: { type: 'code', file: 'Shoelace 무게중심', code: `// Shoelace — 부호 있는 면적 A와 면적 가중 무게중심 C
float A = 0.f;
FVector2D C = FVector2D::ZeroVector;
for (int32 i = 0; i < Num; ++i)
{
    const FVector2D P(Pts[i]), Q(Pts[(i + 1) % Num]);
    const float Cross = FVector2D::CrossProduct(P, Q);     // 변이 만드는 부호 있는 면적 × 2
    A += Cross;
    C += (P + Q) * Cross;
}
return C / (6.f * (A * 0.5f));` },
  },

  minimap: {
    title: '미니맵 위치 동기화 — 좌표계 변환 · MPC',
    tags: ['게임 수학', '렌더링'],
    thesis: '위치 표시를 위젯 갱신이 아니라 머티리얼 파라미터로 처리한다. 핵심은 월드 → UV 좌표 변환.',
    url: P('mapdesign', '미니맵-위치-동기화-mpc-기반'),
    problem: '매 프레임 위젯 위치를 갱신하는 방식은 표시 대상이 늘수록 UI 비용이 커짐',
    cause: '위치 표시가 CPU 쪽 위젯 레이아웃에 묶여 있었음',
    solution: [
      '월드 좌표에서 맵 원점을 빼고 월드 크기로 나눠 <b>[0, 1] UV 좌표</b>로 정규화, <code>IsFinite</code>로 NaN 방어',
      '<b>MPC</b>(Material Parameter Collection)로 전송 → 미니맵 머티리얼이 GPU에서 위치 표시',
      '월드 크기 = 텍스처 해상도 × 축척(<code>MapDimension</code>), 줌 단계는 MPC <code>Zoom</code>과 아이콘 크기에 함께 반영',
      '화면 밖 파티원: 박스 경계로 Clamp + 방향 벡터를 <b>atan2</b>로 각도화해 화살표 회전',
    ],
    result: '위치 갱신이 위젯 레이아웃 비용에서 분리, 화면 밖 대상도 방향으로 표시',
    formula: 'uv = (P − Origin) / WorldSize,   angle = atan2(dir.x, dir.y)',
    visual: { type: 'code', file: '미니맵 좌표 변환', code: `// 월드 좌표 → 맵 정규화 좌표 (0~1) → MPC로 머티리얼에 전달
const float U = (PlayerLocation.X - Map.Origin.X) / Map.WorldSize.X;
const float V = (PlayerLocation.Y - Map.Origin.Y) / Map.WorldSize.Y;
Mpc->SetScalarParameterValue("X", FMath::IsFinite(U) ? U : 0.f);    // WorldSize 0 방어
Mpc->SetScalarParameterValue("Y", FMath::IsFinite(V) ? V : 0.f);

// 박스 밖 파티원 — 경계로 Clamp, UI 좌표계 (Y 아래)에 맞춰 반전 후 atan2로 화살표 각도
const FVector2D Clamped(FMath::Clamp(Pos.X, BoxMin.X, BoxMax.X),
                        FMath::Clamp(Pos.Y, BoxMin.Y, BoxMax.Y));
if (Clamped != Pos)
{
    const FVector2D Dir = (Clamped - MyIconPos).GetSafeNormal();
    Arrow->SetRenderTransformAngle(FMath::RadiansToDegrees(FMath::Atan2(Dir.X, -Dir.Y)));
}` },
    frames: 'mapdesign-preview',
  },

  dragclamp: {
    title: '월드맵 입력 — Slate 전처리기 · 이동 범위 수식',
    tags: ['게임 수학', '런타임 아키텍처'],
    thesis: '모바일 · PC 입력을 Slate 전처리기 한 곳에서 해석하고, 줌 · DPI 기준으로 이동 범위를 수식으로 제한한다.',
    url: P('mapdesign', '월드맵-입력-inputprocessor-확대드래그'),
    labels: ['목표', '설계 포인트'],
    problem: '모바일(핀치 · 드래그)과 PC(휠 · 드래그)에서 같은 확대 · 이동 조작을 제공',
    cause: '입력 해석을 한 계층으로 모으고, 확대 배율 · DPI가 달라도 맵이 화면 밖으로 빠지지 않는 이동 한계가 필요',
    solution: [
      '<code>FWidgetInputProcessor</code>를 Slate 전처리기로 등록 → 위젯보다 먼저 받아 Zoom / Drag / Click으로 변환',
      '두 손가락 거리 변화를 휠 Delta와 같은 단위로 환산 → <b>OnZoom 하나</b>로 처리',
      '이동 8 이상 또는 핀치 중이었으면 클릭으로 처리하지 않음',
      '뷰포트 픽셀을 Slate 단위로 환산 후 <b>최대 이동량 = Size·(S − 1) / (2S)</b> (S < 1이면 0)로 Clamp, 놓은 뒤 Ticker에서 보간 감속',
    ],
    result: '플랫폼과 무관하게 같은 확대 · 이동 동작, 어떤 배율에서도 맵이 화면 밖으로 빠지지 않음',
    formula: 'Capable = max(0, Size · (S − 1) / (2S)),   S = Zoom · UIScale',
    visual: { type: 'diagram', src: 'worldmap-input.svg' },
  },

  vdmodule: {
    title: '외형 시스템 — 데이터 주도 모듈과 수명 일원화',
    tags: ['런타임 아키텍처', '메모리 최적화'],
    thesis: '외형을 하드코딩하지 않고 데이터로 모듈을 만들며, 데이터 수명은 한 곳에서만 관리한다.',
    url: P('visualdata', 'case-allocating'),
    problem: '여러 객체가 VisualData를 각자 참조해 생성 · 해제 시점이 흩어짐. 모듈이 UObject라 Entity가 많은 장면에서 UObject 최대 개수 초과 크래시',
    cause: '수명의 주인이 없고, 대량으로 생기는 경량 객체를 GC 추적 대상(UObject)으로 만든 구조',
    solution: [
      '모든 Entity 공통 <code>UVisualDataModuleComponent</code> + <code>CreateModule</code> Factory → 로드 · 적용 · 정리를 한 곳에서',
      '각 컴포넌트에는 필요한 데이터만 할당(필요하면 WeakPtr) → 전체 데이터 참조 제거',
      '모듈을 <b>TSharedPtr 경량 객체</b>로 전환 → UObject 개수 · GC 추적에서 제외, <code>Cast&lt;&gt;</code> 대신 <b>커스텀 RTTI</b> <code>ModuleCast&lt;T&gt;</code>',
      'Attachment는 한 번의 <code>FStreamableHandle</code>로 비동기 로드, 재로드 · Detach 시 이전 핸들 취소, 로드 완료된 Entity만 표시',
    ],
    result: 'UObject 초과 크래시 구조적 차단, 데이터 수명 관리가 ModuleComponent로 일원화',
    visual: { type: 'diagram', src: 'visualdata-flow.svg' },
  },

  transition: {
    title: '외형 전이 규칙 — 바뀐 만큼만 다시 적용',
    tags: ['런타임 아키텍처', '메모리 최적화'],
    thesis: '외형 변경을 "상태 전이"로 보고, 다음 데이터와 현재 상태를 비교해 갱신 범위를 판정한다.',
    url: P('visualdata', '전이-규칙으로-부분-갱신-최적화'),
    problem: '헬멧 하나만 바꿔도 전신 파츠와 Attachment를 전부 다시 로드',
    cause: '외형 데이터가 바뀔 때마다 모듈 전체를 재적용하는 구조',
    solution: [
      '<code>EvaluateTransitionRule(Next)</code> 도입 — <b>NoUpdate</b>(동일) · <b>PartialUpdate</b>(바뀐 파츠만) · <b>FullReset</b>(전면 재구성)',
      '실제 변경 파츠로 재로드 범위를 한정',
      '규칙은 모듈 가상 함수라, 에디터 모듈은 override로 다른 판정 (PC는 메인 파츠가 바뀔 때만 전체 재적용)',
    ],
    result: '불필요한 전신 재로드 제거, 타입별 규칙을 모듈 안에 캡슐화',
    visual: { type: 'code', file: '전이 규칙 override', code: `// 에디터 PC 모듈 — 전이 규칙 override: 메인 파츠가 바뀔 때만 전면 재구성
EVisualDataModuleTransitionRule
FVisualDataEditorModulePC::EvaluateTransitionRule(const UVisualGameDataBase* Next)
{
    if (!VisualGameData || !Next || VisualGameData->MainParts != Next->MainParts)
        return EVisualDataModuleTransitionRule::FullReset;
    return EVisualDataModuleTransitionRule::PartialUpdate;          // 나머지는 바뀐 파츠만
}` },
    frames: 'appearance-attachment',
  },

  network: {
    title: '콘텐츠 통신 — 특성에 맞춘 세 가지 전송 방식',
    tags: ['네트워크 동기화', '런타임 아키텍처'],
    thesis: '상시성 · 실시간성 · 진입 빈도를 기준으로 TCP · WebSocket · HTTP를 구분해 쓴다.',
    url: P('sol-content', 'case-login-packet'),
    problem: '횡적 성장 콘텐츠 데이터까지 로그인 시점에 함께 받으면 로그인 패킷이 무거워짐',
    cause: '모든 콘텐츠를 같은 방식(접속 시 일괄 동기화)으로 다룸',
    solution: [
      '<b>TCP</b> — 상시 동기화가 필요한 리텐션 리워드 · 데미지미터 · 세금',
      '<b>WebSocket</b> — 채팅 실시간 송수신',
      '<b>HTTP API</b> — 성장 콘텐츠는 진입 시점에 지연 조회 → 로그인 패킷 부담 완화',
      'Manager 패턴: NotifyEvt → NotiClient → Manager 상태 갱신 → 델리게이트 → UI (UI는 서버를 모름)',
      '채팅 아이템 링크: 렌더 시점에 마크업 생성 → RichText Decorator로 파싱해 클릭 시 아이템 정보',
    ],
    result: '로그인 패킷 과부하 방지, 콘텐츠별 동기화 정책이 Manager 단위로 분리',
    visual: { type: 'diagram', src: 'outgame-noti.svg' },
  },

  strategy: {
    title: '맵 뷰어 — View 공유 · Strategy 교체',
    tags: ['런타임 아키텍처'],
    thesis: '변하지 않는 View는 하나로 두고, 맵 종류별로 달라지는 규칙만 Strategy로 분리한다.',
    url: P('mapdesign', 'case-dungeon'),
    problem: '던전 전용 맵을 추가하려면 같은 맵 View를 통째로 복제해야 하는 구조',
    cause: '줌 · 드래그 · 아이콘 · 입력(공통)과 데이터 소스 · 목록 · 상호작용(타입별)이 한 위젯에 섞여 있었음',
    solution: [
      'View(<code>URegionMapWidget</code>)는 공유 — 줌 · 드래그 · 아이콘 · 입력',
      '<code>UMapViewerStrategy</code>로 데이터 소스 선택 · 목록 구성 · 상호작용 규칙만 분리',
      '월드맵(확대 · 드래그 허용) / 던전맵(고정 배율 · 정보 패널)을 Strategy로 구현, 화면이 <code>EMapViewerType</code>으로 선택',
    ],
    result: 'View 수정 없이 Strategy 추가만으로 던전맵 지원',
    visual: { type: 'diagram', src: 'mapdesign-strategy.svg' },
  },

  pocket: {
    title: '연출 자원 수명 — PocketLevel · LevelSequence',
    tags: ['런타임 아키텍처', '메모리 최적화'],
    thesis: '연출 자원은 필요할 때 만들고, 끝나면 상태를 원복한 뒤 파괴한다.',
    url: P('sol-content', 'pocketlevel-시퀀스-수명-관리'),
    problem: '별자리 · 순례 연출은 인게임과 분리된 공간이 필요하고, 연출 후 자원 · 카메라 상태가 남으면 다른 연출과 꼬임',
    cause: 'PocketLevel은 월드 임의 위치에 생성되고, 시퀀스는 Keep State로 끝난 상태를 유지할 수 있음',
    solution: [
      'PocketLevel Instance에서 재생, 진입 시 Stream In · 종료 시 Stream Out',
      '시퀀스 액터 위치와 <code>TransformOrigin</code>을 PocketLevel 경계 원점으로 덮어써 그 공간 안에서 재생',
      '<code>TSoftObjectPtr</code>로 첫 재생 때 로드, 시퀀스별 액터 캐시, 같은 그룹의 다른 시퀀스는 먼저 정지',
      '종료 시 재생 위치를 처음으로 되돌린 뒤 정지 · 파괴, ViewTarget은 이전 대상이 아닌 Pawn으로 복귀',
    ],
    result: '연출 후 자원이 남지 않고, 연출이 겹쳐도 카메라가 꼬이지 않음',
    visual: { type: 'code', file: '시퀀스 생성 · 파괴', code: `// 스트리밍된 PocketLevel 원점으로 시퀀스 액터와 트랜스폼 트랙 원점을 함께 이동
const FVector Origin = PocketLevel->GetBounds().Origin;
SeqActor->SetActorLocationAndRotation(Origin, FRotator::ZeroRotator);
SeqActor->bOverrideInstanceData = true;
Cast<UDefaultLevelSequenceInstanceData>(SeqActor->DefaultInstanceData)->TransformOrigin = FTransform(Origin);

// 파괴 전 시작 프레임으로 Jump — Keep State 트랙이 바꾼 상태를 원복
Player->SetPlaybackPosition(FMovieSceneSequencePlaybackParams(
    Player->GetStartTime().Time, EUpdatePositionMethod::Jump));
Player->Stop();
SeqActor->Destroy();` },
    frames: 'constellation-preview',
  },

  slate: {
    title: 'Slate Global Invalidation — 측정 · 적용 · 부작용 · 한계',
    tags: ['퍼포먼스 최적화'],
    thesis: '측정으로 원인을 확인하고, 화면 단위로 적용한 뒤 생긴 부작용과 한계까지 기준으로 정리한다.',
    url: P('optimization', 'case-slate-hitching'),
    problem: 'UI 화면에서 Slate Hitching(프레임이 순간적으로 튀는 현상)',
    cause: 'Unreal Insights에서 Slate::Tick · DrawWindows · PaintSlowPath가 매 프레임 실행 → 바뀌지 않은 위젯까지 재계산',
    solution: [
      '화면마다 사용 여부를 데이터로 두고, 활성 화면이 바뀔 때 <code>ToggleGlobalInvalidation</code>',
      '부작용 1 — 스크롤 · 파티클처럼 계속 바뀌는 위젯은 <code>ForceVolatile</code>로 캐시에서 제외',
      '부작용 2 — 무효화 경로 밖에서 값이 바뀌는 화면은 2틱 뒤 갱신, 재접속 시점은 <code>InvalidateAllWidget</code>',
      '한계 — 갱신이 잦거나 타이밍이 맞지 않는 화면은 화면 단위로 꺼서 적용 범위를 제한',
    ],
    result: '매 프레임 위젯 재계산 비용 절감, 적용 기준이 화면 단위 데이터로 남음',
    visual: { type: 'image', src: 'projects/optimization/image-20250709-123225.png', caption: 'Unreal Insights — Slate::Tick · DrawWindows · Prepass · PaintSlowPath' },
    code2: `// 활성 화면이 바뀔 때 — 화면별 데이터로 토글 (풀스크린 화면이 없으면 활성)
const auto* Screen = Cast<UScreenWidgetBase>(ScreenStack->GetActiveWidget());
FSlateApplication::Get().ToggleGlobalInvalidation(Screen ? Screen->UseGlobalInvalidation() : true);`,
  },

  lod: {
    title: '런타임 비용 절감 — LOD 파츠 · 정렬 키',
    tags: ['퍼포먼스 최적화', '렌더링'],
    thesis: '바뀔 때만 처리하고, 반복 비용은 미리 계산해 둔다.',
    url: P('optimization', 'lod별-파츠-통합'),
    problem: '원거리 Entity도 분리된 파츠(Master / Face / Torso / Helmet)를 모두 그림. 아이템 수집 정렬은 비교할 때마다 슬롯 × 인벤토리를 조회',
    cause: '거리와 무관한 파츠 렌더, 정렬 비교 함수 안의 반복 Lookup',
    solution: [
      'Torso의 <code>GetPredictedLODLevel()</code> ≥ <code>OptimizeLOD</code>(2)이면 Helmet / Face 숨김 (에셋별 <code>bUseLODOptimize</code>)',
      '1초 간격 Tick에서 <b>LOD가 바뀐 경우에만</b> Visibility 갱신, 에셋 로드 완료 시 한 번 재적용',
      '정렬 키를 정렬 전 컬렉션별 1회 계산 → 비교 O(N log N)회의 Lookup을 <b>O(N)</b>으로',
      '무기 FX: 풀 반환만으로 꺼지지 않던 나이아가라를 Detach에서 <code>DeactivateImmediate()</code>',
    ],
    result: '원거리에서 그리는 파츠 수 감소, 정렬 비용이 데이터 크기에 선형',
    visual: { type: 'code', file: 'LOD 파츠 최적화', code: `// LOD가 바뀐 순간에만 파츠 표시 여부 갱신 — 평소 Tick 비용은 비교 한 번
const int32 LOD = GetPartMesh(EPart::Torso)->GetPredictedLODLevel();   // 몸통 기준 LOD
if (LOD == LastLOD) return;
LastLOD = LOD;

for (EPart Part : LODHiddenParts.FindRef(DataType))                     // PC: Face, 갑옷: Helmet · Face
    GetPartMesh(Part)->SetVisibility(LOD < OptimizeLOD);                // 임계 LOD 이상이면 숨김` },
  },

  quest: {
    title: '미니맵 퀘스트 — 가변 데이터를 텍스처로 인코딩',
    tags: ['렌더링', '퍼포먼스 최적화'],
    thesis: '개수가 바뀌는 퀘스트 영역을 R16F 텍스처 한 줄로 인코딩해, 위젯 없이 머티리얼이 직접 그린다.',
    url: P('mapdesign', 'case-minimap-cost'),
    problem: '퀘스트 영역마다 아이콘 위젯을 쓰면 표시 대상이 늘수록 UI 비용이 함께 증가',
    cause: '표시 개수만큼 위젯 인스턴스 · 레이아웃 · 페인트 비용이 늘어나는 구조',
    solution: [
      '퀘스트마다 (X, Y, 반경)을 월드 크기로 정규화 → <code>FFloat16</code> 배열',
      '<code>CreateTransient(N, 1, PF_R16F)</code> → Mip BulkData Lock · Memcpy · Unlock → <code>UpdateResource()</code>',
      '머티리얼 인스턴스에 텍스처와 개수를 넘겨 셰이더가 영역을 직접 표시',
      '기기가 <code>PF_R16F</code> 샘플링을 지원하지 않으면 인디케이터를 표시하지 않도록 분기',
    ],
    result: '표시 대상이 늘어도 위젯 비용이 늘지 않음',
    visual: { type: 'code', file: 'R16F 퀘스트 텍스처', code: `// 퀘스트 원 (x, y, r)을 정규화해 R16F 1 × N 텍스처로 패킹 → 머티리얼이 개수만큼 순회
TArray<FFloat16> Packed;
for (const FQuestArea& Q : Quests)
    Packed.Append({ (Q.X - Origin.X) / Size.X, (Q.Y - Origin.Y) / Size.Y, Q.Radius / Size.X });

UTexture2D* Tex = UTexture2D::CreateTransient(Packed.Num(), 1, PF_R16F);
FTexture2DMipMap& Mip = Tex->GetPlatformData()->Mips[0];
FMemory::Memcpy(Mip.BulkData.Lock(LOCK_READ_WRITE), Packed.GetData(), Packed.Num() * sizeof(FFloat16));
Mip.BulkData.Unlock();
Tex->UpdateResource();                                              // GPU 업로드
Mid->SetScalarParameterValue(QuestCountParam, Packed.Num());` },
  },

  editorBone: {
    title: '에디터 본 트랜스폼 프리뷰 — AnimPreviewInstance',
    tags: ['엔진 툴 확장', '애니메이션'],
    thesis: '프리뷰 메시가 인게임 AnimInstance를 타지 않는다는 점을 짚고, 프리뷰 인스턴스에 본 노드를 직접 주입한다.',
    url: P('visualdata-editor', 'case-preview-bones'),
    problem: '체형 값(머리 · 척추 · 팔 · 다리 스케일, 골반 이동)을 바꿔도 에디터 프리뷰에 반영되지 않음',
    cause: '인게임은 <code>ULocomotionAnimInstance</code>로 적용하지만, 프리뷰 메시(<code>UDebugSkelMeshComponent</code>)는 <code>UAnimPreviewInstance</code>로 재생돼 그 경로를 타지 않음',
    solution: [
      '에디터 전용 <code>UEditorTransformBonesComponent</code>에서 <code>UAnimPreviewInstance::ModifyBone()</code> 호출',
      'ModifyBone은 본 이름으로 <code>FAnimNode_ModifyBone</code>을 찾거나 추가 → 값이 바뀔 때마다 같은 노드 갱신',
      '<b>적용 공간 분리</b> — 스케일은 컴포넌트 공간에서 교체, 이동은 부모 본 공간에서 더하기, 회전은 무시',
    ],
    result: '체형 값을 바꾸면 에디터 프리뷰에 즉시 반영',
    visual: { type: 'code', file: 'ModifyBone 프리뷰', code: `// 프리뷰 인스턴스에 ModifyBone 노드 추가 — 애니메이션 위에 체형 값을 바로 반영
auto Apply = [Preview](FName Bone, const FVector& Scale, const FVector& Offset = FVector::ZeroVector)
{
    FAnimNode_ModifyBone& Node = Preview->ModifyBone(Bone);                 // 본 이름으로 find-or-add
    Node.ScaleMode       = BMM_Replace;   Node.ScaleSpace       = BCS_ComponentSpace;    // 스케일: 교체
    Node.TranslationMode = BMM_Additive;  Node.TranslationSpace = BCS_ParentBoneSpace;   // 이동: 더하기
    Node.RotationMode    = BMM_Ignore;                                                  // 회전: 애니메이션 그대로
    Node.Scale = Scale;
    Node.Translation = Offset;
};
Apply("pelvis", Body.PelvisScale, Body.PelvisOffset);                      // head · spine · thigh 등 12개 본` },
    frames: 'editor-bone-transform',
  },

  editorModule: {
    title: '에디터 프리뷰 — 인게임 모듈 재사용 (Factory Method)',
    tags: ['엔진 툴 확장', '런타임 아키텍처'],
    thesis: '에디터가 인게임 로직을 따라 만들지 않고, 인게임 모듈을 상속해 "다른 부분만" override한다.',
    url: P('visualdata-editor', 'case-module-reuse'),
    problem: '에디터 전용 컴포넌트가 인게임 외형 로직을 따로 구현 → 외형 기능을 바꿀 때마다 양쪽을 수정',
    cause: '프리뷰를 위해 런타임 코드를 복제한 구조',
    solution: [
      '에디터 컴포넌트를 인게임 <code>UVisualDataModuleComponent</code>의 자식으로 바꾸고 <code>CreateModule()</code> 하나만 override',
      '생성되는 에디터 모듈도 인게임 모듈을 상속 → 로드 · 파츠 적용 · 전이 규칙은 인게임 코드 그대로 실행',
      '에디터 전용 동작만 override — 전이 규칙, 무기 소켓 프리뷰(<code>ApplySocket</code> · <code>ClearModule</code>), Spirit Dissolve 고정',
    ],
    result: '에디터 전용 컴포넌트 삭제, 캐릭터 뷰어 · FX 에디터도 같은 컴포넌트로 전환 → 인게임 수정이 프리뷰에 그대로 반영',
    visual: { type: 'code', file: 'Factory Method override', code: `// 에디터 컴포넌트는 Factory Method만 override — 캐릭터 타입만 에디터 모듈로 교체
TSharedPtr<FVisualDataModuleBase> UVisualDataEditorModuleComponent::CreateModule(const UVisualGameDataBase* Data)
{
    if (IsCharacterType(Data->DataType))                            // PC · GodArmor
        return MakeShared<FVisualDataEditorModulePC>(this, Data);   // 인게임 PC 모듈 상속 + 프리뷰 처리
    return Super::CreateModule(Data);                               // 그 외 타입은 인게임 모듈 그대로
}` },
  },

  areaVis: {
    title: 'AreaTool 3D 시각화 — SceneProxy · ComponentVisualizer',
    tags: ['엔진 툴 확장', '렌더링'],
    thesis: '레벨 데이터를 기획자가 "보면서" 배치하도록, 렌더 스레드 프록시와 에디터 비주얼라이저를 직접 구현한다.',
    url: P('areatool', '저작-ux-2d-polygon-3d-point-actor'),
    problem: '스폰 반경 · 순찰 영역 · 구역(District)이 숫자로만 존재해 넓은 맵에서 배치 확인이 어려움',
    cause: '배치 데이터가 뷰포트에 형태로 보이지 않아, 수치와 목록으로만 확인해야 했음',
    solution: [
      '<code>FPrimitiveSceneProxy::GetDynamicMeshElements</code> — 렌더 스레드에서 와이어 실린더로 스폰 반경 표시',
      '<code>FComponentVisualizer</code> — 선택 시 솔리드 메시 + 캡 면을 <code>FPolygon2dTriangulator</code>로 삼각화해 <code>FDynamicMeshBuilder</code>로 빌드',
      '<code>GetViewRelevance</code>의 <code>bDrawOnlyIfSelected</code>로 선택 액터만 표시',
      'AreaTool Outliner에서 <code>rid = 1</code>처럼 조건 검색 → 대상 액터 즉시 이동',
    ],
    result: '구역 · 스폰 · 순찰 데이터를 뷰포트에서 바로 확인하며 저작',
    visual: { type: 'code', file: '캡 면 삼각화', code: `// ComponentVisualizer — 선택 시 솔리드 실린더 + 폴리곤 캡 면을 에디터 뷰에 그림
auto* Material = new FColoredMaterialRenderProxy(GEditor->GeomMaterial->GetRenderProxy(), MeshColor);
DrawCylinder(PDI, Origin, X, Y, Z, Radius, HalfHeight, Sides, Material, SDPG_World);

// 캡 면 — 2D 폴리곤을 삼각형으로 분할해 동적 메시로 제출
FDynamicMeshBuilder Builder(PDI->View->GetFeatureLevel());
for (const auto& Tri : TriangulatePolygon(Points))
    Builder.AddTriangle(AddVertex(Builder, Tri.V[0]), AddVertex(Builder, Tri.V[1]), AddVertex(Builder, Tri.V[2]));
Builder.Draw(PDI, LocalToWorld, Material, SDPG_World);` },
    image: 'projects/areatool/areatool-patrol-spawn.jpg',
  },

  areaPipe: {
    title: 'AreaTool 파이프라인 — 검증 체인 · 변경분 반영 · CI',
    tags: ['엔진 툴 확장'],
    thesis: '잘못된 레벨 데이터는 런타임이 아니라 export 시점에 막고, 사람 손을 거치지 않게 CI로 강제한다.',
    url: P('areatool', 'case-validation'),
    problem: '잘못 배치된 액터가 그대로 export돼 런타임에서야 발견. 통째 저장으로 바뀌지 않은 파일까지 체크아웃되고, 지운 액터의 파일은 남음',
    cause: '검증 단계가 없고, export 결과와 기존 파일의 차이를 보지 않는 저장 방식',
    solution: [
      '<code>IAreaToolValidator</code> 체인을 Generator별로 조합(이름 · 폴더 · 리전 · 확률 · NavMesh), 실패 액터는 제외 후 경고 링크',
      '기존 파일과 문자열 비교로 <b>동일 · 변경 · 신규 · 삭제</b> 분류 → 바뀐 것만 Checkout · MarkForAdd · Delete',
      '비교가 의미 있도록 GUID 순으로 정렬해 직렬화 순서 고정',
      'Commandlet: 헤드리스에서 내비게이션 시스템 추가 · 기획 데이터 레이어 · World Partition 전체 로드 후 Jenkins에서 전체 레벨 export',
    ],
    result: '잘못된 데이터를 export 시점에 차단, 소스 컨트롤에는 실제 변경분만',
    visual: { type: 'diagram', src: 'areatool-reconcile.svg' },
  },
};

export const VERSIONS = [
  {
    key: '1_combat', file: '임현지_포트폴리오_클라이언트_전투',
    label: 'Client · Combat', title: '클라이언트 전투',
    pitch: '서버가 확정한 판정 위에서, 연출이 "언제 · 어디에" 보여야 하는지를 수학으로 맞춥니다.',
    focus: ['게임 수학', '네트워크 동기화', '애니메이션'],
    slides: ['hit', 'sync', 'notify', 'obtain', 'traj', 'uiparticle', 'ray', 'centroid', 'minimap', 'dragclamp'],
  },
  {
    key: '2_system', file: '임현지_포트폴리오_클라이언트_시스템',
    label: 'Client · System', title: '클라이언트 시스템',
    pitch: '데이터 주도 구조와 명확한 수명 관리로, 타입이 늘어도 무너지지 않는 클라이언트 시스템을 만듭니다.',
    focus: ['런타임 아키텍처', '네트워크 동기화', '메모리 최적화'],
    slides: ['vdmodule', 'transition', 'notify', 'sync', 'network', 'strategy', 'dragclamp', 'pocket', 'editorModule', 'slate'],
  },
  {
    key: '3_client', file: '임현지_포트폴리오_클라이언트_통합',
    label: 'Client', title: '클라이언트 통합',
    pitch: '런타임 구조 · 전투 동기화 · 게임 수학 · 에디터 툴 · 최적화를 문제 단위로 끝까지 다룹니다.',
    focus: ['런타임 아키텍처', '게임 수학', '엔진 툴 확장', '퍼포먼스 최적화'],
    slides: ['vdmodule', 'transition', 'sync', 'hit', 'obtain', 'uiparticle', 'editorModule', 'areaPipe', 'slate', 'quest'],
  },
  {
    key: '4_engine', file: '임현지_포트폴리오_엔진툴_렌더링최적화',
    label: 'Engine Tools · Rendering Optimization', title: '엔진 툴 · 렌더링 최적화',
    pitch: '에디터 확장과 측정 기반 최적화로, 제작 파이프라인과 런타임 비용을 함께 다룹니다.',
    focus: ['엔진 툴 확장', '게임 수학', '렌더링', '퍼포먼스 최적화'],
    slides: ['editorBone', 'editorModule', 'areaVis', 'ray', 'centroid', 'areaPipe', 'slate', 'lod', 'quest', 'minimap'],
  },
];
