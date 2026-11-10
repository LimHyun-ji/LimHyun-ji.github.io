#include "NSCharacter.h"

#include "NetSample.h"
#include "NSGameMode.h"
#include "NSGameState.h"
#include "NSInventoryComponent.h"
#include "NSNetUtils.h"
#include "NSResourceNode.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/StaticMeshComponent.h"
#include "DrawDebugHelpers.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "Engine/LocalPlayer.h"
#include "Engine/OverlapResult.h"
#include "Engine/World.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/SpringArmComponent.h"
#include "InputAction.h"
#include "InputMappingContext.h"
#include "InputModifiers.h"
#include "Net/Core/PushModel/PushModel.h"
#include "Net/UnrealNetwork.h"
#include "TimerManager.h"
#include "UObject/ConstructorHelpers.h"

namespace
{
	const FName OreItemId(TEXT("Ore"));
}

ANSCharacter::ANSCharacter()
{
	PrimaryActorTick.bCanEverTick = true;

	// 3인칭 이동
	bUseControllerRotationYaw = false;
	GetCharacterMovement()->bOrientRotationToMovement = true;
	GetCharacterMovement()->RotationRate = FRotator(0.f, 540.f, 0.f);

	CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
	CameraBoom->SetupAttachment(RootComponent);
	CameraBoom->TargetArmLength = 450.f;
	CameraBoom->bUsePawnControlRotation = true;

	FollowCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FollowCamera"));
	FollowCamera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);

	// 엔진 기본 도형만 사용 → 별도 에셋 없이 바로 실행 가능
	static ConstructorHelpers::FObjectFinder<UStaticMesh> CylinderMesh(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
	BodyMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("BodyMesh"));
	BodyMesh->SetupAttachment(RootComponent);
	BodyMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	BodyMesh->SetRelativeScale3D(FVector(0.68f, 0.68f, 1.76f));   // 기본 캡슐(반지름 34, 반높이 88)에 맞춤
	if (CylinderMesh.Succeeded())
	{
		BodyMesh->SetStaticMesh(CylinderMesh.Object);
	}

	Inventory = CreateDefaultSubobject<UNSInventoryComponent>(TEXT("Inventory"));
}

void ANSCharacter::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
	Super::GetLifetimeReplicatedProps(OutLifetimeProps);

	// 체력은 주변 모두가 봐야 하므로 COND_None. 바뀔 때만 보내도록 Push Model.
	FDoRepLifetimeParams Params;
	Params.bIsPushBased = true;
	DOREPLIFETIME_WITH_PARAMS_FAST(ANSCharacter, Health, Params);
}

void ANSCharacter::BeginPlay()
{
	Super::BeginPlay();

	if (HasAuthority())
	{
		SpawnLocation = GetActorLocation();
		SetHealth_Server(MaxHealth);

		const ANSGameMode* GameMode = GetWorld()->GetAuthGameMode<ANSGameMode>();
		if (GameMode && GameMode->IsNetOptEnabled())
		{
			// 캐릭터는 이동이 잦아 Dormancy 대신 컬링 거리와 갱신 빈도로 조절한다.
			NSNet::SetCullDistance(this, 10000.f);
			NSNet::SetUpdateRates(this, 30.f, 10.f);
		}
	}
}

void ANSCharacter::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);

	if (bIsBot && HasAuthority() && !IsDead())
	{
		TickBot(DeltaSeconds);
	}
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

namespace
{
	void MapKey(UInputMappingContext* Context, UInputAction* Action, const FKey& Key, UObject* Outer,
	            bool bSwizzle = false, bool bNegateX = false, bool bNegateY = false)
	{
		FEnhancedActionKeyMapping& Mapping = Context->MapKey(Action, Key);
		if (bSwizzle)
		{
			Mapping.Modifiers.Add(NewObject<UInputModifierSwizzleAxis>(Outer));   // X → Y (YXZ)
		}
		if (bNegateX || bNegateY)
		{
			UInputModifierNegate* Negate = NewObject<UInputModifierNegate>(Outer);
			Negate->bX = bNegateX;
			Negate->bY = bNegateY;
			Negate->bZ = false;
			Mapping.Modifiers.Add(Negate);
		}
	}
}

