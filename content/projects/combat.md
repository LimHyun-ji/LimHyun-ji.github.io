---
layout: project
order: 1.5
title: "전투 시스템 — Action · Notify · 서버 동기화"
role: "Client Developer"
period: "2023 — 현재"
summary: "서버 ActionEvt를 Action Table · 몽타주 · Custom ActionNotify로 연결하고, 서버가 확정한 판정 위에서 클라이언트 연출 시점을 맞추는 전투 액션."
tags: ["Action/전투", "AnimMontage", "ActionNotify", "ServerSync", "Immediate/Lazy Hit", "StatusEffect"]
highlights:
  - "**Action Table 관리** — Entity 타입별 동작에 맞는 몽타주를 데이터로 정의하고, 서버에서 받은 ActionEvt에 따라 해당 몽타주를 재생"
  - "**Custom ActionNotify 정의** — 몽타주 재생 중 Notify 시점에 FX 등 전투 연출을 실행하고, Notify_Game / Notify_Editor로 나눠 인게임 로직과 에디터 프리뷰를 분리"
  - "**에디터 재생 동일화** — Simulator 객체(Has-A)로 에디터에서도 인게임과 같은 경로로 ActionNotify를 재생, 툴과 전투 모듈 일원화"
  - "**피격 연출 지연** — 진행 방향 투영 · 등속 계산을 이펙트와 같은 속도 커브 기준으로 바꿔 표시 시점 일치"
---

> **목적** — 서버가 확정한 전투 판정을 바꾸지 않으면서, 클라이언트의 몽타주 · Notify · 이펙트 연출 시점을 판정과 맞추는 것
>
> **성과** — 인게임 · 에디터 Notify 분리, 에디터 재생 동일화, 피격 연출과 이펙트 시점 일치
>
> **기여** — Action Table · Custom ActionNotify · 피격 연출 지연 계산 구현, 서버 동기화 구조 위에서 Notify 처리 시점 조정

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
      <dt>결과</dt><dd>이펙트가 닿는 순간에 피격 연출 표시, 게임과 툴이 같은 계산 사용</dd>
    </dl>
    <a class="case-more" href="#case-hit-delay">자세히 ↓</a>
  </div>
</div>

## 개요

- 전투 판정은 서버가 확정해 보내고, 클라이언트는 **판정을 바꾸지 않고 연출 시점 · 위치 · 상태를 맞추는** 역할
- 흐름: 서버 **ActionEvt** → **Action Table**(타입별 몽타주) → **몽타주 재생** → **Custom ActionNotify** 실행
- 외형(메시 · Attachment) 세팅은 [외형 시스템 페이지](/projects/visualdata/), 에디터 툴은 [VisualData 에디터 페이지](/projects/visualdata-editor/)에서 다룹니다

<img class="diagram" src="/images/diagrams/visualdata-action.svg" alt="전투 액션 흐름: 서버 ActionEvt 수신 → Entity가 ActionTable에서 타입별 액션 조회 → 재생할 몽타주 반환 → AnimInstance 몽타주 Play → Notify 시점 도달 시 Custom ActionNotify 실행 → Notify_Game(인게임 처리) / Notify_Editor(에디터 프리뷰)" />

## 1. Action Table · Custom ActionNotify

### Action Table 관리

- Entity 타입별로 **어떤 액션에 어떤 몽타주를 재생할지**를 Action Table 데이터로 정의
- 액션이 늘어나도 코드 수정 없이 데이터 추가로 대응

### 서버 ActionEvt → 몽타주 재생 → Notify 실행

1. 서버에서 **ActionEvt** 수신
2. Action Table에서 Entity 타입에 맞는 몽타주 조회
3. 몽타주 **Play**
4. 몽타주 재생 중 Notify 시점에 도달하면 **Custom ActionNotify** 실행 → 전투 연출(FX 등) 처리

<div id="case-notify" class="case-anchor"></div>

### Custom ActionNotify — Notify_Game / Notify_Editor 분리

**에디터에서 재생한 ActionNotify가 인게임과 다르게 동작하는 문제가 있었습니다.** 그래서 Notify 재생을 **Simulator 객체(Has-A)** 에 맡겨 에디터에서도 인게임과 같은 경로로 실행되게 했고, VisualData 툴과 전투 모듈을 일원화해 서버가 있든 없든 같은 동작을 하도록 했습니다.

- 전투 연출에 필요한 Notify를 **Custom ActionNotify**로 정의 (예: 파티클 재생 Notify)
- Notify 처리를 **Notify_Game**(인게임)과 **Notify_Editor**(에디터 프리뷰)로 나눠 구현
  - 인게임 로직이 에디터 전용 코드에 의존하지 않고, 에디터에서는 서버 없이 같은 몽타주 · Notify를 미리 볼 수 있음

## 2. 전투 서버 동기화

<img class="diagram" src="/images/diagrams/combat-sync.svg" alt="전투 서버 동기화 시퀀스: CastCmd → SkillCastResultEvt → ActionEvt(NotifyInfoList) → Montage 재생 → Immediate/Lazy Hit 분기 → StatusEffect → AttackEndEvt" />

**서버 ActionEvt를 받은 시점에 맞춰 연출을 처리하면 클라이언트 몽타주 타이밍과 어긋났습니다.** 그래서 처리 시점을 **ActionNotify Begin**으로 옮기고, 서버와 클라이언트가 같은 Export ActionData(몽타주 Notify 데이터)로 시점을 계산하도록 했습니다. 게임의 시간 동기화는 서버 시각보다 약 200ms 늦게 재생해 패킷 도착 여유를 두는 구조이고, Notify 처리는 그 위에서 순서를 맞춥니다.

