#include "NSGameMode.h"

#include "NetSample.h"
#include "NSBotController.h"
#include "NSCharacter.h"
#include "NSDepositZone.h"
#include "NSGameState.h"
#include "NSHUD.h"
#include "NSInventoryComponent.h"
#include "NSResourceNode.h"
#include "EngineUtils.h"
#include "Engine/World.h"
#include "GameFramework/PlayerState.h"
#include "HAL/IConsoleManager.h"
#include "Kismet/GameplayStatics.h"
#include "Misc/CommandLine.h"
#include "Misc/Parse.h"
#include "TimerManager.h"

ANSGameMode::ANSGameMode()
{
	DefaultPawnClass = ANSCharacter::StaticClass();
	HUDClass = ANSHUD::StaticClass();
	GameStateClass = ANSGameState::StaticClass();
	ResourceNodeClass = ANSResourceNode::StaticClass();
}

void ANSGameMode::InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage)
{
	Super::InitGame(MapName, Options, ErrorMessage);

	// 명령줄(-Nodes=) 과 맵 URL 옵션(?Nodes=) 둘 다 받는다. URL 옵션이 우선.
	const TCHAR* CommandLine = FCommandLine::Get();
	int32 NetOpt = bNetOpt ? 1 : 0;
	int32 RoundTime = FMath::RoundToInt(RoundSeconds);
	FParse::Value(CommandLine, TEXT("Nodes="), NumNodes);
	FParse::Value(CommandLine, TEXT("Bots="), NumBots);
	FParse::Value(CommandLine, TEXT("MinPlayers="), MinPlayers);
	FParse::Value(CommandLine, TEXT("RoundTime="), RoundTime);
	FParse::Value(CommandLine, TEXT("NetOpt="), NetOpt);

	NumNodes = UGameplayStatics::GetIntOption(Options, TEXT("Nodes"), NumNodes);
	NumBots = UGameplayStatics::GetIntOption(Options, TEXT("Bots"), NumBots);
	MinPlayers = UGameplayStatics::GetIntOption(Options, TEXT("MinPlayers"), MinPlayers);
	RoundTime = UGameplayStatics::GetIntOption(Options, TEXT("RoundTime"), RoundTime);
	NetOpt = UGameplayStatics::GetIntOption(Options, TEXT("NetOpt"), NetOpt);

	NumNodes = FMath::Clamp(NumNodes, 0, 20000);
	NumBots = FMath::Clamp(NumBots, 0, 500);
	MinPlayers = FMath::Clamp(MinPlayers, 1, 64);
	RoundSeconds = static_cast<float>(FMath::Clamp(RoundTime, 10, 3600));
	bNetOpt = NetOpt != 0;
}

void ANSGameMode::BeginPlay()
{
	Super::BeginPlay();

	SetupDepositZone();
	SpawnResourceNodes(NumNodes);
	SpawnBots(NumBots);

	if (ANSGameState* GS = GetNSGameState())
	{
		GS->SetMinPlayers_Server(MinPlayers);
	}
	EnterPhase(static_cast<uint8>(ENSMatchPhase::Waiting));
	GetWorldTimerManager().SetTimer(MatchTimer, this, &ANSGameMode::UpdateMatch, 0.25f, true);

	const IConsoleVariable* PushModelCVar = IConsoleManager::Get().FindConsoleVariable(TEXT("net.IsPushModelEnabled"));
	const bool bPushModel = PushModelCVar && PushModelCVar->GetBool();

	UE_LOG(LogNetSample, Display, TEXT("[Server] Ore Rush ready. NetMode=%d Nodes=%d Bots=%d MinPlayers=%d RoundTime=%.0f NetOpt=%s PushModel=%s"),
	       static_cast<int32>(GetNetMode()), NumNodes, NumBots, MinPlayers, RoundSeconds,
	       bNetOpt ? TEXT("ON") : TEXT("OFF"), bPushModel ? TEXT("ON") : TEXT("OFF"));
}

