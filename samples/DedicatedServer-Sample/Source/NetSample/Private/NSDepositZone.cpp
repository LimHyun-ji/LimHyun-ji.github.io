#include "NSDepositZone.h"

#include "NSCharacter.h"
#include "NSGameMode.h"
#include "Components/BoxComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/World.h"
#include "TimerManager.h"
#include "UObject/ConstructorHelpers.h"

ANSDepositZone::ANSDepositZone()
{
	PrimaryActorTick.bCanEverTick = false;

	bReplicates = true;          // 서버가 스폰한 경우에도 클라이언트에 보이도록
	SetReplicatingMovement(false);

	Zone = CreateDefaultSubobject<UBoxComponent>(TEXT("Zone"));
	RootComponent = Zone;
	Zone->SetBoxExtent(FVector(400.f, 400.f, 200.f));
	Zone->SetCollisionProfileName(TEXT("OverlapAllDynamic"));
	Zone->SetGenerateOverlapEvents(true);

	static ConstructorHelpers::FObjectFinder<UStaticMesh> CylinderMesh(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
	Pad = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Pad"));
	Pad->SetupAttachment(Zone);
	Pad->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	Pad->SetRelativeLocation(FVector(0.f, 0.f, -195.f));
	Pad->SetRelativeScale3D(FVector(8.f, 8.f, 0.05f));   // 지름 800, 납작한 원판
	if (CylinderMesh.Succeeded())
	{
		Pad->SetStaticMesh(CylinderMesh.Object);
	}
}

void ANSDepositZone::BeginPlay()
{
	Super::BeginPlay();

	if (HasAuthority())
	{
		SetNetDormancy(DORM_DormantAll);   // 바뀌는 값이 없다
		GetWorldTimerManager().SetTimer(CheckTimer, this, &ANSDepositZone::CheckOverlaps_Server, CheckInterval, true);
	}
}

void ANSDepositZone::CheckOverlaps_Server()
{
	ANSGameMode* GameMode = GetWorld()->GetAuthGameMode<ANSGameMode>();
	if (!GameMode)
	{
		return;
	}

	TArray<AActor*> Overlapping;
	Zone->GetOverlappingActors(Overlapping, ANSCharacter::StaticClass());
	for (AActor* Actor : Overlapping)
	{
		ANSCharacter* Character = Cast<ANSCharacter>(Actor);
		if (Character && !Character->IsDead() && Character->GetCarriedOre() > 0)
		{
			GameMode->Deposit_Server(Character);
		}
	}
}
