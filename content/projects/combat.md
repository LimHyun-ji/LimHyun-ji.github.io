---
layout: project
order: 1.5
title: "전투 시스템 — Action · Notify · 서버 동기화"
role: "Client Developer"
period: "2023 — 현재"
summary: "서버 ActionEvt를 Action Table · 몽타주 Notify기반으로 연결 및 동기화"
tags: ["네트워크 동기화", "애니메이션", "게임 수학"]
---

<div class="shot-row">
  <figure><img src="/images/projects/combat/combat-preview.gif" alt="필드 전투 중 스킬 사용 시 몬스터 피격 · 데미지 숫자 · Miss가 표시되는 모습" /><figcaption>전투 — 스킬 피격 · 데미지 표시</figcaption></figure>
</div>

## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">인게임 · 에디터 Notify 의존 분리</p>
    <dl>
      <dt>문제</dt><dd>에디터에서 재생한 ActionNotify가 인게임과 다르게 동작하고, 인게임 로직이 에디터 코드에 의존할 위험</dd>
      <dt>해결</dt><dd>Simulator 객체(Has-A)로 재생 경로를 하나로 맞추고 처리를 <code>Notify_Game</code> / <code>Notify_Editor</code>로 분리</dd>
      <dt>결과</dt><dd>서버 유무와 관계없이 같은 동작, 인게임은 에디터 코드와 독립</dd>
    </dl>
    <a class="case-more" href="#case-notify">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">피격 연출과 이펙트 시점 불일치</p>
    <dl>
      <dt>문제</dt><dd>피격 지연을 진행 방향 투영 · 등속으로 계산해, 속도 커브로 가감속하는 이펙트와 시점이 어긋남</dd>
      <dt>해결</dt><dd>지연 계산이 이펙트와 같은 속성(속도 커브)을 참조하도록 변경</dd>
      <dt>결과</dt><dd>이펙트가 닿는 순간에 피격 연출 표시(연출 시점 동기화)</dd>
    </dl>
    <a class="case-more" href="#case-hit-delay">자세히 ↓</a>
  </div>
</div>

## 개요

- 전투 판정은 서버가 확정해 보내고, 클라이언트는 **판정을 바꾸지 않고 연출 시점 · 위치 · 상태를 맞추는** 역할
- 흐름: 서버 **ActionEvt** → **Action Table**(타입별 몽타주) → **몽타주 재생** → **Custom ActionNotify** 실행

<img class="diagram" src="/images/diagrams/visualdata-action.svg" alt="전투 액션 흐름: 서버 ActionEvt 수신 → Entity가 ActionTable에서 타입별 액션 조회 → 재생할 몽타주 반환 → AnimInstance 몽타주 Play → Notify 시점 도달 시 Custom ActionNotify 실행 → Notify_Game(인게임 처리) / Notify_Editor(에디터 프리뷰)" />

## 구현 내용

### Action Table — 타입별 몽타주를 데이터로 정의

- Entity 타입별로 어떤 액션에 어떤 몽타주를 재생할지 Action Table 데이터로 정의
- 액션이 늘어나도 코드 수정 없이 데이터 추가로 대응
- 흐름: 서버 ActionEvt 수신 → Action Table에서 타입별 몽타주 조회 → 몽타주 Play → Notify 시점에 Custom ActionNotify 실행

<div id="case-notify" class="case-anchor"></div>

### Custom ActionNotify — Notify_Game / Notify_Editor 분리

- 에디터에서 재생한 ActionNotify가 인게임과 다르게 동작하는 문제 → Notify 재생을 Simulator 객체(Has-A)에 맡겨 에디터도 인게임과 같은 경로로 실행
- 처리를 `Notify_Game`(인게임) / `Notify_Editor`(에디터 프리뷰)로 나눠, 인게임 로직이 에디터 전용 코드에 의존하지 않음
- VisualData 툴과 전투 모듈을 일원화 → 서버 유무와 관계없이 같은 몽타주 · Notify 동작

### 전투 서버 동기화 — ActionNotify Begin 시점 처리

<img class="diagram" src="/images/diagrams/combat-sync.svg" alt="전투 서버 동기화 시퀀스: CastCmd → SkillCastResultEvt → ActionEvt(NotifyInfoList) → Montage 재생 → Immediate/Lazy Hit 분기 → StatusEffect → AttackEndEvt" />

- 서버 ActionEvt 수신 시점에 연출을 처리하면 클라이언트 몽타주 타이밍과 어긋남 <br>
 -> 처리 시점을 ActionNotify Begin으로 이동
- 서버와 클라이언트가 같은 Export ActionData(몽타주 Notify 데이터)로 시점을 계산
- 게임 시간 동기화는 서버 시각보다 약 200ms 늦게 재생해 패킷 도착 여유를 두는 구조이고, Notify 처리는 그 위에서 순서를 맞춤

<div id="case-hit-delay" class="case-anchor"></div>

### 피격 연출 지연 — 이펙트 속도 커브 기준 표시 시점

- 관통 · 확산 스킬도 Hit Notify 한 번에 대상 전원이 같은 프레임에 맞아, 투사체가 지나가는 느낌이 없었음<br>
-> 판정은 서버가 확정했으므로 맞은 시각은 그대로 두고, 대상별로 <strong>표시 시각만</strong> 지연하도록 개선
- 이펙트(Moving 파티클)는 속도 커브로 가감속해 시점이 어긋남 <br>
 -> 지연 계산이 이펙트와 같은 속도 커브를 참조하도록 변경
- 커브가 단조롭지 않을 수 있어 이분 탐색 대신 1/60초 간격 선형 탐색으로 "처음 도달" 시각을 찾음 (정밀도)

  ```cpp
  // ActionNotify_Hit.cpp — GetHitEffectDelay
  const double Length = FVector::Dist2D(Start, End);                 // 이펙트 경로 길이
  const float  Duration = HitEffectDelayPath.Duration / PlayRate;    // 공격 속도 배율 반영
  const float  TargetY = FMath::Min(FVector::Dist2D(Start, HitTargetLocation) / Length, 1.0);

  for (float Time = 0.f; Time < Duration; Time += 1.f / 60.f)
  {
      const float Y = ActionMovingPath::EvaluateSpeedCurve(MoveSpeedCurve, Time / Duration);
      if (Y >= TargetY) return Time;                                 // 이동 비율이 처음 도달한 시각
  }
  return Duration;
  ```

- 계산을 `UActionNotify_Hit`에 두어 게임과 툴이 같은 함수 사용 → 툴에서 본 타이밍이 게임과 동일
- 배속 재생 시 파티클이 끊기던 문제: 지연 계산과 파티클 이동에 같은 재생 배율을 적용해 두 시간축을 맞춤