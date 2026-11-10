using UnrealBuildTool;

public class NetSampleClientTarget : TargetRules
{
	public NetSampleClientTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Client;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("NetSample");
	}
}
