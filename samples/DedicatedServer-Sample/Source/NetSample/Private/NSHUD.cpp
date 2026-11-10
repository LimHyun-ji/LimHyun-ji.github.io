#include "NSHUD.h"

#include "NSCharacter.h"
#include "NSInventoryComponent.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/PlayerState.h"

namespace
{
	const TCHAR* NetModeToString(ENetMode Mode)
	{
		switch (Mode)
		{
		case NM_Standalone:      return TEXT("Standalone");
		case NM_DedicatedServer: return TEXT("DedicatedServer");
		case NM_ListenServer:    return TEXT("ListenServer");
		case NM_Client:          return TEXT("Client");
		default:                 return TEXT("Unknown");
		}
	}
}

void ANSHUD::DrawHUD()
{
	Super::DrawHUD();

	const APlayerController* PC = GetOwningPlayerController();
	if (!PC)
	{
		return;
	}

	// 기본 폰트에 한글 글리프가 없을 수 있어 HUD 문구는 영어로 둔다.
	float Y = 20.f;
	auto Line = [this, &Y](const FString& Text, const FLinearColor& Color = FLinearColor::White)
	{
		DrawText(Text, Color, 20.f, Y);
		Y += 18.f;
	};

	Line(FString::Printf(TEXT("NetMode: %s"), NetModeToString(GetNetMode())));
	if (const APlayerState* PS = PC->PlayerState)
	{
		Line(FString::Printf(TEXT("Ping: %.0f ms"), PS->GetPingInMilliseconds()));
	}

	if (const ANSCharacter* Character = Cast<ANSCharacter>(PC->GetPawn()))
	{
		Line(FString::Printf(TEXT("HP: %.0f / %.0f"), Character->GetHealth(), Character->GetMaxHealth()),
		     Character->IsDead() ? FLinearColor::Red : FLinearColor::Green);

		Line(TEXT("Inventory:"));
		for (const FNSInventoryEntry& Entry : Character->GetInventory()->GetEntries())
		{
			Line(FString::Printf(TEXT("  %s x %d"), *Entry.ItemId.ToString(), Entry.Count));
		}
	}

	Y += 10.f;
	Line(TEXT("[WASD] Move  [Space] Jump  [E] Gather  [LMB] Attack"), FLinearColor::Gray);
}
