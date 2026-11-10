using UnrealBuildTool;

public class NetSample : ModuleRules
{
	public NetSample(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[]
		{
			"Core", "CoreUObject", "Engine", "InputCore",
			"EnhancedInput",
			"NetCore",   // Push Model (MARK_PROPERTY_DIRTY)
			"AIModule"   // 부하 테스트용 봇 AAIController
		});
	}
}