// ---------------------------------------------------------------------------
// Match flow
// ---------------------------------------------------------------------------

ANSGameState* ANSGameMode::GetNSGameState() const
{
	return GetGameState<ANSGameState>();
}

bool ANSGameMode::IsPlaying() const
{
	const ANSGameState* GS = GetNSGameState();
	return GS && GS->GetPhase() == ENSMatchPhase::Playing;
}

void ANSGameMode::EnterPhase(uint8 NewPhaseRaw)
{
	ANSGameState* GS = GetNSGameState();
	if (!GS)
	{
		return;
	}

	const ENSMatchPhase NewPhase = static_cast<ENSMatchPhase>(NewPhaseRaw);
	float Duration = 0.f;
	switch (NewPhase)
	{
	case ENSMatchPhase::Countdown: Duration = CountdownSeconds; break;
	case ENSMatchPhase::Playing:   Duration = RoundSeconds;     break;
	case ENSMatchPhase::Results:   Duration = ResultsSeconds;   break;
	default: break;
	}

	GS->SetPhase_Server(NewPhase, Duration);
	UE_LOG(LogNetSample, Display, TEXT("[Server] Phase -> %d (%.0fs)"), NewPhaseRaw, Duration);
}

void ANSGameMode::UpdateMatch()
{
	ANSGameState* GS = GetNSGameState();
	if (!GS)
	{
		return;
	}

	const bool bEnoughPlayers = GetNumPlayers() >= MinPlayers;   // 사람만 센다 (봇 제외)
	const bool bTimeUp = GS->GetPhaseRemaining() <= 0.f;

	switch (GS->GetPhase())
	{
	case ENSMatchPhase::Waiting:
		if (bEnoughPlayers)
		{
			EnterPhase(static_cast<uint8>(ENSMatchPhase::Countdown));
		}
		break;

	case ENSMatchPhase::Countdown:
		if (!bEnoughPlayers)
		{
			EnterPhase(static_cast<uint8>(ENSMatchPhase::Waiting));
		}
		else if (bTimeUp)
		{
			ResetRound();   // 대기 중에 생긴 변화(이동 등)를 정리하고 동일한 조건에서 시작
			EnterPhase(static_cast<uint8>(ENSMatchPhase::Playing));
		}
		break;

	case ENSMatchPhase::Playing:
		if (bTimeUp)
		{
			FinishRound();
		}
		break;

	case ENSMatchPhase::Results:
		if (bTimeUp)
		{
			ResetRound();
			EnterPhase(static_cast<uint8>(bEnoughPlayers ? ENSMatchPhase::Countdown : ENSMatchPhase::Waiting));
		}
		break;
	}
}

void ANSGameMode::FinishRound()
{
	ANSGameState* GS = GetNSGameState();
	const TArray<APlayerState*> Ranking = GS->GetSortedPlayers();

	FString Winner = TEXT("-");
	if (Ranking.Num() > 0 && Ranking[0]->GetScore() > 0.f)
	{
		Winner = FString::Printf(TEXT("%s (%d)"), *Ranking[0]->GetPlayerName(), FMath::RoundToInt(Ranking[0]->GetScore()));
	}
	GS->SetLastWinner_Server(Winner);

	EnterPhase(static_cast<uint8>(ENSMatchPhase::Results));
	UE_LOG(LogNetSample, Display, TEXT("[Server] Round finished. Winner: %s"), *Winner);
}

