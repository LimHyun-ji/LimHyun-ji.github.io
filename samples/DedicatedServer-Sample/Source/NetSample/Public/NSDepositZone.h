#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "NSDepositZone.generated.h"

class UBoxComponent;
class UStaticMeshComponent;

/**
 * 맵 중앙의 납품 구역. 안에 들어온 캐릭터의 광석을 서버가 점수로 바꾼다.
 *
 * 상태가 전혀 바뀌지 않는 액터라 처음 한 번 복제된 뒤에는 Dormant로 둔다.
 * 판정은 서버 타이머(0.25초)로 한다. BeginOverlap만 쓰면 구역 안에 서 있는 채로 광석을 얻는 경우를 놓친다.
 */
UCLASS()
class NETSAMPLE_API ANSDepositZone : public AActor
{
	GENERATED_BODY()

public:
	ANSDepositZone();

protected:
	virtual void BeginPlay() override;

	UPROPERTY(VisibleAnywhere, Category = "NetSample")
	TObjectPtr<UBoxComponent> Zone;

	UPROPERTY(VisibleAnywhere, Category = "NetSample")
	TObjectPtr<UStaticMeshComponent> Pad;

	UPROPERTY(EditAnywhere, Category = "NetSample", meta = (ClampMin = "0.05"))
	float CheckInterval = 0.25f;

private:
	void CheckOverlaps_Server();

	FTimerHandle CheckTimer;
};
