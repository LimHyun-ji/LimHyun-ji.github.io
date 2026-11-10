#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameStateBase.h"
#include "NSGameState.generated.h"

class APlayerState;

UENUM()
enum class ENSMatchPhase : uint8
{
	Waiting,    // 최소 인원 대기
	Countdown,  // 시작 카운트다운
	Playing,    // 라운드 진행 (채집 / 공격 / 납품 허용)
	Results     // 결과 표시 후 서버가 리셋
};

/**
 * 모든 클라이언트가 알아야 하는 매치 상태. (GameMode는 서버에만 있으므로 여기서 복제한다)
 *
 * 남은 시간은 매 프레임 복제하지 않는다. "끝나는 서버 시각" 하나만 복제하고,
 * 클라이언트는 GetServerWorldTimeSeconds()(서버 시계 동기화 값)로 남은 시간을 계산한다.
 */
UCLASS()
class NETSAMPLE_API ANSGameState : public AGameStateBase
{
	GENERATED_BODY()

public:
	virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

	ENSMatchPhase GetPhase() const { return Phase; }
	float GetPhaseRemaining() const;
	const FString& GetLastWinnerName() const { return LastWinnerName; }
	int32 GetMinPlayers() const { return MinPlayers; }
	int32 GetNumHumanPlayers() const;

	/** 점수 내림차순. HUD 스코어보드용. */
	TArray<APlayerState*> GetSortedPlayers() const;

	// ---- 서버 전용 ----
	void SetPhase_Server(ENSMatchPhase NewPhase, float DurationSeconds);
	void SetLastWinner_Server(const FString& WinnerName);
	void SetMinPlayers_Server(int32 InMinPlayers);

private:
	UPROPERTY(Replicated)
	ENSMatchPhase Phase = ENSMatchPhase::Waiting;

	UPROPERTY(Replicated)
	double PhaseEndServerTime = 0.0;

	UPROPERTY(Replicated)
	FString LastWinnerName;

	UPROPERTY(Replicated)
	int32 MinPlayers = 1;
};
