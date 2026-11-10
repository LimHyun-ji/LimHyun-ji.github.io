#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "NSResourceNode.generated.h"

class UStaticMeshComponent;

/**
 * 오픈월드에 수천 개 깔리는 채집 오브젝트.
 *
 * - 상태(bAvailable)는 서버만 바꾼다. 클라이언트는 "채집하고 싶다"는 의도만 보낸다 (ANSCharacter::ServerInteract).
 * - 평소에는 바뀌는 값이 없으므로 Dormant 상태로 두어 서버가 매 프레임 복제 후보로 검사하지 않게 한다.
 *   채집/리스폰 순간에만 FlushNetDormancy()로 한 번 깨워 변경분을 보내고 다시 잠든다.
 * - bAvailable은 Push Model: 값이 바뀔 때만 MARK_PROPERTY_DIRTY로 표시해 비교 비용도 없앤다.
 */
UCLASS()
class NETSAMPLE_API ANSResourceNode : public AActor
{
	GENERATED_BODY()

public:
	ANSResourceNode();

	virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

	bool IsAvailable() const { return bAvailable; }
	FName GetItemId() const { return ItemId; }
	int32 GetYield() const { return Yield; }

	/** 서버 전용. 채집에 성공하면 true. 이미 채집된 상태면(동시 요청 등) false. */
	bool TryHarvest(AActor* Harvester);

protected:
	virtual void BeginPlay() override;

	UPROPERTY(VisibleAnywhere, Category = "NetSample")
	TObjectPtr<UStaticMeshComponent> Mesh;

	UPROPERTY(EditAnywhere, Category = "NetSample|Resource")
	FName ItemId = TEXT("Ore");

	UPROPERTY(EditAnywhere, Category = "NetSample|Resource", meta = (ClampMin = "1"))
	int32 Yield = 1;

	UPROPERTY(EditAnywhere, Category = "NetSample|Resource", meta = (ClampMin = "0.1"))
	float RespawnSeconds = 10.f;

	/** NetOpt=1 일 때 적용하는 컬링 거리 (cm). 기본값(엔진 15000) 대비 줄여 클라이언트별 채널 수를 줄인다. */
	UPROPERTY(EditAnywhere, Category = "NetSample|Network")
	float OptimizedCullDistance = 8000.f;

	UPROPERTY(ReplicatedUsing = OnRep_Available)
	bool bAvailable = true;

	UFUNCTION()
	void OnRep_Available();

private:
	void SetAvailable_Server(bool bNewAvailable);
	void Respawn_Server();
	void ApplyVisual();

	FTimerHandle RespawnTimer;
};
