#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Runtime/Launch/Resources/Version.h"

// UE 5.5부터 AActor의 NetUpdateFrequency / MinNetUpdateFrequency / NetCullDistanceSquared 직접 접근이
// deprecated 되고 Setter가 생겼다. 엔진 버전 차이는 이 파일에서만 흡수한다.
#define NS_UE_5_5_OR_LATER (ENGINE_MAJOR_VERSION > 5 || (ENGINE_MAJOR_VERSION == 5 && ENGINE_MINOR_VERSION >= 5))

namespace NSNet
{
	inline void SetUpdateRates(AActor* Actor, float Frequency, float MinFrequency)
	{
#if NS_UE_5_5_OR_LATER
		Actor->SetNetUpdateFrequency(Frequency);
		Actor->SetMinNetUpdateFrequency(MinFrequency);
#else
		Actor->NetUpdateFrequency = Frequency;
		Actor->MinNetUpdateFrequency = MinFrequency;
#endif
	}

	inline void SetCullDistance(AActor* Actor, float Distance)
	{
#if NS_UE_5_5_OR_LATER
		Actor->SetNetCullDistanceSquared(FMath::Square(Distance));
#else
		Actor->NetCullDistanceSquared = FMath::Square(Distance);
#endif
	}
}