void ANSCharacter::BuildInputMappings()
{
	if (MappingContext)
	{
		return;
	}

	auto MakeAction = [this](const TCHAR* Name, EInputActionValueType Type)
	{
		UInputAction* Action = NewObject<UInputAction>(this, Name);
		Action->ValueType = Type;
		return Action;
	};

	MoveAction = MakeAction(TEXT("IA_Move"), EInputActionValueType::Axis2D);
	LookAction = MakeAction(TEXT("IA_Look"), EInputActionValueType::Axis2D);
	JumpAction = MakeAction(TEXT("IA_Jump"), EInputActionValueType::Boolean);
	InteractAction = MakeAction(TEXT("IA_Interact"), EInputActionValueType::Boolean);
	AttackAction = MakeAction(TEXT("IA_Attack"), EInputActionValueType::Boolean);

	MappingContext = NewObject<UInputMappingContext>(this, TEXT("IMC_NetSample"));

	// Move: X = 오른쪽, Y = 앞. 키 입력은 (1,0)으로 들어오고 Modifier는 추가한 순서대로 적용된다.
	MapKey(MappingContext, MoveAction, EKeys::W, this, /*Swizzle*/ true);                          // (0, 1)
	MapKey(MappingContext, MoveAction, EKeys::S, this, /*Swizzle*/ true, false, /*NegY*/ true);    // (0,-1)
	MapKey(MappingContext, MoveAction, EKeys::D, this);                                            // (1, 0)
	MapKey(MappingContext, MoveAction, EKeys::A, this, false, /*NegX*/ true);                      // (-1,0)

	MapKey(MappingContext, LookAction, EKeys::Mouse2D, this, false, false, /*NegY*/ true);
	MapKey(MappingContext, JumpAction, EKeys::SpaceBar, this);
	MapKey(MappingContext, InteractAction, EKeys::E, this);
	MapKey(MappingContext, AttackAction, EKeys::LeftMouseButton, this);
}

void ANSCharacter::PawnClientRestart()
{
	Super::PawnClientRestart();

	BuildInputMappings();

	if (const APlayerController* PC = Cast<APlayerController>(GetController()))
	{
		if (UEnhancedInputLocalPlayerSubsystem* Subsystem = ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(PC->GetLocalPlayer()))
		{
			Subsystem->ClearAllMappings();
			Subsystem->AddMappingContext(MappingContext, 0);
		}
	}
}

void ANSCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);

	BuildInputMappings();

	if (UEnhancedInputComponent* Input = Cast<UEnhancedInputComponent>(PlayerInputComponent))
	{
		Input->BindAction(MoveAction, ETriggerEvent::Triggered, this, &ANSCharacter::OnMove);
		Input->BindAction(LookAction, ETriggerEvent::Triggered, this, &ANSCharacter::OnLook);
		Input->BindAction(JumpAction, ETriggerEvent::Started, this, &ACharacter::Jump);
		Input->BindAction(JumpAction, ETriggerEvent::Completed, this, &ACharacter::StopJumping);
		Input->BindAction(InteractAction, ETriggerEvent::Started, this, &ANSCharacter::OnInteract);
		Input->BindAction(AttackAction, ETriggerEvent::Started, this, &ANSCharacter::OnAttack);
	}
	else
	{
		UE_LOG(LogNetSample, Error, TEXT("Input component is not UEnhancedInputComponent. Check Config/DefaultInput.ini."));
	}
}

void ANSCharacter::OnMove(const FInputActionValue& Value)
{
	if (IsDead() || !Controller)
	{
		return;
	}

	const FVector2D Axis = Value.Get<FVector2D>();
	const FRotator YawRotation(0.f, Controller->GetControlRotation().Yaw, 0.f);
	AddMovementInput(FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X), Axis.Y);
	AddMovementInput(FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y), Axis.X);
}

void ANSCharacter::OnLook(const FInputActionValue& Value)
{
	const FVector2D Axis = Value.Get<FVector2D>();
	AddControllerYawInput(Axis.X);
	AddControllerPitchInput(Axis.Y);
}

