#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "NSResourceNode.generated.h"

class UStaticMesh;
class UStaticMeshComponent;

UENUM()
enum class ENSNodeKind : uint8
{
	Ore,    // 일반 광석: 1개, 리스폰
	Gold,   // 금광: 3개, 리스폰, 바깥쪽에만 배치
	Drop    // 죽은 플레이어가 떨군 광석 더미: 남은 수량만큼, 다 주우면 사라짐
};

/**
 * 오픈월드에 수천 개 깔리는 채집 오브젝트.
 *
 * - 상태(bAvailable)는 서버만 바꾼다. 클라이언트는 "채집하고 싶다"는 의도만 보낸다 (ANSCharacter::ServerInteract).
 * - 평소에는 바뀌는 값이 없으므로 Dormant 상태로 두어 서버가 매 프레임 복제 후보로 검사하지 않게 한다.
 *   채집/리스폰 순간에만 FlushNetDormancy()로 한 번 깨워 변경분을 보내고 다시 잠든다.
 * - bAvailable은 Push Model: 값이 바뀔 때만 MARK_PROPERTY_DIRTY로 표시해 비교 비용도 없앤다.
 * - Kind는 스폰 이후 바뀌지 않으므로 COND_InitialOnly: 채널이 열릴 때 한 번만 보낸다.
 * - 남은 수량(Yield)은 클라이언트가 알 필요가 없어 복제하지 않는다.
 */
UCLASS()
class NETSAMPLE_API ANSResourceNode : public AActor
{
	GENERATED_BODY()

public:
	ANSResourceNode();

	virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

	bool IsAvailable() const { return bAvailable; }
	ENSNodeKind GetKind() const { return Kind; }

	/** 서버 전용, 스폰 직후(FinishSpawning 전)에 호출. */
	void InitNode_Server(ENSNodeKind InKind, int32 InYield);

	/**
	 * 서버 전용. 가방 여유 공간(FreeSpace)을 받아 실제로 가져간 수량을 반환한다. 0이면 실패.
	 * - Ore / Gold: 전량을 담을 공간이 있어야 성공 (가방이 차면 거절)
	 * - Drop: 담을 수 있는 만큼만 가져가고, 남은 수량이 0이 되면 사라진다
	 */
	int32 Harvest_Server(AActor* Harvester, int32 FreeSpace);

	/** 서버 전용, 라운드 리셋. Drop은 제거, 나머지는 즉시 리스폰. */
	void ResetForRound_Server();

protected:
	virtual void BeginPlay() override;

	UPROPERTY(VisibleAnywhere, Category = "NetSample")
	TObjectPtr<UStaticMeshComponent> Mesh;

	UPROPERTY(EditAnywhere, Category = "NetSample|Resource", meta = (ClampMin = "0.1"))
	float RespawnSeconds = 10.f;

	/** NetOpt=1 일 때 적용하는 컬링 거리 (cm). 기본값(엔진 15000) 대비 줄여 클라이언트별 채널 수를 줄인다. */
	UPROPERTY(EditAnywhere, Category = "NetSample|Network")
	float OptimizedCullDistance = 8000.f;

	UPROPERTY(ReplicatedUsing = OnRep_Kind)
	ENSNodeKind Kind = ENSNodeKind::Ore;

	UPROPERTY(ReplicatedUsing = OnRep_Available)
	bool bAvailable = true;

	UFUNCTION()
	void OnRep_Kind();

	UFUNCTION()
	void OnRep_Available();

private:
	void SetAvailable_Server(bool bNewAvailable);
	void Respawn_Server();
	void ApplyKindVisual();
	void ApplyAvailableVisual();

	UPROPERTY()
	TObjectPtr<UStaticMesh> OreMesh;

	UPROPERTY()
	TObjectPtr<UStaticMesh> GoldMesh;

	UPROPERTY()
	TObjectPtr<UStaticMesh> DropMesh;

	int32 Yield = 1;
	FTimerHandle RespawnTimer;
};
