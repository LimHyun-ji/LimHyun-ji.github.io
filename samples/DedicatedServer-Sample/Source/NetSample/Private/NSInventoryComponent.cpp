#include "NSInventoryComponent.h"

#include "Net/Core/PushModel/PushModel.h"
#include "Net/UnrealNetwork.h"

// ---------------------------------------------------------------------------
// FNSInventoryEntry (클라이언트 콜백)
// ---------------------------------------------------------------------------

void FNSInventoryEntry::PreReplicatedRemove(const FNSInventoryList& InArraySerializer)
{
	if (InArraySerializer.OwnerComponent)
	{
		InArraySerializer.OwnerComponent->NotifyChanged();
	}
}

void FNSInventoryEntry::PostReplicatedAdd(const FNSInventoryList& InArraySerializer)
{
	if (InArraySerializer.OwnerComponent)
	{
		InArraySerializer.OwnerComponent->NotifyChanged();
	}
}

void FNSInventoryEntry::PostReplicatedChange(const FNSInventoryList& InArraySerializer)
{
	if (InArraySerializer.OwnerComponent)
	{
		InArraySerializer.OwnerComponent->NotifyChanged();
	}
}

// ---------------------------------------------------------------------------
// FNSInventoryList
// ---------------------------------------------------------------------------

int32 FNSInventoryList::AddCount(FName ItemId, int32 Delta)
{
	for (FNSInventoryEntry& Entry : Items)
	{
		if (Entry.ItemId == ItemId)
		{
			Entry.Count = FMath::Max(0, Entry.Count + Delta);
			MarkItemDirty(Entry);   // 이 칸만 다음 복제에 포함
			return Entry.Count;
		}
	}

	if (Delta <= 0)
	{
		return 0;
	}

	FNSInventoryEntry& NewEntry = Items.AddDefaulted_GetRef();
	NewEntry.ItemId = ItemId;
	NewEntry.Count = Delta;
	MarkItemDirty(NewEntry);
	return NewEntry.Count;
}

void FNSInventoryList::Clear()
{
	if (Items.Num() > 0)
	{
		Items.Reset();
		MarkArrayDirty();   // 항목 제거는 배열 전체를 dirty로 (클라이언트에서 PreReplicatedRemove 호출)
	}
}

int32 FNSInventoryList::GetCount(FName ItemId) const
{
	for (const FNSInventoryEntry& Entry : Items)
	{
		if (Entry.ItemId == ItemId)
		{
			return Entry.Count;
		}
	}
	return 0;
}

// ---------------------------------------------------------------------------
// UNSInventoryComponent
// ---------------------------------------------------------------------------

UNSInventoryComponent::UNSInventoryComponent()
{
	PrimaryComponentTick.bCanEverTick = false;
	SetIsReplicatedByDefault(true);
}

void UNSInventoryComponent::PostInitProperties()
{
	Super::PostInitProperties();

	// 생성자에서 넣으면 아키타입(CDO)에서 복사될 때 CDO를 가리킬 수 있어,
	// 프로퍼티 초기화가 끝난 이 시점에 자기 자신으로 다시 연결한다.
	Inventory.OwnerComponent = this;
}

void UNSInventoryComponent::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
	Super::GetLifetimeReplicatedProps(OutLifetimeProps);

	FDoRepLifetimeParams Params;
	Params.Condition = COND_OwnerOnly;
	Params.bIsPushBased = true;
	DOREPLIFETIME_WITH_PARAMS_FAST(UNSInventoryComponent, Inventory, Params);
}

int32 UNSInventoryComponent::AddItem_Server(FName ItemId, int32 Delta)
{
	check(GetOwner() && GetOwner()->HasAuthority());

	const int32 NewCount = Inventory.AddCount(ItemId, Delta);
	MARK_PROPERTY_DIRTY_FROM_NAME(UNSInventoryComponent, Inventory, this);

	NotifyChanged();   // 리슨 서버 호스트 UI용 (클라이언트는 FastArray 콜백으로 받는다)
	return NewCount;
}

void UNSInventoryComponent::Clear_Server()
{
	check(GetOwner() && GetOwner()->HasAuthority());

	Inventory.Clear();
	MARK_PROPERTY_DIRTY_FROM_NAME(UNSInventoryComponent, Inventory, this);
	NotifyChanged();
}
