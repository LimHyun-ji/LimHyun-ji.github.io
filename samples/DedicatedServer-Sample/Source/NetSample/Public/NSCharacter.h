#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "NSCharacter.generated.h"

class UCameraComponent;
class UInputAction;
class UInputMappingContext;
class UNSInventoryComponent;
class USpringArmComponent;
class UStaticMeshComponent;
struct FInputActionValue;

/**
 * 플레이어 / 부하 테스트 봇 공용 캐릭터.
 *
 * 서버 권위(Server-Authoritative) 원칙:
 *  - 클라이언트는 "채집 / 공격하고 싶다"는 의도만 RPC로 보낸다. 대상, 데미지, 결과는 보내지 않는다.
 *  - 서버가 대상 탐색, 거리 및 쿨다운 검증, 결과 적용을 모두 수행하고 상태(Health, Inventory)를 복제한다.
 *  - 공격 이펙트만 소유 클라이언트에서 즉시 재생(예측)하고, 나머지 클라이언트는 Unreliable Multicast로 받는다.
 */
UCLASS()
class NETSAMPLE_API ANSCharacter : public ACharacter
{
	GENERATED_BODY()

public:
	ANSCharacter();

	virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;
	virtual void Tick(float DeltaSeconds) override;
	virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;
	virtual void PawnClientRestart() override;

	float GetHealth() const { return Health; }
	float GetMaxHealth() const { return MaxHealth; }
	bool IsDead() const { return Health <= 0.f; }
	UNSInventoryComponent* GetInventory() const { return Inventory; }
	int32 GetCarriedOre() const;
	int32 GetCarryCapacity() const { return CarryCapacity; }

	/** 서버 전용. GameMode가 봇을 스폰할 때 호출한다. */
	void MarkAsBot() { bIsBot = true; }

	/** 서버 전용. */
	void ApplyDamage_Server(float Amount, AController* DamageInstigator);

	/** 서버 전용. 새 라운드: 가방 비우기, 체력 회복, 지정 위치로 이동. */
	void ResetForRound_Server(const FVector& Location);

	/** 서버 전용. 검증에서 거절된 요청 수 (치트/지연 판단용 지표). */
	int32 GetRejectedRequestCount() const { return RejectedRequestCount; }

protected:
	virtual void BeginPlay() override;

	// ---- Components ----
	UPROPERTY(VisibleAnywhere, Category = "NetSample")
	TObjectPtr<USpringArmComponent> CameraBoom;

	UPROPERTY(VisibleAnywhere, Category = "NetSample")
	TObjectPtr<UCameraComponent> FollowCamera;

	UPROPERTY(VisibleAnywhere, Category = "NetSample")
	TObjectPtr<UStaticMeshComponent> BodyMesh;

	UPROPERTY(VisibleAnywhere, Category = "NetSample")
	TObjectPtr<UNSInventoryComponent> Inventory;

	// ---- Gameplay tuning ----
	UPROPERTY(EditDefaultsOnly, Category = "NetSample|Gameplay")
	float MaxHealth = 100.f;

	UPROPERTY(EditDefaultsOnly, Category = "NetSample|Gameplay")
	float InteractRange = 250.f;

	UPROPERTY(EditDefaultsOnly, Category = "NetSample|Gameplay")
	float AttackRange = 200.f;

	UPROPERTY(EditDefaultsOnly, Category = "NetSample|Gameplay")
	float AttackRadius = 100.f;

	UPROPERTY(EditDefaultsOnly, Category = "NetSample|Gameplay")
	float AttackDamage = 20.f;

	UPROPERTY(EditDefaultsOnly, Category = "NetSample|Gameplay")
	float AttackCooldown = 0.5f;

	UPROPERTY(EditDefaultsOnly, Category = "NetSample|Gameplay")
	float RespawnDelay = 3.f;

	/** 한 번에 들 수 있는 광석 수. 가득 차면 납품하러 돌아가야 한다. */
	UPROPERTY(EditDefaultsOnly, Category = "NetSample|Gameplay", meta = (ClampMin = "1"))
	int32 CarryCapacity = 10;

	// ---- Replicated state ----
	UPROPERTY(ReplicatedUsing = OnRep_Health)
	float Health = 100.f;

	UFUNCTION()
	void OnRep_Health(float OldHealth);

	// ---- RPC ----
	/** 의도만 전달. 대상은 서버가 찾는다 (클라이언트가 보낸 대상 포인터를 신뢰하지 않음). */
	UFUNCTION(Server, Reliable)
	void ServerInteract();

	UFUNCTION(Server, Reliable)
	void ServerAttack();

	/** 순수 연출이라 유실돼도 게임 상태에 영향이 없다 → Unreliable. */
	UFUNCTION(NetMulticast, Unreliable)
	void MulticastPlayAttackFX(FVector_NetQuantize Origin);

private:
	// ---- Input (에셋 없이 런타임 생성) ----
	void BuildInputMappings();
	void OnMove(const FInputActionValue& Value);
	void OnLook(const FInputActionValue& Value);
	void OnInteract();
	void OnAttack();

	UPROPERTY(Transient)
	TObjectPtr<UInputMappingContext> MappingContext;

	UPROPERTY(Transient)
	TObjectPtr<UInputAction> MoveAction;

	UPROPERTY(Transient)
	TObjectPtr<UInputAction> LookAction;

	UPROPERTY(Transient)
	TObjectPtr<UInputAction> JumpAction;

	UPROPERTY(Transient)
	TObjectPtr<UInputAction> InteractAction;

	UPROPERTY(Transient)
	TObjectPtr<UInputAction> AttackAction;

	// ---- Server helpers ----
	void SetHealth_Server(float NewHealth);
	void HandleDeath_Server();
	void Respawn_Server();
	void TickBot(float DeltaSeconds);
	bool IsMatchPlaying_Server() const;
	bool IsMatchPlaying_Local() const;
	ANSCharacter* FindNearbyEnemy_Server() const;
	void RejectRequest(const TCHAR* Reason);

	// ---- Shared helpers ----
	FVector GetAttackOrigin() const;
	void PlayAttackFX(const FVector& Origin) const;
	void ApplyDeadState();

	bool bIsBot = false;
	int32 RejectedRequestCount = 0;
	double LastAttackServerTime = -1000.0;
	double LastAttackLocalTime = -1000.0;
	FVector SpawnLocation = FVector::ZeroVector;
	FVector2D BotDirection = FVector2D::ZeroVector;
	float BotRetargetTimer = 0.f;
	float BotDecisionTimer = 0.f;
	FTimerHandle RespawnTimer;
};
