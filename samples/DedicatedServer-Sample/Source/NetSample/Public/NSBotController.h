#pragma once

#include "CoreMinimal.h"
#include "AIController.h"
#include "NSBotController.generated.h"

/** 봇도 PlayerState를 갖게 해서 스코어보드(GameState::PlayerArray)에 함께 표시한다. */
UCLASS()
class NETSAMPLE_API ANSBotController : public AAIController
{
	GENERATED_BODY()

public:
	ANSBotController();

	virtual void InitPlayerState() override;
};
