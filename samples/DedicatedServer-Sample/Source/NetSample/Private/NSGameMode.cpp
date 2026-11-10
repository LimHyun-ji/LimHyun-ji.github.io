#include "NSGameMode.h"

#include "NetSample.h"
#include "NSCharacter.h"
#include "NSHUD.h"
#include "NSResourceNode.h"
#include "AIController.h"
#include "Engine/World.h"
#include "HAL/IConsoleManager.h"
#include "Kismet/GameplayStatics.h"
#include "Misc/CommandLine.h"
#include "Misc/Parse.h"

ANSGameMode::ANSGameMode()
{
	DefaultPawnClass = ANSCharacter::StaticClass();
	HUDClass = ANSHUD::StaticClass();
	ResourceNodeClass = ANSResourceNode::StaticClass();
}

void ANSGameMode::InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage)
{
	Super::InitGame(MapName, Options, ErrorMessage);

	// 명령줄(-Nodes=) 과 맵 URL 옵션(?Nodes=) 둘 다 받는다. URL 옵션이 우선.
	const TCHAR* CommandLine = FCommandLine::Get();
	FParse::Value(CommandLine, TEXT("Nodes="), NumNodes);
	FParse::Value(CommandLine, TEXT("Bots="), NumBots);
	int32 NetOpt = bNetOpt ? 1 : 0;
	FParse::Value(CommandLine, TEXT("NetOpt="), NetOpt);

	NumNodes = UGameplayStatics::GetIntOption(Options, TEXT("Nodes"), NumNodes);
	NumBots = UGameplayStatics::GetIntOption(Options, TEXT("Bots"), NumBots);
	NetOpt = UGameplayStatics::GetIntOption(Options, TEXT("NetOpt"), NetOpt);

	NumNodes = FMath::Clamp(NumNodes, 0, 20000);
	NumBots = FMath::Clamp(NumBots, 0, 500);
	bNetOpt = NetOpt != 0;
}

void ANSGameMode::BeginPlay()
{
	Super::BeginPlay();

	SpawnResourceNodes(NumNodes);
	SpawnBots(NumBots);

	const IConsoleVariable* PushModelCVar = IConsoleManager::Get().FindConsoleVariable(TEXT("net.IsPushModelEnabled"));
	const bool bPushModel = PushModelCVar && PushModelCVar->GetBool();

	UE_LOG(LogNetSample, Display, TEXT("[Server] NetMode=%d  Nodes=%d  Bots=%d  NetOpt=%s  PushModel=%s"),
	       static_cast<int32>(GetNetMode()), NumNodes, NumBots,
	       bNetOpt ? TEXT("ON") : TEXT("OFF"), bPushModel ? TEXT("ON") : TEXT("OFF"));
}

bool ANSGameMode::FindGround(const FVector2D& XY, FVector& OutLocation) const
{
	FHitResult Hit;
	const FVector Start(XY.X, XY.Y, 10000.f);
	const FVector End(XY.X, XY.Y, -10000.f);
	const FCollisionQueryParams Params(SCENE_QUERY_STAT(NSFindGround), false);

	if (GetWorld()->LineTraceSingleByChannel(Hit, Start, End, ECC_WorldStatic, Params))
	{
		OutLocation = Hit.ImpactPoint;
		return true;
	}
	return false;
}

void ANSGameMode::SpawnResourceNodes(int32 Count)
{
	if (Count <= 0 || !ResourceNodeClass)
	{
		return;
	}

	// 원점을 중심으로 정사각형 격자 배치
	const int32 Side = FMath::CeilToInt(FMath::Sqrt(static_cast<float>(Count)));
	GridHalfExtent = (Side - 1) * NodeSpacing * 0.5f;

	FActorSpawnParameters SpawnParams;
	SpawnParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;

	int32 Spawned = 0;
	int32 Missed = 0;
	for (int32 i = 0; i < Count; ++i)
	{
		const FVector2D XY((i % Side) * NodeSpacing - GridHalfExtent, (i / Side) * NodeSpacing - GridHalfExtent);

		FVector Ground;
		if (!FindGround(XY, Ground))
		{
			++Missed;   // 바닥이 없는 곳 (바닥 크기가 격자보다 작음)
			continue;
		}

		const FVector Location = Ground + FVector(0.f, 0.f, 30.f);   // 큐브(0.6배) 반높이
		if (GetWorld()->SpawnActor<ANSResourceNode>(ResourceNodeClass, Location, FRotator::ZeroRotator, SpawnParams))
		{
			++Spawned;
		}
	}

	UE_LOG(LogNetSample, Display, TEXT("[Server] Spawned %d resource nodes (grid %dx%d, spacing %.0f)"), Spawned, Side, Side, NodeSpacing);
	if (Missed > 0)
	{
		UE_LOG(LogNetSample, Warning, TEXT("[Server] %d nodes skipped: no ground. Scale the Floor up to cover the grid (about %.0f x %.0f)."),
		       Missed, GridHalfExtent * 2.f, GridHalfExtent * 2.f);
	}
}

void ANSGameMode::SpawnBots(int32 Count)
{
	if (Count <= 0)
	{
		return;
	}

	const float Extent = FMath::Max(GridHalfExtent, 2000.f);

	FActorSpawnParameters SpawnParams;
	SpawnParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn;

	int32 Spawned = 0;
	for (int32 i = 0; i < Count; ++i)
	{
		const FVector2D XY(FMath::FRandRange(-Extent, Extent), FMath::FRandRange(-Extent, Extent));
		FVector Ground;
		if (!FindGround(XY, Ground))
		{
			continue;
		}

		ANSCharacter* Bot = GetWorld()->SpawnActor<ANSCharacter>(DefaultPawnClass, Ground + FVector(0.f, 0.f, 100.f), FRotator::ZeroRotator, SpawnParams);
		if (!Bot)
		{
			continue;
		}

		Bot->MarkAsBot();
		Bot->AIControllerClass = AAIController::StaticClass();
		Bot->SpawnDefaultController();   // CharacterMovement가 입력을 처리하려면 컨트롤러가 필요하다
		++Spawned;
	}

	UE_LOG(LogNetSample, Display, TEXT("[Server] Spawned %d bots"), Spawned);
}
