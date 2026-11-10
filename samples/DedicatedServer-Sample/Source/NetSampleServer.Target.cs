using UnrealBuildTool;

public class NetSampleServerTarget : TargetRules
{
	public NetSampleServerTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Server;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("NetSample");
	}
}
