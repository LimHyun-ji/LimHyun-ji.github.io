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

	static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeMesh(TEXT("/Engine/BasicShapes/Cube.Cube"));

	Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
	RootComponent = Mesh;
	Mesh->SetRelativeScale3D(FVector(0.6f));
	Mesh->SetCollisionProfileName(UCollisionProfile::BlockAll_ProfileName);
	if (CubeMesh.Succeeded())
	{
		Mesh->SetStaticMesh(CubeMesh.Object);
	}
}

void ANSResourceNode::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
	Super::GetLifetimeReplicatedProps(OutLifetimeProps);

	FDoRepLifetimeParams Params;
	Params.bIsPushBased = true;
	DOREPLIFETIME_WITH_PARAMS_FAST(ANSResourceNode, bAvailable, Params);
}

void ANSResourceNode::BeginPlay()
{
	Super::BeginPlay();

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

bool ANSResourceNode::TryHarvest(AActor* Harvester)
{
	if (!HasAuthority() || !bAvailable)
	{
		return false;
	}

	SetAvailable_Server(false);
	GetWorldTimerManager().SetTimer(RespawnTimer, this, &ANSResourceNode::Respawn_Server, RespawnSeconds, false);

	UE_LOG(LogNetSample, Verbose, TEXT("[Server] %s harvested by %s"), *GetName(), *GetNameSafe(Harvester));
	return true;
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

	ApplyVisual();   // 리슨 서버 / 서버 측 충돌 갱신 (OnRep은 클라이언트에서만 불린다)
}

void ANSResourceNode::OnRep_Available()
{
	ApplyVisual();
}

void ANSResourceNode::ApplyVisual()
{
	Mesh->SetVisibility(bAvailable);
	Mesh->SetCollisionEnabled(bAvailable ? ECollisionEnabled::QueryAndPhysics : ECollisionEnabled::NoCollision);
}
