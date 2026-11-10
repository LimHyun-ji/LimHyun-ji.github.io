#include "NSBotController.h"

#include "GameFramework/PlayerState.h"

ANSBotController::ANSBotController()
{
	bWantsPlayerState = true;
}

void ANSBotController::InitPlayerState()
{
	Super::InitPlayerState();

	if (PlayerState)
	{
		PlayerState->SetIsABot(true);   // HUD의 "사람 인원" 계산에서 제외
	}
}
