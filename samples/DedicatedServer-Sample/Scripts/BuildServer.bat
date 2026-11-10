@echo off
rem 패키징된 Win64 데디케이티드 서버 빌드. Server 타깃은 소스 빌드 엔진(GitHub UnrealEngine)에서만 가능하다.
call "%~dp0_Env.bat" || exit /b 1
call "%UE_ROOT%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun ^
  -project="%PROJECT%" -noP4 -platform=Win64 -server -serverplatform=Win64 -noclient ^
  -serverconfig=Development -build -cook -stage -pak -archive -archivedirectory="%~dp0..\Packaged"