void ANSGameMode::ResetRound()
{
	// 맵을 다시 로드하지 않고 서버 상태만 초기화한다 → 접속이 끊기지 않고 바로 다음 라운드
	for (TActorIterator<ANSResourceNode> It(GetWorld()); It; ++It)
	{
		It->ResetForRound_Server();
	}

	for (TActorIterator<ANSCharacter> It(GetWorld()); It; ++It)
	{
		ANSCharacter* Character = *It;
		Character->ResetForRound_Server(PickRespawnLocation(Character->GetController()));
	}

	if (const ANSGameState* GS = GetNSGameState())
	{
		for (APlayerState* PS : GS->PlayerArray)
		{
			if (PS)
			{
				PS->SetScore(0.f);
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

void ANSGameMode::Deposit_Server(ANSCharacter* Character)
{
	if (!IsPlaying() || !Character)
	{
		return;
	}

	const int32 Amount = Character->GetCarriedOre();
	APlayerState* PS = Character->GetPlayerState();
	if (Amount <= 0 || !PS)
	{
		return;
	}

	Character->GetInventory()->Clear_Server();
	PS->SetScore(PS->GetScore() + Amount);

	UE_LOG(LogNetSample, Verbose, TEXT("[Server] %s deposited %d (score %.0f)"), *PS->GetPlayerName(), Amount, PS->GetScore());
}

void ANSGameMode::SpawnDrop_Server(const FVector& Location, int32 Amount)
{
	if (Amount <= 0 || !ResourceNodeClass)
	{
		return;
	}

	FVector Ground = Location;
	FindGround(FVector2D(Location), Ground);

	const FTransform SpawnTransform(FRotator::ZeroRotator, Ground + FVector(0.f, 0.f, 25.f));
	ANSResourceNode* Drop = GetWorld()->SpawnActorDeferred<ANSResourceNode>(
		ResourceNodeClass, SpawnTransform, nullptr, nullptr, ESpawnActorCollisionHandlingMethod::AlwaysSpawn);
	if (Drop)
	{
		Drop->InitNode_Server(ENSNodeKind::Drop, Amount);
		Drop->FinishSpawning(SpawnTransform);
	}
}

FVector ANSGameMode::GetDepositLocation() const
{
	return DepositZone ? DepositZone->GetActorLocation() : FVector::ZeroVector;
}

FVector ANSGameMode::PickRespawnLocation(AController* Controller)
{
	if (const AActor* Start = FindPlayerStart(Controller))
	{
		// 여러 명이 같은 PlayerStart를 받아도 겹치지 않게 약간 흩뿌린다
		const FVector2D Jitter = FMath::RandPointInCircle(200.f);
		return Start->GetActorLocation() + FVector(Jitter, 0.f);
	}
	return GetDepositLocation() + FVector(0.f, 0.f, 200.f);
}

// ---------------------------------------------------------------------------
// World setup
// ---------------------------------------------------------------------------

bool ANSGameMode::FindGround(const FVector2D& XY, FVector& OutLocation) const
{
	FHitResult Hit;
	const FVector Start(XY.X, XY.Y, 10000.f);
	const FVector End(XY.X, XY.Y, -10000.f);
	const FCollisionQueryParams Params(SCENE_QUERY_STAT(NSFindGround), false);

	// 노드나 캐릭터 위가 아니라 바닥(WorldStatic)을 찾는다
	FCollisionObjectQueryParams ObjectParams(ECC_WorldStatic);
	if (GetWorld()->LineTraceSingleByObjectType(Hit, Start, End, ObjectParams, Params))
	{
		const AActor* HitActor = Hit.GetActor();
		if (HitActor && HitActor->IsA<ANSResourceNode>())
		{
			return false;
		}
		OutLocation = Hit.ImpactPoint;
		return true;
	}
	return false;
}

void ANSGameMode::SetupDepositZone()
{
	// 맵에 배치된 것을 우선 사용 (BuildLevel.py가 배치한다). 없으면 원점에 스폰.
	for (TActorIterator<ANSDepositZone> It(GetWorld()); It; ++It)
	{
		DepositZone = *It;
		return;
	}

	FVector Ground(0.f, 0.f, 0.f);
	FindGround(FVector2D::ZeroVector, Ground);
	DepositZone = GetWorld()->SpawnActor<ANSDepositZone>(ANSDepositZone::StaticClass(), Ground + FVector(0.f, 0.f, 200.f), FRotator::ZeroRotator);
}

void ANSGameMode::SpawnResourceNodes(int32 Count)
{
	if (Count <= 0 || !ResourceNodeClass)
	{
		return;
	}

	// 고리(annulus) 면적 ≈ Count × Spacing² 이 되도록 바깥 반지름 결정
	const float Area = Count * NodeSpacing * NodeSpacing;
	OuterRadius = FMath::Sqrt(Area / PI + InnerRadius * InnerRadius);

	const FVector Center = GetDepositLocation();
	const float GoldStartRadius = OuterRadius - (OuterRadius - InnerRadius) * GoldOuterRatio;
	const float GoldenAngle = PI * (3.f - FMath::Sqrt(5.f));   // 해바라기 배치: 고르게 퍼지면서 격자 무늬가 안 생김

	int32 Spawned = 0, Gold = 0, Missed = 0;
	for (int32 i = 0; i < Count; ++i)
	{
		// 면적 균등 분포: r² 를 Inner² ~ Outer² 사이에서 선형으로
		const float T = (i + 0.5f) / Count;
		const float Radius = FMath::Sqrt(FMath::Lerp(InnerRadius * InnerRadius, OuterRadius * OuterRadius, T));
		const float Angle = i * GoldenAngle;
		const FVector2D XY(Center.X + Radius * FMath::Cos(Angle), Center.Y + Radius * FMath::Sin(Angle));

		FVector Ground;
		if (!FindGround(XY, Ground))
		{
			++Missed;
			continue;
		}

		const bool bGold = Radius >= GoldStartRadius && (i % 4 == 0);   // 바깥쪽의 1/4만 금광
		const FTransform SpawnTransform(FRotator::ZeroRotator, Ground + FVector(0.f, 0.f, bGold ? 40.f : 30.f));
		ANSResourceNode* Node = GetWorld()->SpawnActorDeferred<ANSResourceNode>(
			ResourceNodeClass, SpawnTransform, nullptr, nullptr, ESpawnActorCollisionHandlingMethod::AlwaysSpawn);
		if (Node)
		{
			Node->InitNode_Server(bGold ? ENSNodeKind::Gold : ENSNodeKind::Ore, bGold ? 3 : 1);
			Node->FinishSpawning(SpawnTransform);
			++Spawned;
			Gold += bGold ? 1 : 0;
		}
	}

	UE_LOG(LogNetSample, Display, TEXT("[Server] Spawned %d nodes (%d gold) in ring %.0f ~ %.0f"), Spawned, Gold, InnerRadius, OuterRadius);
	if (Missed > 0)
	{
		UE_LOG(LogNetSample, Warning, TEXT("[Server] %d nodes skipped: no ground. Floor must cover radius %.0f (run Scripts/BuildLevel.py)."), Missed, OuterRadius);
	}
}

void ANSGameMode::SpawnBots(int32 Count)
{
	FActorSpawnParameters SpawnParams;
	SpawnParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn;

	int32 Spawned = 0;
	for (int32 i = 0; i < Count; ++i)
	{
		const FVector Location = PickRespawnLocation(nullptr) + FVector(0.f, 0.f, 100.f);
		ANSCharacter* Bot = GetWorld()->SpawnActor<ANSCharacter>(DefaultPawnClass, Location, FRotator::ZeroRotator, SpawnParams);
		if (!Bot)
		{
			continue;
		}

		Bot->MarkAsBot();
		Bot->AIControllerClass = ANSBotController::StaticClass();
		Bot->SpawnDefaultController();   // CharacterMovement가 입력을 처리하려면 컨트롤러가 필요하다

		if (APlayerState* PS = Bot->GetPlayerState())
		{
			PS->SetPlayerName(FString::Printf(TEXT("Bot%02d"), i + 1));
		}
		++Spawned;
	}

	UE_LOG(LogNetSample, Display, TEXT("[Server] Spawned %d bots"), Spawned);
}
