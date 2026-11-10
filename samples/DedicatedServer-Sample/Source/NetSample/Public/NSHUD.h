#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "NSHUD.generated.h"

/** UMG 에셋 없이 Canvas로 그리는 디버그 HUD. 복제된 상태(Health, Inventory)가 클라이언트에 도착했는지 확인용. */
UCLASS()
class NETSAMPLE_API ANSHUD : public AHUD
{
	GENERATED_BODY()

public:
	virtual void DrawHUD() override;
};
