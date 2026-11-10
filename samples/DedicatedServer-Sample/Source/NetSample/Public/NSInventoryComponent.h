#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "Net/Serialization/FastArraySerializer.h"
#include "NSInventoryComponent.generated.h"

class UNSInventoryComponent;

/** 인벤토리 한 칸. FastArray 항목이라 바뀐 칸만 네트워크로 나간다. */
USTRUCT()
struct FNSInventoryEntry : public FFastArraySerializerItem
{
	GENERATED_BODY()

	UPROPERTY()
	FName ItemId;

	UPROPERTY()
	int32 Count = 0;

	// 클라이언트에서 항목 단위로 호출되는 콜백 → UI 갱신 신호로 사용
	void PreReplicatedRemove(const struct FNSInventoryList& InArraySerializer);
	void PostReplicatedAdd(const struct FNSInventoryList& InArraySerializer);
	void PostReplicatedChange(const struct FNSInventoryList& InArraySerializer);
};

/**
 * FFastArraySerializer: TArray 전체를 비교/전송하지 않고, MarkItemDirty 된 항목만 델타로 보낸다.
 * MMO 인벤토리처럼 칸 수가 많고 한 번에 한두 칸만 바뀌는 데이터에 적합하다.
 */
USTRUCT()
struct FNSInventoryList : public FFastArraySerializer
{
	GENERATED_BODY()

	UPROPERTY()
	TArray<FNSInventoryEntry> Items;

	/** 콜백에서 컴포넌트에 알리기 위한 역참조. 복제하지 않는다. */
	UPROPERTY(NotReplicated)
	TObjectPtr<UNSInventoryComponent> OwnerComponent = nullptr;

	/** 서버 전용. Delta만큼 더하고 결과 수량을 반환한다. */
	int32 AddCount(FName ItemId, int32 Delta);

	/** 서버 전용. 전부 비운다. */
	void Clear();
	int32 GetCount(FName ItemId) const;

	bool NetDeltaSerialize(FNetDeltaSerializeInfo& DeltaParms)
	{
		return FFastArraySerializer::FastArrayDeltaSerialize<FNSInventoryEntry, FNSInventoryList>(Items, DeltaParms, *this);
	}
};

template<>
struct TStructOpsTypeTraits<FNSInventoryList> : public TStructOpsTypeTraitsBase2<FNSInventoryList>
{
	enum { WithNetDeltaSerializer = true };
};

DECLARE_MULTICAST_DELEGATE(FNSOnInventoryChanged);

/**
 * 플레이어 인벤토리.
 * - COND_OwnerOnly: 내 인벤토리는 나에게만 보낸다. 주변 수백 명에게 남의 인벤토리를 보낼 이유가 없다.
 * - 수정은 서버에서만 (AddItem_Server). 클라이언트는 결과를 받아 표시만 한다.
 */
UCLASS(ClassGroup = (NetSample), meta = (BlueprintSpawnableComponent))
class NETSAMPLE_API UNSInventoryComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UNSInventoryComponent();

	virtual void PostInitProperties() override;
	virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

	/** 서버 전용. 결과 수량을 반환한다. */
	int32 AddItem_Server(FName ItemId, int32 Delta);

	/** 서버 전용. 라운드 리셋 / 사망 시 비우기. */
	void Clear_Server();

	int32 GetCount(FName ItemId) const { return Inventory.GetCount(ItemId); }
	const TArray<FNSInventoryEntry>& GetEntries() const { return Inventory.Items; }

	/** UI 갱신용. 서버(리슨)와 클라이언트 양쪽에서 불린다. */
	FNSOnInventoryChanged OnInventoryChanged;

	void NotifyChanged() { OnInventoryChanged.Broadcast(); }

private:
	UPROPERTY(Replicated)
	FNSInventoryList Inventory;
};