void ANSCharacter::OnInteract()
{
	if (!IsDead() && IsMatchPlaying_Local())
	{
		ServerInteract();
	}
}

void ANSCharacter::OnAttack()
{
	if (IsDead() || !IsMatchPlaying_Local())
	{
		return;
	}

	// 클라이언트 측에서도 쿨다운을 걸어 불필요한 RPC를 줄인다 (최종 판정은 서버).
	const double Now = GetWorld()->GetTimeSeconds();
	if (Now - LastAttackLocalTime < AttackCooldown)
	{
		return;
	}
	LastAttackLocalTime = Now;

	// 예측 연출: 서버 왕복을 기다리지 않고 내 화면에서는 즉시 재생
	if (!HasAuthority())
	{
		PlayAttackFX(GetAttackOrigin());
	}

	ServerAttack();
}

// ---------------------------------------------------------------------------
// Server RPC
// ---------------------------------------------------------------------------

void ANSCharacter::ServerInteract_Implementation()
{
	if (IsDead() || !IsMatchPlaying_Server())
	{
		return;
	}

	const int32 FreeSpace = CarryCapacity - GetCarriedOre();
	if (FreeSpace <= 0)
	{
		RejectRequest(TEXT("bag full"));
		return;
	}

	// 서버가 직접 주변을 조회한다. 클라이언트가 보낸 좌표나 대상은 사용하지 않는다.
	TArray<FOverlapResult> Overlaps;
	FCollisionObjectQueryParams ObjectParams;
	ObjectParams.AddObjectTypesToQuery(ECC_WorldStatic);
	ObjectParams.AddObjectTypesToQuery(ECC_WorldDynamic);
	const FCollisionQueryParams QueryParams(SCENE_QUERY_STAT(NSInteract), false, this);

	GetWorld()->OverlapMultiByObjectType(Overlaps, GetActorLocation(), FQuat::Identity, ObjectParams,
	                                     FCollisionShape::MakeSphere(InteractRange), QueryParams);

	TArray<ANSResourceNode*> Candidates;
	for (const FOverlapResult& Overlap : Overlaps)
	{
		ANSResourceNode* Node = Cast<ANSResourceNode>(Overlap.GetActor());
		if (Node && Node->IsAvailable())
		{
			Candidates.AddUnique(Node);
		}
	}

	// 가까운 순서로 시도. 금광(3개)을 담을 공간이 없으면 다음으로 가까운 노드를 캔다.
	const FVector MyLocation = GetActorLocation();
	Candidates.Sort([&MyLocation](const ANSResourceNode& A, const ANSResourceNode& B)
	{
		return FVector::DistSquared(A.GetActorLocation(), MyLocation) < FVector::DistSquared(B.GetActorLocation(), MyLocation);
	});

	for (ANSResourceNode* Node : Candidates)
	{
		const int32 Taken = Node->Harvest_Server(this, FreeSpace);
		if (Taken > 0)
		{
			Inventory->AddItem_Server(OreItemId, Taken);
			return;
		}
	}

	RejectRequest(TEXT("no node in range"));
}

void ANSCharacter::ServerAttack_Implementation()
{
	if (IsDead() || !IsMatchPlaying_Server())
	{
		return;
	}

	// 쿨다운은 서버 시간으로 판정. 지연 편차를 감안해 10% 여유를 둔다.
	const double Now = GetWorld()->GetTimeSeconds();
	if (Now - LastAttackServerTime < AttackCooldown * 0.9f)
	{
		RejectRequest(TEXT("attack cooldown"));
		return;
	}
	LastAttackServerTime = Now;

	const FVector Origin = GetAttackOrigin();

	TArray<FOverlapResult> Overlaps;
	const FCollisionQueryParams QueryParams(SCENE_QUERY_STAT(NSAttack), false, this);
	GetWorld()->OverlapMultiByObjectType(Overlaps, Origin, FQuat::Identity, FCollisionObjectQueryParams(ECC_Pawn),
	                                     FCollisionShape::MakeSphere(AttackRadius), QueryParams);

	TSet<ANSCharacter*> Hit;   // 한 캐릭터의 여러 컴포넌트가 겹쳐도 한 번만 맞도록
	for (const FOverlapResult& Overlap : Overlaps)
	{
		ANSCharacter* Target = Cast<ANSCharacter>(Overlap.GetActor());
		if (Target && Target != this && !Target->IsDead() && !Hit.Contains(Target))
		{
			Hit.Add(Target);
			Target->ApplyDamage_Server(AttackDamage, GetController());
		}
	}

	MulticastPlayAttackFX(Origin);
}

