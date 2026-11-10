#include "NSResourceNode.h"

#include "NetSample.h"
#include "NSGameMode.h"
#include "NSNetUtils.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/CollisionProfile.h"
#include "Engine/World.h"
#include "Net/Core/PushModel/PushModel.h"
#include "Net/UnrealNetwork.h"
#include "TimerManager.h"
#include "UObject/ConstructorHelpers.h"

ANSResourceNode::ANSResourceNode()
{
	PrimaryActorTick.bCanEverTick = false;

	bReplicates = true;
	SetReplicatingMovement(false);   // 움직이지 않는 오브젝트: 위치 복제 불필요

	// 머티리얼 없이 모양으로 종류를 구분한다: 광석 = 큐브, 금 = 구, 떨군 더미 = 원뿔
	static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeAsset(TEXT("/Engine/BasicShapes/Cube.Cube"));
	static ConstructorHelpers::FObjectFinder<UStaticMesh> SphereAsset(TEXT("/Engine/BasicShapes/Sphere.Sphere"));
	static ConstructorHelpers::FObjectFinder<UStaticMesh> ConeAsset(TEXT("/Engine/BasicShapes/Cone.Cone"));
	OreMesh = CubeAsset.Object;
	GoldMesh = SphereAsset.Object;
	DropMesh = ConeAsset.Object;

	Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
	RootComponent = Mesh;
	Mesh->SetRelativeScale3D(FVector(0.6f));
	Mesh->SetCollisionProfileName(UCollisionProfile::BlockAll_ProfileName);
	Mesh->SetStaticMesh(OreMesh);
}

void ANSResourceNode::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
	Super::GetLifetimeReplicatedProps(OutLifetimeProps);

	FDoRepLifetimeParams InitialOnly;
	InitialOnly.Condition = COND_InitialOnly;
	InitialOnly.bIsPushBased = true;
	DOREPLIFETIME_WITH_PARAMS_FAST(ANSResourceNode, Kind, InitialOnly);

	FDoRepLifetimeParams PushBased;
	PushBased.bIsPushBased = true;
	DOREPLIFETIME_WITH_PARAMS_FAST(ANSResourceNode, bAvailable, PushBased);
}

void ANSResourceNode::InitNode_Server(ENSNodeKind InKind, int32 InYield)
{
	Kind = InKind;
	Yield = FMath::Max(1, InYield);
	MARK_PROPERTY_DIRTY_FROM_NAME(ANSResourceNode, Kind, this);
}

void ANSResourceNode::BeginPlay()
{
	Super::BeginPlay();

	// 클라이언트에서는 최초 복제값(Kind)이 BeginPlay 전에 적용되어 있다
	ApplyKindVisual();

	if (!HasAuthority())
	{
		return;
	}

	const ANSGameMode* GameMode = GetWorld()->GetAuthGameMode<ANSGameMode>();
	const bool bNetOpt = GameMode == nullptr || GameMode->IsNetOptEnabled();

	if (bNetOpt)
	{
		// 최적화 프로필: 평소엔 잠들어 있다가 상태가 바뀔 때만 깨어난다.
		// (처음 채널이 열릴 때는 한 번 복제된 뒤 잠든다)
		SetNetDormancy(DORM_DormantAll);
		NSNet::SetCullDistance(this, OptimizedCullDistance);
		NSNet::SetUpdateRates(this, 2.f, 1.f);
	}
	else
	{
		// 비교용 기준선: 엔진 기본값 그대로 (Awake, 컬링 15000, 100Hz)
		SetNetDormancy(DORM_Awake);
	}
}

int32 ANSResourceNode::Harvest_Server(AActor* Harvester, int32 FreeSpace)
{
	if (!HasAuthority() || !bAvailable || FreeSpace <= 0)
	{
		return 0;
	}

	if (Kind == ENSNodeKind::Drop)
	{
		const int32 Taken = FMath::Min(Yield, FreeSpace);
		Yield -= Taken;
		if (Yield <= 0)
		{
			// 남은 게 없으면 제거. Dormant 액터도 Destroy는 클라이언트에 정상 전달된다.
			SetAvailable_Server(false);
			Destroy();
		}
		return Taken;
	}

	if (Yield > FreeSpace)
	{
		return 0;   // 가방이 부족하면 거절 (일부만 캐고 나머지를 버리는 일이 없도록)
	}

	SetAvailable_Server(false);
	GetWorldTimerManager().SetTimer(RespawnTimer, this, &ANSResourceNode::Respawn_Server, RespawnSeconds, false);

	UE_LOG(LogNetSample, Verbose, TEXT("[Server] %s harvested by %s"), *GetName(), *GetNameSafe(Harvester));
	return Yield;
}

void ANSResourceNode::ResetForRound_Server()
{
	if (Kind == ENSNodeKind::Drop)
	{
		Destroy();
		return;
	}

	GetWorldTimerManager().ClearTimer(RespawnTimer);
	SetAvailable_Server(true);
}

void ANSResourceNode::Respawn_Server()
{
	SetAvailable_Server(true);
}

void ANSResourceNode::SetAvailable_Server(bool bNewAvailable)
{
	if (bAvailable == bNewAvailable)
	{
		return;
	}

	// Dormant 액터는 값만 바꾸면 클라이언트에 전달되지 않는다.
	// FlushNetDormancy()로 이번 변경분만 내보내고, Dormancy 설정(DormantAll)은 유지되어 다시 잠든다.
	if (NetDormancy > DORM_Awake)
	{
		FlushNetDormancy();
	}

	bAvailable = bNewAvailable;
	MARK_PROPERTY_DIRTY_FROM_NAME(ANSResourceNode, bAvailable, this);

	ApplyAvailableVisual();   // 서버 측 충돌 갱신 (OnRep은 클라이언트에서만 불린다)
}

void ANSResourceNode::OnRep_Kind()
{
	ApplyKindVisual();
}

void ANSResourceNode::OnRep_Available()
{
	ApplyAvailableVisual();
}

void ANSResourceNode::ApplyKindVisual()
{
	switch (Kind)
	{
	case ENSNodeKind::Gold:
		Mesh->SetStaticMesh(GoldMesh);
		Mesh->SetRelativeScale3D(FVector(0.8f));
		break;
	case ENSNodeKind::Drop:
		Mesh->SetStaticMesh(DropMesh);
		Mesh->SetRelativeScale3D(FVector(0.5f));
		Mesh->SetCollisionResponseToChannel(ECC_Pawn, ECR_Ignore);   // 떨군 더미는 길을 막지 않는다
		break;
	default:
		Mesh->SetStaticMesh(OreMesh);
		Mesh->SetRelativeScale3D(FVector(0.6f));
		break;
	}
}

void ANSResourceNode::ApplyAvailableVisual()
{
	Mesh->SetVisibility(bAvailable);
	Mesh->SetCollisionEnabled(bAvailable ? ECollisionEnabled::QueryAndPhysics : ECollisionEnabled::NoCollision);
}
