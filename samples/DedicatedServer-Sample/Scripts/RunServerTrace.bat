@echo off
rem Network Insights 용 트레이스를 남기며 서버 실행. 결과: Saved\Profiling\*.utrace -> UnrealInsights.exe 로 열기
rem 사용 예: RunServerTrace.bat -Nodes=3000 -Bots=100 -NetOpt=1
call "%~dp0_Env.bat" || exit /b 1
"%UE_EDITOR%" "%PROJECT%" %MAP% -server -log -port=7777 -trace=default,net -NetTrace=1 -tracefile %*
