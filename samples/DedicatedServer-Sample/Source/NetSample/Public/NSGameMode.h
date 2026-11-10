#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "NSGameMode.generated.h"

class ANSResourceNode;

/**
 * 서버 전용 (GameMode는 클라이언트에 존재하지 않는다).
 *
 * 명령줄 옵션 (서버 실행 시):
 *   -Nodes=<N>   채집 오브젝트 수 (기본 400)
 *   -Bots=<N>    서버 측 AI 봇 수 (기본 0)
 *   -NetOpt=<0|1> 1: Dormancy + 컬링 거리 + 갱신 빈도 최적화 (기본), 0: 엔진 기본값 (비교 기준선)
 */
UCLASS()
class NETSAMPLE_API ANSGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	ANSGameMode();

	virtual void InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage) override;
	virtual void BeginPlay() override;

	bool IsNetOptEnabled() const { return bNetOpt; }

protected:
	UPROPERTY(EditDefaultsOnly, Category = "NetSample")
	TSubclassOf<ANSResourceNode> ResourceNodeClass;

	UPROPERTY(EditDefaultsOnly, Category = "NetSample")
	float NodeSpacing = 400.f;

private:
	void SpawnResourceNodes(int32 Count);
	void SpawnBots(int32 Count);
	bool FindGround(const FVector2D& XY, FVector& OutLocation) const;

	int32 NumNodes = 400;
	int32 NumBots = 0;
	bool bNetOpt = true;
	float GridHalfExtent = 0.f;
};