```
[클라이언트] CastCmd 전송
      ↓
[서버]  SkillCastResultEvt — ActionEvt(NotifyInfoList) 반환
      ↓
[클라이언트] ActionQueue에서 Montage 재생
      ├─ Hit_0 (Immediate) : NotifyInfoList[0] 소비 → 즉시 데미지 적용
      ├─ Hit_1 (Lazy)      : LazyHitNotifyEvt 수신 대기 → 서버 확인 후 적용
      ├─ ChangeStatusEffectEvt : 버프 / 디버프 / CC 적용
      └─ AttackEndEvt      : 스킬 처리 완료
```

### Immediate / Lazy Hit 구분

`ConsumeNotifyInfo`에서 `bIsImmediate` 플래그로 분기합니다.
- **Immediate** : `NotifyInfoList` 큐 앞에서 즉시 소비해 데미지를 바로 적용
- **Lazy** : `LazyNotifyHitList`에 서버 확인 패킷이 도착한 뒤 적용. 실행 여부는 `ExecutedLazyHitNotifyIds`로 중복 방지

```cpp
// GameplayAction_Combat.cpp
bool UGameplayAction_Combat::ConsumeNotifyInfo(
    int32 NotifyId, bool bIsImmediate, geo::sync::NotifyInfo& Out)
{
    if (!bIsImmediate)
    {
        ExecutedLazyHitNotifyIds.Add(NotifyId);
        for (const geo::sync::NotifyInfo& NotifyInfo : LazyNotifyHitList)
        {
            if (NotifyInfo.notify_id() == NotifyId)
            {
                Out = NotifyInfo;
                return true;
            }
        }
        return false;
    }

    if (NotifyInfoList.IsEmpty()) return false;
    Out = NotifyInfoList[0];
    NotifyInfoList.RemoveAt(0);
    return true;
}
```

### Montage Notify JSON Export

에디터 전용 `IActionNotifyExportInterface`를 구현한 Notify 클래스가 파라미터를 JSON으로 직렬화합니다. 서버는 이 데이터를 기반으로 `NotifyInfo`를 생성해 클라이언트로 전송하므로 양측 판정 기준이 일치합니다.

```cpp
// ActionNotify_Hit.h (Export 인터페이스 선언 예)
virtual bool IsUseExport() override;
virtual FString GetExportTypeName() override;
virtual bool IsParameter(const FProperty* InProperty) override;

// 프로퍼티에 ExportParameter 메타 지정으로 JSON 항목 선택
UPROPERTY(EditAnywhere, Category="Hit",
    meta=(ExportParameter, ExportParameterName="Damage_Weight"))
int32 DamageWeight;
```

### StatusEffect Notify

`UActionNotify_StatusEffect`가 버프 · 디버프 · CC를 담당하며, Hit Notify와 동일하게 `Status_Effect_Index`를 Export해 서버 판정과 클라 연출을 동기화합니다.

<div id="case-hit-delay" class="case-anchor"></div>

## 3. 피격 연출 지연 — 이펙트와 같은 기준으로

**관통하거나 퍼지는 스킬도 Hit Notify 한 번에 대상 전원이 같은 프레임에 맞아, 투사체가 지나가는 느낌이 없었습니다.** 판정은 서버가 확정했으므로 맞은 시각은 바꿀 수 없고, 대상별로 **표시 시각만** 늦춰야 했습니다.

처음에는 진행 방향 투영 · 등속으로 지연을 계산했습니다.

```
delay = max(0, dot(P − O, d̂)) / v      // O: 시작점, d̂: 진행 방향, v: 등속
```

**그런데 이펙트(Moving 파티클)는 속도 커브로 가속 · 감속하기 때문에, 등속으로 계산한 피격 시점과 이펙트가 닿는 시점이 어긋났습니다.** 그래서 지연 계산이 이펙트와 **같은 속성(속도 커브)** 을 참조하도록 바꿨습니다. 대상까지의 거리 비율에 커브가 처음 도달하는 시각을 찾아 지연으로 씁니다.

- 커브가 단조롭지 않을 수 있어 "처음 도달" 시각을 찾아야 함 → 이분 탐색 대신 **1/60초 간격 선형 탐색**을 선택. 정밀도는 1프레임으로 화면 표시에 충분하고, 비단조 커브에서도 첫 도달을 보장
- 계산을 `UActionNotify_Hit`에 두어 **게임과 툴이 같은 함수**를 사용 → 툴에서 본 타이밍이 게임과 동일
- 공격 속도로 몽타주가 배속 재생될 때 파티클이 끊기던 문제: 지연 계산과 파티클 이동에 **같은 재생 배율**을 적용해 두 시간축을 맞춤
- 지연 실행 중 대상이 사라질 수 있어 대상 · 월드는 `TWeakObjectPtr`로 캡처

## 기술 요약

| 영역 | 내용 |
|------|------|
| 전투 액션 | Action Table(타입별 몽타주) · 서버 ActionEvt → 몽타주 Play → Custom ActionNotify |
| Notify | Notify_Game(인게임) / Notify_Editor(에디터 프리뷰) 분리, Simulator(Has-A)로 재생 경로 일원화 |
| 서버 동기화 | ActionNotify Begin 시점 처리 · Immediate / Lazy Hit · Export ActionData 공유 |
| 피격 연출 | 속도 커브 첫 도달 시각 탐색(1/60초 선형 탐색) · 게임 / 툴 단일 함수 |
| 상태이상 | `UActionNotify_StatusEffect` · `Status_Effect_Index` Export |
