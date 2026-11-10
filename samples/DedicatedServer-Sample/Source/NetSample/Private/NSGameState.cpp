#include "NSGameState.h"

#include "GameFramework/PlayerState.h"
#include "Net/Core/PushModel/PushModel.h"
#include "Net/UnrealNetwork.h"

void ANSGameState::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
	Super::GetLifetimeReplicatedProps(OutLifetimeProps);

	FDoRepLifetimeParams Params;
	Params.bIsPushBased = true;
	DOREPLIFETIME_WITH_PARAMS_FAST(ANSGameState, Phase, Params);
	DOREPLIFETIME_WITH_PARAMS_FAST(ANSGameState, PhaseEndServerTime, Params);
	DOREPLIFETIME_WITH_PARAMS_FAST(ANSGameState, LastWinnerName, Params);
	DOREPLIFETIME_WITH_PARAMS_FAST(ANSGameState, MinPlayers, Params);
}

float ANSGameState::GetPhaseRemaining() const
{
	return static_cast<float>(FMath::Max(0.0, PhaseEndServerTime - GetServerWorldTimeSeconds()));
}

int32 ANSGameState::GetNumHumanPlayers() const
{
	int32 Count = 0;
	for (const APlayerState* PS : PlayerArray)
	{
		if (PS && !PS->IsABot())
		{
			++Count;
		}
	}
	return Count;
}

TArray<APlayerState*> ANSGameState::GetSortedPlayers() const
{
	TArray<APlayerState*> Sorted;
	for (APlayerState* PS : PlayerArray)
	{
		if (PS)
		{
			Sorted.Add(PS);
		}
	}
	Sorted.Sort([](const APlayerState& A, const APlayerState& B) { return A.GetScore() > B.GetScore(); });
	return Sorted;
}

void ANSGameState::SetPhase_Server(ENSMatchPhase NewPhase, float DurationSeconds)
{
	Phase = NewPhase;
	PhaseEndServerTime = GetServerWorldTimeSeconds() + DurationSeconds;
	MARK_PROPERTY_DIRTY_FROM_NAME(ANSGameState, Phase, this);
	MARK_PROPERTY_DIRTY_FROM_NAME(ANSGameState, PhaseEndServerTime, this);
}

void ANSGameState::SetLastWinner_Server(const FString& WinnerName)
{
	LastWinnerName = WinnerName;
	MARK_PROPERTY_DIRTY_FROM_NAME(ANSGameState, LastWinnerName, this);
}

void ANSGameState::SetMinPlayers_Server(int32 InMinPlayers)
{
	MinPlayers = InMinPlayers;
	MARK_PROPERTY_DIRTY_FROM_NAME(ANSGameState, MinPlayers, this);
}
