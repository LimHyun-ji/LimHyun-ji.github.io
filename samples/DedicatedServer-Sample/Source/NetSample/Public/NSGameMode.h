#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "NSGameMode.generated.h"

class ANSCharacter;
class ANSDepositZone;
class ANSGameState;
class ANSResourceNode;

/**
 * Ore Rush 매치 진행. 서버 전용 (GameMode는 클라이언트에 존재하지 않는다).
 *
 *   Waiting ──(사람 MinPlayers명 이상)──▶ Countdown(5s) ──▶ Playing(RoundTime) ──▶ Results(10s)
 *      ▲                                                                              │
 *      └──────────── 인원 부족 ◀── 라운드 리셋 (맵 재로드 없이 서버가 상태만 초기화) ◀──┘
 *
 * 명령줄 옵션 (서버 실행 시, 또는 맵 URL ?Key=Value):
 *   -Nodes=<N>       채집 노드 수 (기본 300)
 *   -Bots=<N>        서버 측 AI 봇 수 (기본 3)
 *   -MinPlayers=<N>  카운트다운을 시작할 최소 사람 인원 (기본 1)
 *   -RoundTime=<s>   라운드 길이 (기본 180)
 *   -NetOpt=<0|1>    1: Dormancy + 컬링 거리 + 갱신 빈도 최적화 (기본), 0: 엔진 기본값 (비교 기준선)
 */
UCLASS()
class NETSAMPLE_API ANSGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	ANSGameMode();

	virtual void InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage) override;
	virtual void BeginPlay() override;

	bool IsNetOptEnabled() const { return bNetOpt; }
	bool IsPlaying() const;
	FVector GetDepositLocation() const;

	/** 봇이 벗어나면 중앙으로 돌아오는 반경 */
	float GetPlayRadius() const { return FMath::Max(OuterRadius, 3000.f) + 500.f; }

	/** 캐릭터가 들고 있는 광석을 점수로 바꾼다. Playing 단계에서만. */
	void Deposit_Server(ANSCharacter* Character);

	/** 죽은 자리에 광석 더미를 남긴다. */
	void SpawnDrop_Server(const FVector& Location, int32 Amount);

	/** 리스폰 위치. 사람과 봇 모두 PlayerStart 중에서 고른다. */
	FVector PickRespawnLocation(AController* Controller);

protected:
	UPROPERTY(EditDefaultsOnly, Category = "NetSample")
	TSubclassOf<ANSResourceNode> ResourceNodeClass;

	/** 납품 구역 바깥쪽 첫 노드까지의 거리 */
	UPROPERTY(EditDefaultsOnly, Category = "NetSample|Layout")
	float InnerRadius = 1200.f;

	/** 노드 간 평균 간격. 노드 수에 맞춰 바깥 반지름이 정해진다. */
	UPROPERTY(EditDefaultsOnly, Category = "NetSample|Layout")
	float NodeSpacing = 400.f;

	/** 바깥쪽 몇 % 영역에 금광이 나오는지 */
	UPROPERTY(EditDefaultsOnly, Category = "NetSample|Layout")
	float GoldOuterRatio = 0.35f;

	UPROPERTY(EditDefaultsOnly, Category = "NetSample|Match")
	float CountdownSeconds = 5.f;

	UPROPERTY(EditDefaultsOnly, Category = "NetSample|Match")
	float ResultsSeconds = 10.f;

private:
	void SetupDepositZone();
	void SpawnResourceNodes(int32 Count);
	void SpawnBots(int32 Count);
	bool FindGround(const FVector2D& XY, FVector& OutLocation) const;

	void UpdateMatch();
	void EnterPhase(uint8 NewPhase);
	void FinishRound();
	void ResetRound();

	ANSGameState* GetNSGameState() const;

	UPROPERTY()
	TObjectPtr<ANSDepositZone> DepositZone;

	FTimerHandle MatchTimer;

	int32 NumNodes = 300;
	int32 NumBots = 3;
	int32 MinPlayers = 1;
	float RoundSeconds = 180.f;
	bool bNetOpt = true;
	float OuterRadius = 0.f;
};
