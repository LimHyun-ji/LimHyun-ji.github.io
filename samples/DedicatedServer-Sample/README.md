# Ore Rush — UE5 Dedicated Server 미니게임

맵 중앙의 납품 구역 주변에서 광석을 캐서 들고 돌아와 점수를 얻는 **2~8인 데디케이티드 서버 미니게임**입니다.
오픈월드 MMO에서 쓰는 **서버 권위 컨텐츠**, **매치 흐름 관리**, **대량 오브젝트 복제 최적화**를 작은 게임 하나에 담았습니다.
에셋 없이 C++와 엔진 기본 도형만 쓰고, 레벨은 `Scripts/BuildLevel.py`가 만들어 줍니다.

> ⚠️ **상태: 코드 작성 완료, 빌드 및 플레이 테스트 전.** (UE 5.8 기준으로 작성)
> [측정 결과](#측정-결과) 표는 비어 있습니다. 직접 빌드하고 측정한 수치만 채워 넣으세요.

---

## 게임 규칙

| | |
| --- | --- |
| 목표 | 3분 동안 납품한 광석이 가장 많은 사람이 승리 |
| 채집 | 노드 근처에서 `E`. 큐브 = 광석 1개, 구(바깥쪽 고리에만 있음) = 3개. 캔 노드는 10초 뒤 다시 생긴다 |
| 운반 | 최대 10개까지 들 수 있다. 가득 차면 더 캘 수 없다 |
| 납품 | 중앙 원판(납품 구역)에 들어가면 들고 있던 광석이 자동으로 점수가 된다 |
| 공격 | `좌클릭`. 체력 100, 한 대에 20. 죽으면 들고 있던 광석을 그 자리에 **원뿔 더미로 떨군다**. 누구나 주울 수 있다 |
| 진행 | 대기 → 카운트다운 5초 → 플레이 3분 → 결과 10초 → 서버가 상태를 리셋하고 다음 라운드 |
| 봇 | 서버 AI 봇이 함께 플레이한다. 채집, 납품, 근처 적 공격 |

먼 곳의 금광은 효율이 좋지만 돌아오는 길이 길어 그만큼 습격당하기 쉽습니다. 이 위험과 보상의 균형이 게임의 핵심입니다.

---

## 데디케이티드 서버 관점에서 보여 주는 것

| 주제 | 구현 | 위치 |
| --- | --- | --- |
| DS 타깃과 실행 | `Server` / `Client` 타깃 분리, 에디터 바이너리로 DS 실행, 패키징 스크립트 | `Source/*.Target.cs`, `Scripts/*.bat` |
| 매치 상태 머신 | 서버(GameMode)만 단계를 바꾸고, 클라이언트는 GameState로 받는다 | `ANSGameMode::UpdateMatch`, `ANSGameState` |
| 시간 동기화 | 남은 시간을 매 프레임 보내지 않는다. "끝나는 서버 시각" 하나만 복제하고, 클라이언트가 `GetServerWorldTimeSeconds()`로 계산한다 | `ANSGameState::GetPhaseRemaining` |
| 맵 재로드 없는 라운드 리셋 | 노드, 캐릭터, 점수만 서버에서 초기화한다. 접속이 끊기지 않는다 | `ANSGameMode::ResetRound` |
| 서버 권위 + 의도 RPC | 클라이언트는 "캐고 싶다 / 때리고 싶다"만 보낸다. 대상 탐색, 거리 / 쿨다운 / 가방 공간 / 진행 단계 검증은 모두 서버가 한다 | `ANSCharacter::ServerInteract`, `ServerAttack` |
| 동시성 | 두 명이 같은 노드를 동시에 캐도 서버에서 한 명만 성공한다. 떨군 더미는 담을 수 있는 만큼만 가져간다 | `ANSResourceNode::Harvest_Server` |
| 예측 연출 | 공격 이펙트는 내 화면에서 즉시 재생하고, 나머지에는 **Unreliable** Multicast로 보낸다. DS에서는 재생하지 않는다 | `OnAttack`, `MulticastPlayAttackFX` |
| 복제 조건 | 인벤토리 `COND_OwnerOnly`, 노드 종류 `COND_InitialOnly`, 체력 / 점수는 전체 | 각 `GetLifetimeReplicatedProps` |
| FastArray | 인벤토리는 바뀐 칸만 델타로 보내고, 칸 단위 콜백으로 UI를 갱신한다 | `FNSInventoryList` |
| Push Model | 값이 바뀔 때만 `MARK_PROPERTY_DIRTY`. 표시되지 않은 프로퍼티는 비교하지 않는다 | `Health`, `bAvailable`, `Kind`, GameState 전체 |
| Net Dormancy | 수백~수천 개의 노드와 납품 구역은 평소 잠들어 있다가 상태가 바뀔 때만 `FlushNetDormancy()`로 깨운다 | `ANSResourceNode::SetAvailable_Server` |
| 컬링 거리 / 갱신 빈도 | 노드 8000cm / 2Hz, 캐릭터 10000cm / 30Hz. 엔진 기본값은 15000cm / 100Hz | `BeginPlay` (`-NetOpt=1`) |
| 봇 PlayerState | 봇도 PlayerState를 가져 스코어보드에 함께 표시된다 | `ANSBotController` |
| 서버 측 판정 주기 | 납품은 0.25초 서버 타이머로 판정한다 (BeginOverlap만으로는 구역 안에 서 있는 경우를 놓친다) | `ANSDepositZone` |

### 실무 경험과의 연결
- **Actor Pool, 위젯 풀링** → 복제되는 대량 오브젝트의 **서버 비용**(Dormancy, 컬링)으로 확장
- **TCP 서버와 Schema를 맞춘 경험** → UE 복제 시스템에서는 서버 권위와 복제 조건으로 같은 정합성 문제를 푼다
- **AreaTool(스폰 배치 툴)** → 레벨을 Python 스크립트로 자동 구성하고, 노드는 서버가 규칙에 따라 배치
- **"보이지 않는 것은 그리지 않는다"** → "바뀌지 않은 것은 보내지 않고, 관련 없는 것은 고려하지 않는다"

---

## 구조

```
Source/NetSample/
├─ NSGameMode        서버 전용. 매치 상태 머신, 노드 고리 배치, 납품 / 드롭 / 리셋, 봇 스폰
├─ NSGameState       Phase, 종료 서버 시각, 우승자, 최소 인원 (Push Model)
├─ NSCharacter       플레이어 / 봇. 런타임 생성 Enhanced Input, 서버 RPC, 체력, 사망 드롭, 봇 AI
├─ NSInventoryComponent  FastArray 인벤토리 (OwnerOnly)
├─ NSResourceNode    광석 / 금광 / 떨군 더미 (Dormancy, InitialOnly Kind)
├─ NSDepositZone     납품 구역 (서버 타이머 판정)
├─ NSBotController   PlayerState를 가진 AI 컨트롤러
├─ NSHUD             Canvas HUD (단계 / 타이머, HP, 운반량, 스코어보드)
└─ NSNetUtils.h      엔진 버전별 API 차이 흡수
Scripts/  BuildLevel.py (레벨 자동 구성), RunServer / RunClient / RunServerTrace / BuildServer (.bat)
```

---

## 실행

**요구 사항:** UE 5.8, Visual Studio 2022. (5.4 이상이면 대체로 동작하도록 작성. 버전 차이는 `NSNetUtils.h`에 모아 둠)
패키징된 Server 빌드는 소스 빌드 엔진이 필요하고, 에디터 바이너리로 DS를 띄우는 방법은 런처 엔진에서도 됩니다.

1. `NetSample.uproject` 우클릭 → **Generate Visual Studio project files** → `NetSampleEditor` / `Development Editor` 빌드
2. 에디터를 열고 **Tools → Execute Python Script → `Scripts/BuildLevel.py`**
   → `/Game/Maps/NetSample`에 바닥, 조명, 납품 구역, PlayerStart 8개가 배치되고 저장됩니다
3. **에디터에서 바로:** Play 옵션 → Number of Players **2**, Net Mode **Play As Client**
4. **별도 프로세스로 (권장):** 환경변수 `UE_ROOT`에 엔진 경로를 설정한 뒤

```bat
Scripts\RunServer.bat -Bots=5 -MinPlayers=1 -RoundTime=120
Scripts\RunClient.bat
Scripts\RunClient.bat
```

### 플레이 테스트 체크리스트
- [ ] 접속하면 Waiting → Countdown → Playing으로 넘어가고, 두 클라이언트의 타이머가 같다
- [ ] A가 캐면 A, B 모두에서 노드가 사라지고 10초 뒤 다시 생긴다
- [ ] 10개를 들면 더 캘 수 없고, 납품 구역에 들어가면 점수가 오르며 운반량이 0이 된다
- [ ] B의 HUD에는 A의 운반량이 보이지 않는다 (OwnerOnly). 점수는 모두에게 보인다
- [ ] A가 B를 처치하면 B가 들고 있던 만큼 원뿔이 생기고, A가 주울 수 있다
- [ ] 라운드가 끝나면 우승자가 표시되고, 10초 뒤 접속이 유지된 채 새 라운드가 시작된다
- [ ] 공격 연타 시 서버 로그에 `Request rejected (attack cooldown)` (`-LogCmds="LogNetSample Verbose"`)

---

## MCP로 에디터 연결하기 (본인 PC에서)

이 저장소를 만든 클라우드 세션에서는 에디터를 띄울 수 없습니다. 에디터를 MCP로 조작하려면 **UE 5.8을 실행하는 PC에서 Claude Code를 실행**해야 합니다.

1. Unreal Editor용 MCP 서버를 준비합니다. UE 5.8에 내장된 것이 있으면 그것을, 없으면 커뮤니티 Unreal MCP 플러그인을 씁니다. 플러그인 문서에 따라 프로젝트의 `Plugins/`에 넣고 활성화하세요.
2. 프로젝트 폴더에서 Claude Code(데스크톱 앱 또는 CLI)를 열고, 플러그인 문서에 나온 대로 MCP 서버를 등록합니다 (`.mcp.json` 또는 `claude mcp add`).
3. 에디터를 켠 상태에서 요청하면 됩니다. 예: "`Scripts/BuildLevel.py` 실행해서 레벨 만들고, 납품 구역 주변에 엄폐물 기둥 12개 배치해 줘"

MCP 없이도 2단계의 `BuildLevel.py`만으로 레벨은 완성됩니다. MCP는 그 위에서 배치를 다듬거나 시각적으로 확인하는 용도입니다.

---

## 측정 방법

같은 조건에서 `-NetOpt=0`(엔진 기본값)과 `-NetOpt=1`(최적화)을 비교합니다.

```bat
Scripts\RunServerTrace.bat -Nodes=3000 -Bots=100 -NetOpt=0
Scripts\RunServerTrace.bat -Nodes=3000 -Bots=100 -NetOpt=1
```

- 클라이언트 2개를 접속시키고 같은 위치에서 1~2분 플레이합니다.
- **서버 CPU:** 서버 콘솔 `stat net`, `stat game` → `ServerReplicateActors` 시간 / Insights의 `NetDriver` 타이머
- **대역폭 / 채널:** 클라이언트 콘솔 `stat net` → In/Out Rate(bytes/s), 열린 Actor Channel 수
- **어떤 프로퍼티가 대역폭을 쓰는지:** `Saved\Profiling\*.utrace`를 Unreal Insights → Networking Insights로 열기
- **Push Model 단독 효과:** `-ini:Engine:[SystemSettings]:net.IsPushModelEnabled=0`을 붙여 OFF와 비교

## 측정 결과

> 직접 측정한 값으로 채우세요. (PC 사양, 엔진 버전, 노드 수, 봇 수도 함께 적기)

| 항목 | NetOpt=0 (기본값) | NetOpt=1 (최적화) | 변화 |
| --- | --- | --- | --- |
| ServerReplicateActors (ms/frame) | | | |
| 고려된 액터 수 (Considered Actors) | | | |
| 클라이언트 열린 채널 수 | | | |
| 클라이언트 수신량 (bytes/s) | | | |
| 접속 직후 초기 수신량 (bytes) | | | |

---

## 다음 단계
- **Replication Graph / Iris**: 격자 기반 공간 분할로 relevancy 계산 자체를 줄이기
- **채집 진행 바**: 서버 타이머와 클라이언트 예측 진행 바, 이동 시 서버에서 취소
- **팀전**: 팀별 납품 구역, 팀 점수 복제
- **Linux 서버 빌드 + Docker**: 실제 배포 형태에 가깝게
