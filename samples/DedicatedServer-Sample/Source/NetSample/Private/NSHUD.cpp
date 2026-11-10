#include "NSHUD.h"

#include "NSCharacter.h"
#include "NSGameState.h"
#include "Engine/Canvas.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/PlayerState.h"

namespace
{
	const TCHAR* NetModeToString(ENetMode Mode)
	{
		switch (Mode)
		{
		case NM_Standalone:      return TEXT("Standalone");
		case NM_DedicatedServer: return TEXT("DedicatedServer");
		case NM_ListenServer:    return TEXT("ListenServer");
		case NM_Client:          return TEXT("Client");
		default:                 return TEXT("Unknown");
		}
	}

	FString FormatTime(float Seconds)
	{
		const int32 Total = FMath::CeilToInt(Seconds);
		return FString::Printf(TEXT("%d:%02d"), Total / 60, Total % 60);
	}
}

void ANSHUD::DrawHUD()
{
	Super::DrawHUD();

	const APlayerController* PC = GetOwningPlayerController();
	if (!PC || !Canvas)
	{
		return;
	}

	// 기본 폰트에 한글 글리프가 없을 수 있어 HUD 문구는 영어로 둔다.
	float Y = 20.f;
	auto Line = [this, &Y](const FString& Text, const FLinearColor& Color = FLinearColor::White, float X = 20.f, float Scale = 1.f)
	{
		DrawText(Text, Color, X, Y, nullptr, Scale);
		Y += 18.f * Scale;
	};

	const ANSGameState* GS = GetWorld()->GetGameState<ANSGameState>();
	const ANSCharacter* Character = Cast<ANSCharacter>(PC->GetPawn());

	// ---- 매치 상태 (좌상단) ----
	if (GS)
	{
		FString PhaseText;
		FLinearColor PhaseColor = FLinearColor::White;
		switch (GS->GetPhase())
		{
		case ENSMatchPhase::Waiting:
			PhaseText = FString::Printf(TEXT("Waiting for players  %d / %d"), GS->GetNumHumanPlayers(), GS->GetMinPlayers());
			PhaseColor = FLinearColor::Gray;
			break;
		case ENSMatchPhase::Countdown:
			PhaseText = FString::Printf(TEXT("Starting in %s"), *FormatTime(GS->GetPhaseRemaining()));
			PhaseColor = FLinearColor::Yellow;
			break;
		case ENSMatchPhase::Playing:
			PhaseText = FString::Printf(TEXT("ORE RUSH   %s"), *FormatTime(GS->GetPhaseRemaining()));
			PhaseColor = GS->GetPhaseRemaining() <= 30.f ? FLinearColor::Red : FLinearColor::White;
			break;
		case ENSMatchPhase::Results:
			PhaseText = FString::Printf(TEXT("Winner: %s   (next round in %s)"), *GS->GetLastWinnerName(), *FormatTime(GS->GetPhaseRemaining()));
			PhaseColor = FLinearColor::Yellow;
			break;
		}
		Line(PhaseText, PhaseColor, 20.f, 1.5f);
		Y += 6.f;
	}

	// ---- 내 상태 ----
	if (Character)
	{
		Line(FString::Printf(TEXT("HP  %.0f / %.0f"), Character->GetHealth(), Character->GetMaxHealth()),
		     Character->IsDead() ? FLinearColor::Red : FLinearColor::Green);

		const int32 Carried = Character->GetCarriedOre();
		const bool bFull = Carried >= Character->GetCarryCapacity();
		Line(FString::Printf(TEXT("Ore %d / %d%s"), Carried, Character->GetCarryCapacity(), bFull ? TEXT("  FULL - return to the center!") : TEXT("")),
		     bFull ? FLinearColor::Yellow : FLinearColor::White);

		if (Character->IsDead())
		{
			Line(TEXT("You dropped your ore. Respawning..."), FLinearColor::Red);
		}
	}

	Y += 10.f;
	Line(TEXT("[WASD] Move  [Space] Jump  [E] Gather  [LMB] Attack"), FLinearColor::Gray);
	Line(TEXT("Cube = 1 ore, Sphere (outer ring) = 3 ore, Cone = dropped ore"), FLinearColor::Gray);
	Line(FString::Printf(TEXT("%s   Ping %.0f ms"), NetModeToString(GetNetMode()), PC->PlayerState ? PC->PlayerState->GetPingInMilliseconds() : 0.f),
	     FLinearColor::Gray);

	// ---- 스코어보드 (우상단) ----
	if (GS)
	{
		const float X = Canvas->ClipX - 260.f;
		Y = 20.f;
		Line(TEXT("SCORE"), FLinearColor::Yellow, X, 1.2f);

		const TArray<APlayerState*> Ranking = GS->GetSortedPlayers();
		const int32 Shown = FMath::Min(Ranking.Num(), 10);
		for (int32 i = 0; i < Shown; ++i)
		{
			const APlayerState* PS = Ranking[i];
			const bool bMe = PS == PC->PlayerState;
			Line(FString::Printf(TEXT("%2d. %-16s %4d"), i + 1, *PS->GetPlayerName().Left(16), FMath::RoundToInt(PS->GetScore())),
			     bMe ? FLinearColor::Green : FLinearColor::White, X);
		}
	}
}
