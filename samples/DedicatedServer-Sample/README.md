# DedicatedServer-Sample (UE5 C++)

오픈월드 MMO에서 자주 쓰는 **서버 권위(Server-Authoritative) 컨텐츠**와 **대량 오브젝트 복제 최적화**를 UE5 데디케이티드 서버 위에서 구현한 샘플입니다.
에셋 없이 C++와 엔진 기본 도형만으로 동작하고, 맵 하나만 만들면 바로 실행됩니다.

> ⚠️ **상태: 코드 작성 완료, 빌드 및 측정 전.**
> 아래 [측정 결과](#측정-결과) 표는 비어 있습니다. 직접 빌드하고 측정한 수치만 채워 넣으세요.

---

## 보여 주려는 것

| 주제 | 구현 | 위치 |
| --- | --- | --- |
| 데디케이티드 서버 타깃 | `Server` / `Client` 타깃 분리, 패키징 스크립트 | `Source/NetSampleServer.Target.cs`, `Scripts/BuildServer.bat` |
| 서버 권위 + 의도 RPC | 클라이언트는 "채집 / 공격하고 싶다"만 보낸다. 대상 탐색, 거리 및 쿨다운 검증, 결과 적용은 서버가 한다 | `ANSCharacter::ServerInteract`, `ServerAttack` |
| 요청 검증 | 서버 시간 기준 쿨다운 (지연 편차 10% 허용), 거절 횟수 집계 | `ANSCharacter::ServerAttack_Implementation` |
| 동시 요청 정합성 | 두 명이 같은 노드를 동시에 채집해도 서버에서 한 명만 성공 | `ANSResourceNode::TryHarvest` |
| 예측 연출 | 공격 이펙트는 내 화면에서 즉시 재생하고, 다른 클라이언트에는 **Unreliable** Multicast로 보낸다. DS에서는 재생하지 않는다 | `OnAttack`, `MulticastPlayAttackFX` |
| 복제 조건 | 인벤토리는 `COND_OwnerOnly` (남의 인벤토리는 보내지 않는다), 체력은 `COND_None` | `GetLifetimeReplicatedProps` |
| FastArray 델타 복제 | 인벤토리 전체가 아니라 바뀐 칸만 전송하고, 칸 단위 콜백으로 UI를 갱신한다 | `FNSInventoryList` |
| Push Model | 값이 바뀔 때만 `MARK_PROPERTY_DIRTY`. 표시되지 않은 프로퍼티는 비교하지 않는다 | `Health`, `bAvailable`, `Inventory` |
| Net Dormancy | 수천 개의 채집 노드는 평소 잠들어 있다가 상태가 바뀔 때만 `FlushNetDormancy()`로 한 번 깨운다 | `ANSResourceNode::SetAvailable_Server` |
| 컬링 거리 / 갱신 빈도 | 노드는 8000cm / 2Hz, 캐릭터는 10000cm / 30Hz. 엔진 기본값은 15000cm / 100Hz | `BeginPlay` (`-NetOpt=1`) |
| 부하 테스트 | 서버 측 AI 봇이 이동, 채집, 공격을 섞어 트래픽을 만든다 | `ANSGameMode::SpawnBots`, `ANSCharacter::TickBot` |

### 실무 경험과의 연결
- **Actor Pool, 위젯 풀링** 경험 → 복제되는 대량 오브젝트의 **서버 비용**(Dormancy, 컬링)으로 확장했습니다.
- **TCP 서버와 Schema를 맞춘 경험** → UE 복제 시스템에서는 서버 권위와 복제 조건으로 같은 정합성 문제를 풉니다.
- **"보이지 않는 것은 그리지 않는다"** → 네트워크에서는 "바뀌지 않은 것은 보내지 않고, 관련 없는 것은 고려하지 않는다".

---

## 구조

```
Source/NetSample/
├─ Public/  Private/
│  ├─ NSCharacter        플레이어/봇. 입력(런타임 생성 Enhanced Input), 서버 RPC, 체력, 리스폰
│  ├─ NSInventoryComponent  FastArray 인벤토리 (OwnerOnly, Push Model)
│  ├─ NSResourceNode     채집 노드 (Dormancy, Push Model, 리스폰)
│  ├─ NSGameMode         서버 전용. -Nodes / -Bots / -NetOpt 파싱, 격자 스폰
│  ├─ NSHUD              Canvas 디버그 HUD (NetMode, Ping, HP, Inventory)
│  └─ NSNetUtils.h       엔진 버전별 API 차이 흡수 (UE 5.5 Setter)
Config/   DefaultEngine.ini (Push Model 활성화, 기본 맵, GameMode)
Scripts/  RunServer / RunClient / RunServerTrace / BuildServer (.bat)
```

---

## 실행

**요구 사항:** UE 5.4 이상 (5.4 / 5.5 / 5.6 기준으로 작성), Visual Studio 2022.
패키징된 Server 빌드는 **소스 빌드 엔진**이 필요하고, 에디터 바이너리로 DS를 띄우는 방법은 런처 엔진에서도 됩니다.

1. `NetSample.uproject` 우클릭 → **Switch Unreal Engine version** → 엔진 선택 → **Generate Visual Studio project files**
2. `NetSample.sln`에서 `NetSampleEditor` / `Development Editor`로 빌드 후 에디터 실행
3. **맵 만들기 (최초 1회):** File → New Level → **Basic** → `/Game/Maps/NetSample`로 저장
   - Floor 액터의 Scale을 키워 **약 30000 × 30000** 이상으로 만든다 (기본 400개 노드는 약 8000 × 8000 격자)
   - PlayerStart가 있는지 확인한다
4. **에디터에서 바로 확인:** Play 옵션 → Number of Players **2**, Net Mode **Play As Client** → 내부적으로 DS가 뜬다
5. **별도 프로세스로 확인 (권장):** 환경변수 `UE_ROOT`에 엔진 경로를 설정한 뒤

```bat
Scripts\RunServer.bat -Nodes=400 -Bots=20
Scripts\RunClient.bat
Scripts\RunClient.bat
```

조작: `WASD` 이동, `Space` 점프, `E` 채집, `좌클릭` 공격

### 동작 확인 체크리스트
- [ ] 클라이언트 A가 채집하면 A, B 화면 모두에서 노드가 사라지고 10초 뒤 다시 나타난다
- [ ] A의 HUD 인벤토리 수량만 오르고, B의 HUD에는 A의 인벤토리가 보이지 않는다 (OwnerOnly)
- [ ] A가 B를 공격하면 B의 HP가 줄고, 0이 되면 3초 뒤 리스폰된다
- [ ] 공격 연타 시 서버 로그에 `Attack rejected (cooldown)`이 찍힌다 (`-LogCmds="LogNetSample Verbose"`)
- [ ] 두 클라이언트가 같은 노드를 동시에 채집해도 한쪽만 아이템을 얻는다

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

## 다음 단계 (확장 아이디어)
- **Replication Graph / Iris**: 격자 기반 공간 분할로 relevancy 계산 자체를 줄이기
- **채집 진행 바**: 서버 타이머와 클라이언트 예측 진행 바, 이동 시 서버에서 취소
- **Linux 서버 빌드 + Docker**: 실제 배포 형태에 가깝게