void ANSCharacter::MulticastPlayAttackFX_Implementation(FVector_NetQuantize Origin)
{
	if (GetNetMode() == NM_DedicatedServer)
	{
		return;   // 데디케이티드 서버는 화면이 없다
	}
	if (IsLocallyControlled() && !HasAuthority())
	{
		return;   // 소유 클라이언트는 OnAttack에서 이미 예측 재생했다
	}
	PlayAttackFX(Origin);
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

void ANSCharacter::ApplyDamage_Server(float Amount, AController* DamageInstigator)
{
	if (!HasAuthority() || IsDead())
	{
		return;
	}

	SetHealth_Server(Health - Amount);
	UE_LOG(LogNetSample, Verbose, TEXT("[Server] %s took %.0f from %s -> %.0f"),
	       *GetName(), Amount, *GetNameSafe(DamageInstigator), Health);

	if (IsDead())
	{
		HandleDeath_Server();
	}
}

void ANSCharacter::SetHealth_Server(float NewHealth)
{
	const float Clamped = FMath::Clamp(NewHealth, 0.f, MaxHealth);
	if (FMath::IsNearlyEqual(Clamped, Health))
	{
		return;
	}

	Health = Clamped;
	MARK_PROPERTY_DIRTY_FROM_NAME(ANSCharacter, Health, this);
	ApplyDeadState();   // 서버 측 반영 (OnRep은 클라이언트에서만 불린다)
}

void ANSCharacter::OnRep_Health(float OldHealth)
{
	const bool bWasDead = OldHealth <= 0.f;
	if (bWasDead != IsDead())
	{
		ApplyDeadState();
	}
}

void ANSCharacter::HandleDeath_Server()
{
	// 들고 있던 광석은 그 자리에 떨군다 → 다른 플레이어가 주워 갈 수 있다
	const int32 Carried = GetCarriedOre();
	if (Carried > 0)
	{
		if (ANSGameMode* GameMode = GetWorld()->GetAuthGameMode<ANSGameMode>())
		{
			GameMode->SpawnDrop_Server(GetActorLocation(), Carried);
		}
		Inventory->Clear_Server();
	}

	GetWorldTimerManager().SetTimer(RespawnTimer, this, &ANSCharacter::Respawn_Server, RespawnDelay, false);
}

void ANSCharacter::Respawn_Server()
{
	ANSGameMode* GameMode = GetWorld()->GetAuthGameMode<ANSGameMode>();
	const FVector Location = GameMode ? GameMode->PickRespawnLocation(GetController()) : SpawnLocation;

	TeleportTo(Location, GetActorRotation());
	SetHealth_Server(MaxHealth);
}

void ANSCharacter::ResetForRound_Server(const FVector& Location)
{
	if (!HasAuthority())
	{
		return;
	}

	GetWorldTimerManager().ClearTimer(RespawnTimer);
	Inventory->Clear_Server();
	LastAttackServerTime = -1000.0;

	TeleportTo(Location, GetActorRotation());
	SetHealth_Server(MaxHealth);
}

void ANSCharacter::ApplyDeadState()
{
	const bool bDead = IsDead();
	BodyMesh->SetVisibility(!bDead);

	if (bDead)
	{
		GetCharacterMovement()->DisableMovement();
	}
	else if (GetCharacterMovement()->MovementMode == MOVE_None)
	{
		GetCharacterMovement()->SetMovementMode(MOVE_Walking);
	}
}

// ---------------------------------------------------------------------------
// Bot (부하 테스트)
// ---------------------------------------------------------------------------

void ANSCharacter::TickBot(float DeltaSeconds)
{
	const ANSGameMode* GameMode = GetWorld()->GetAuthGameMode<ANSGameMode>();
	if (!GameMode || !GameMode->IsPlaying())
	{
		return;
	}

	const FVector MyLocation = GetActorLocation();
	const FVector ToDeposit = GameMode->GetDepositLocation() - MyLocation;

	// 판단은 0.5초마다. 매 프레임 RPC를 만들지 않는다.
	BotDecisionTimer -= DeltaSeconds;
	if (BotDecisionTimer <= 0.f)
	{
		BotDecisionTimer = 0.5f;

		if (ANSCharacter* Enemy = FindNearbyEnemy_Server())
		{
			const FVector ToEnemy = Enemy->GetActorLocation() - MyLocation;
			SetActorRotation(FRotator(0.f, ToEnemy.Rotation().Yaw, 0.f));
			if (FMath::FRand() < 0.5f)
			{
				ServerAttack();
			}
		}

		ServerInteract();   // 주변에 노드가 있으면 캔다 (판정은 서버 로직 그대로)
	}

	// 이동 방향: 가방이 70% 이상이면 납품, 맵 밖으로 나가면 중앙, 그 외엔 배회
	BotRetargetTimer -= DeltaSeconds;
	if (GetCarriedOre() >= FMath::CeilToInt(CarryCapacity * 0.7f) || ToDeposit.Size2D() > GameMode->GetPlayRadius())
	{
		BotDirection = FVector2D(ToDeposit.GetSafeNormal2D());
	}
	else if (BotRetargetTimer <= 0.f)
	{
		const float Angle = FMath::FRandRange(0.f, 2.f * PI);
		BotDirection = FVector2D(FMath::Cos(Angle), FMath::Sin(Angle));
		BotRetargetTimer = FMath::FRandRange(2.f, 5.f);
	}

	AddMovementInput(FVector(BotDirection, 0.f));
}

ANSCharacter* ANSCharacter::FindNearbyEnemy_Server() const
{
	TArray<FOverlapResult> Overlaps;
	const FCollisionQueryParams QueryParams(SCENE_QUERY_STAT(NSFindEnemy), false, this);
	GetWorld()->OverlapMultiByObjectType(Overlaps, GetActorLocation(), FQuat::Identity, FCollisionObjectQueryParams(ECC_Pawn),
	                                     FCollisionShape::MakeSphere(AttackRange + AttackRadius), QueryParams);

	for (const FOverlapResult& Overlap : Overlaps)
	{
		ANSCharacter* Other = Cast<ANSCharacter>(Overlap.GetActor());
		if (Other && Other != this && !Other->IsDead())
		{
			return Other;
		}
	}
	return nullptr;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

FVector ANSCharacter::GetAttackOrigin() const
{
	return GetActorLocation() + GetActorForwardVector() * AttackRange * 0.5f;
}

void ANSCharacter::PlayAttackFX(const FVector& Origin) const
{
#if ENABLE_DRAW_DEBUG
	DrawDebugSphere(GetWorld(), Origin, AttackRadius, 12, FColor::Red, false, 0.25f);
#endif
}

int32 ANSCharacter::GetCarriedOre() const
{
	return Inventory ? Inventory->GetCount(OreItemId) : 0;
}

bool ANSCharacter::IsMatchPlaying_Server() const
{
	const ANSGameMode* GameMode = GetWorld()->GetAuthGameMode<ANSGameMode>();
	return GameMode && GameMode->IsPlaying();
}

bool ANSCharacter::IsMatchPlaying_Local() const
{
	// 클라이언트에서 불필요한 RPC를 보내지 않기 위한 사전 확인. 최종 판정은 서버(IsMatchPlaying_Server).
	const ANSGameState* GameState = GetWorld()->GetGameState<ANSGameState>();
	return GameState == nullptr || GameState->GetPhase() == ENSMatchPhase::Playing;
}

void ANSCharacter::RejectRequest(const TCHAR* Reason)
{
	if (bIsBot)
	{
		return;   // 봇은 매 판단마다 채집을 시도하므로 거절 집계에서 제외
	}
	++RejectedRequestCount;
	UE_LOG(LogNetSample, Verbose, TEXT("[Server] Request rejected: %s (%s)"), *GetName(), Reason);
}
